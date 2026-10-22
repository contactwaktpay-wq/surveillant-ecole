/* =========================================================
   Surveillant – École primaire (Mauritanie)  ·  v2
   Application web installable (PWA), fonctionne hors ligne.
   Toutes les données restent sur le téléphone (localStorage).
   ========================================================= */
(function () {
  'use strict';

  const I18N = window.I18N;
  const KEY = 'surveillant_data_v1';
  const VERSION = '2.0';

  /* ---------------- Utilitaires de base ---------------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeNow = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const addDays = (key, n) => { const [y, m, d] = key.split('-').map(Number); return dateKey(new Date(y, m - 1, d + n)); };

  function defaultYear() {
    const d = new Date();
    const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${y + 1}`;
  }
  const DEF_SCHOOL = () => ({ name: '', supervisor: '', phone: '', year: defaultYear() });
  const DEF_SETTINGS = () => ({ sessions: 1, fees: false, feeAmount: 0, startMonth: 10, pin: null, msgLang: 'both' });

  function freshDB(lang) {
    return {
      v: 2, lang,
      school: DEF_SCHOOL(), settings: DEF_SETTINGS(),
      classes: I18N[lang].default_classes.map((n) => ({ id: uid(), name: n })),
      students: [], calls: {}, justifs: {}, incidents: [], exits: [], payments: {},
      lastBackup: null
    };
  }
  // Mise à niveau des données de la version 1 (aucune perte)
  function migrate(d) {
    d.school = Object.assign(DEF_SCHOOL(), d.school || {});
    d.settings = Object.assign(DEF_SETTINGS(), d.settings || {});
    ['calls', 'justifs', 'payments'].forEach((k) => { d[k] = d[k] || {}; });
    ['incidents', 'exits', 'students', 'classes'].forEach((k) => { d[k] = d[k] || []; });
    d.lang = d.lang || 'fr';
    if (d.attendance) {
      Object.entries(d.attendance).forEach(([date, marks]) => {
        Object.entries(marks || {}).forEach(([sid, s]) => {
          const st = d.students.find((x) => x.id === sid); if (!st) return;
          const k = `${date}|J|${st.classId}`;
          const c = d.calls[k] || (d.calls[k] = { date, session: 'J', classId: st.classId, status: 'saved', savedAt: null, marks: {}, late: {}, notified: {} });
          c.marks[sid] = s;
        });
      });
      delete d.attendance;
    }
    d.v = 2;
    return d;
  }
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.classes) return migrate(d); } catch (e) { /* ignore */ }
    return freshDB((navigator.language || 'fr').startsWith('ar') ? 'ar' : 'fr');
  }
  let db = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { alert(t('storage_full')); }
  }

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const t = (k) => (I18N[db.lang][k] !== undefined ? I18N[db.lang][k] : I18N.fr[k] !== undefined ? I18N.fr[k] : k);
  const tf = (k, o) => String(t(k)).replace(/\{(\w+)\}/g, (_, x) => (o[x] !== undefined ? o[x] : ''));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const locFor = (lang) => (lang === 'ar' ? 'ar-MR-u-nu-latn' : 'fr-FR');
  function fmtDate(key, long = true, lang = db.lang) {
    if (!key) return '';
    const [y, m, d] = key.split('-').map(Number);
    try {
      return new Date(y, m - 1, d).toLocaleDateString(locFor(lang), long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) { return key; }
  }
  function fmtMonth(ym, lang = db.lang) {
    const [y, m] = ym.split('-').map(Number);
    try { return new Date(y, m - 1, 1).toLocaleDateString(locFor(lang), { month: 'long', year: 'numeric' }); } catch (e) { return ym; }
  }
  const fmtMoney = (n) => (Number(n) || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' ' + t('currency');
  const byName = (a, b) => a.name.localeCompare(b.name, db.lang === 'ar' ? 'ar' : 'fr');
  const classById = (id) => db.classes.find((c) => c.id === id);
  const studentById = (id) => db.students.find((s) => s.id === id);
  const studentsOf = (cid) => db.students.filter((s) => s.classId === cid).sort(byName);
  const className = (st) => { const c = st && classById(st.classId); return c ? c.name : ''; };
  const cleanPhone = (p) => String(p || '').replace(/[^\d+]/g, '');
  function waPhone(p) {
    let n = cleanPhone(p).replace(/^\+/, '').replace(/^00/, '');
    if (n.length === 8) n = '222' + n; // numéro mauritanien local
    return n;
  }
  const waLink = (phone, text) => (phone ? `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`);
  const smsLink = (phone, text) => `sms:${cleanPhone(phone)}?body=${encodeURIComponent(text)}`;

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 2200);
  }
  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    $('#modal .modal-card').scrollTop = 0;
    if (onMount) onMount($('#modalBody'));
  }
  function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });
  function confirmBox(message, okLabel, onOk, danger) {
    openModal(`<h2>${esc(message)}</h2>
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button>
      <button class="btn ${danger ? 'danger-solid' : ''}" id="cfOk">${esc(okLabel)}</button></div>`, (m) => {
      $('#cfOk', m).onclick = () => { closeModal(); onOk(); };
    });
  }

  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  const csvCell = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const csvDownload = (name, rows) => download(name, '\ufeff' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');

  /* ---------------- Séances & appels ---------------- */
  const sessionsList = () => (db.settings.sessions === 2 ? ['M', 'S'] : ['J']);
  const currentSession = () => (db.settings.sessions === 2 ? (new Date().getHours() < 13 ? 'M' : 'S') : 'J');
  const sesLabel = (s) => t('ses_' + s);
  const callKey = (date, ses, cid) => `${date}|${ses}|${cid}`;
  const getCall = (date, ses, cid) => db.calls[callKey(date, ses, cid)] || null;
  function ensureCall(date, ses, cid) {
    const k = callKey(date, ses, cid);
    return db.calls[k] || (db.calls[k] = { date, session: ses, classId: cid, status: 'draft', savedAt: null, by: '', marks: {}, late: {}, notified: {} });
  }
  const callsOfDate = (date) => Object.values(db.calls).filter((c) => c.date === date);
  const justifOf = (date, sid) => db.justifs[`${date}|${sid}`] || null;

  function dayStats(date, ses) {
    const res = { total: 0, P: 0, A: 0, R: 0, saved: 0, classesWithStudents: 0, perClass: [] };
    db.classes.forEach((c) => {
      const st = studentsOf(c.id);
      const call = getCall(date, ses, c.id);
      const pc = { cls: c, total: st.length, P: 0, A: 0, R: 0, marked: 0, call, absents: [], lates: [] };
      st.forEach((s) => {
        const v = call && call.marks[s.id];
        if (v) { pc.marked++; pc[v]++; }
        if (v === 'A') pc.absents.push(s);
        if (v === 'R') pc.lates.push(s);
      });
      res.total += st.length; res.P += pc.P; res.A += pc.A; res.R += pc.R;
      if (st.length) res.classesWithStudents++;
      if (st.length && call && call.status === 'saved') res.saved++;
      res.perClass.push(pc);
    });
    return res;
  }
  // Tous les absents d'une date (toutes séances), dédoublonnés par élève
  function absentsOfDate(date) {
    const map = new Map();
    callsOfDate(date).forEach((c) => Object.entries(c.marks).forEach(([sid, v]) => {
      if (v !== 'A') return;
      const st = studentById(sid); if (!st) return;
      const e = map.get(sid) || { st, sessions: [], notified: false, calls: [] };
      e.sessions.push(c.session); e.calls.push(c);
      if (c.notified && c.notified[sid]) e.notified = true;
      map.set(sid, e);
    }));
    return [...map.values()].sort((a, b) => (className(a.st) + a.st.name).localeCompare(className(b.st) + b.st.name));
  }
  function studentCounters(sid) {
    let A = 0, R = 0, J = 0; const absDates = new Set();
    Object.values(db.calls).forEach((c) => {
      const v = c.marks[sid];
      if (v === 'A') { A++; absDates.add(c.date); if (justifOf(c.date, sid)) J++; }
      if (v === 'R') R++;
    });
    return { A, R, J, NJ: A - J, absDates: [...absDates].sort().reverse() };
  }

  /* ---------------- Messages aux parents (FR / AR) ---------------- */
  function whenText(date, ses, lang) {
    const today = date === dateKey();
    const s = ses === 'M' ? (lang === 'ar' ? ' (الفترة الصباحية)' : ' (matin)') : ses === 'S' ? (lang === 'ar' ? ' (الفترة المسائية)' : ' (après-midi)') : '';
    if (lang === 'ar') return (today ? 'اليوم' : 'يوم ' + fmtDate(date, true, 'ar')) + s;
    return (today ? "aujourd'hui" : 'le ' + fmtDate(date, true, 'fr')) + s;
  }
  function buildMsg(type, st, x = {}) {
    const F = st.sex === 'F', G = st.sex === 'G';
    const kidFr = F ? 'votre fille' : G ? 'votre fils' : 'votre enfant';
    const kidAr = F ? 'ابنتكم' : G ? 'ابنكم' : 'ابنكم/ابنتكم';
    const e = F ? 'e' : G ? '' : '(e)';
    const arF = (m, f, u) => (F ? f : G ? m : u);
    const cn = className(st);
    const schFr = db.school.name ? `l'école ${db.school.name}` : "l'école";
    const schAr = db.school.name ? `مدرسة ${db.school.name}` : 'المدرسة';
    const sigFr = db.school.supervisor ? `\n— ${db.school.supervisor}, surveillant` : '';
    const sigAr = db.school.supervisor ? `\n— ${db.school.supervisor}، المراقب` : '';
    const wFr = x.date ? whenText(x.date, x.session, 'fr') : '';
    const wAr = x.date ? whenText(x.date, x.session, 'ar') : '';
    let fr = '', ar = '';
    if (type === 'absent') {
      fr = `Bonjour, ${schFr} vous informe que ${kidFr} ${st.name} (${cn}) est absent${e} ${wFr}. Merci de nous indiquer le motif de cette absence.`;
      ar = `السلام عليكم، تُعلمكم ${schAr} أن ${kidAr} ${st.name} (${cn}) ${arF('غائب', 'غائبة', 'غائب(ة)')} ${wAr}. نرجو إفادتنا بسبب الغياب.`;
    } else if (type === 'late') {
      fr = `Bonjour, ${schFr} vous informe que ${kidFr} ${st.name} (${cn}) est arrivé${e} en retard ${wFr}${x.time ? ' à ' + x.time : ''}. Merci de veiller à la ponctualité.`;
      ar = `السلام عليكم، تُعلمكم ${schAr} أن ${kidAr} ${st.name} (${cn}) ${arF('وصل متأخراً', 'وصلت متأخرة', 'وصل(ت) متأخراً')} ${wAr}${x.time ? ' على الساعة ' + x.time : ''}. نرجو الحرص على الانضباط في المواعيد.`;
    } else if (type === 'exit') {
      fr = `Bonjour, ${schFr} vous informe que ${kidFr} ${st.name} (${cn}) a quitté l'école ${wFr}${x.time ? ' à ' + x.time : ''}${x.by ? `, récupéré${e} par ${x.by}` : ''}.`;
      ar = `السلام عليكم، تُعلمكم ${schAr} أن ${kidAr} ${st.name} (${cn}) ${arF('غادر', 'غادرت', 'غادر(ت)')} المدرسة ${wAr}${x.time ? ' على الساعة ' + x.time : ''}${x.by ? ` برفقة ${x.by}` : ''}.`;
    } else if (type === 'convoc') {
      fr = `Bonjour, ${schFr} vous prie de bien vouloir passer à l'école au sujet de ${kidFr} ${st.name} (${cn}).${x.reason ? ' Motif : ' + x.reason + '.' : ''} Merci.`;
      ar = `السلام عليكم، ترجو ${schAr} حضوركم إلى المدرسة بخصوص ${kidAr} ${st.name} (${cn}).${x.reasonAr || x.reason ? ' السبب: ' + (x.reasonAr || x.reason) + '.' : ''} شكراً لكم.`;
    } else if (type === 'fee') {
      fr = `Bonjour, ${schFr} vous rappelle que la mensualité de ${fmtMonth(x.month, 'fr')} pour ${kidFr} ${st.name} (${cn})${x.amount ? ` (${x.amount} MRU)` : ''} n'est pas encore réglée. Merci de bien vouloir régulariser.`;
      ar = `السلام عليكم، تذكّركم ${schAr} بأن رسوم شهر ${fmtMonth(x.month, 'ar')} الخاصة بـ${kidAr} ${st.name} (${cn})${x.amount ? ` (${x.amount} أوقية جديدة)` : ''} لم تُسدَّد بعد. نرجو التكرم بالتسوية.`;
    }
    fr += sigFr; ar += sigAr;
    const ml = db.settings.msgLang;
    return ml === 'fr' ? fr : ml === 'ar' ? ar : ar + '\n\n' + fr;
  }
  // Boutons de contact : WhatsApp / SMS / Appel
  function contactBtns(st, text, extra = '') {
    const ph = st.phone || st.phone2 || '';
    return `<div class="contact-btns" ${extra}>
      <a class="cbtn wa" target="_blank" rel="noopener" href="${esc(waLink(ph, text))}" data-sent title="WhatsApp">💬</a>
      ${ph ? `<a class="cbtn sms" href="${esc(smsLink(ph, text))}" data-sent title="SMS">✉️</a><a class="cbtn tel" href="tel:${esc(cleanPhone(ph))}" title="${t('call')}">📞</a>` : ''}
    </div>`;
  }

  /* ---------------- Navigation ---------------- */
  let tab = 'home';
  const state = {
    appelClass: null, appelDate: dateKey(), appelSes: currentSession(),
    homeSes: currentSession(),
    reg: 'incidents', incFilter: 'today', exitFilter: 'today', absMode: 'date', absDate: dateKey(),
    elevesClass: null, search: '',
    plus: 'menu', feeMonth: null, feeClass: 'all', feeFilter: 'all', repMonth: monthKey()
  };
  function setTab(name, keepSub) {
    tab = name;
    if (name === 'plus' && !keepSub) state.plus = 'menu';
    $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    render();
    window.scrollTo(0, 0);
  }
  $('#tabbar').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });

  function applyLang() {
    document.documentElement.lang = db.lang;
    document.documentElement.dir = db.lang === 'ar' ? 'rtl' : 'ltr';
    $('#appTitle').textContent = t('app');
    $('#schoolName').textContent = db.school.name ? db.school.name + (db.school.year ? ' · ' + db.school.year : '') : t('app_sub');
    $('#langBtn').textContent = db.lang === 'ar' ? 'FR' : 'ع';
    $('#installBtn').textContent = t('install');
    $$('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t)));
  }
  $('#langBtn').addEventListener('click', () => { db.lang = db.lang === 'ar' ? 'fr' : 'ar'; save(); render(); });

  function render() {
    applyLang();
    const v = $('#view');
    v.classList.remove('with-savebar');
    ({ home: renderHome, appel: renderAppel, registre: renderRegistre, eleves: renderEleves, plus: renderPlus })[tab](v);
  }
  const sesChips = (cur, attr) => (db.settings.sessions === 2
    ? `<div class="seg-ctl">${sessionsList().map((s) => `<button class="${s === cur ? 'on' : ''}" ${attr}="${s}">${sesLabel(s)}</button>`).join('')}</div>` : '');
  const studentOptions = (selected) => db.classes.map((c) => {
    const st = studentsOf(c.id); if (!st.length) return '';
    return `<optgroup label="${esc(c.name)}">${st.map((s) => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</optgroup>`;
  }).join('');

  /* ======================= ACCUEIL ======================= */
  function renderHome(v) {
    const key = dateKey();
    if (!sessionsList().includes(state.homeSes)) state.homeSes = currentSession();
    const ses = state.homeSes;
    const s = dayStats(key, ses);
    const incToday = db.incidents.filter((i) => i.date === key).length;
    const exitsToday = db.exits.filter((i) => i.date === key).length;
    const abs = absentsOfDate(key);
    const toNotify = abs.filter((a) => !a.notified && !justifOf(key, a.st.id)).length;
    const noStudents = !db.students.length;
    const backupOld = !noStudents && (!db.lastBackup || Date.now() - new Date(db.lastBackup).getTime() > 7 * 864e5);
    const rate = s.P + s.A + s.R ? Math.round(((s.P + s.R) / (s.P + s.A + s.R)) * 100) : null;

    v.innerHTML = `
      <div class="home-head">
        <p class="date-line">${esc(fmtDate(key))}</p>
        ${sesChips(ses, 'data-hses')}
      </div>
      ${noStudents ? `<div class="card setup">
        <h2>👋 ${t('welcome_title')}</h2>
        <ol class="steps">
          <li><b>${t('step1')}</b><button class="btn light small" data-go="settings">${t('open')}</button></li>
          <li><b>${t('step2')}</b><button class="btn light small" id="homeDiv">🏫 ${t('divisions_btn')}</button></li>
          <li><b>${t('step3')}</b><button class="btn gold small" id="homeImport">📥 ${t('import_list')}</button></li>
        </ol></div>` : ''}
      ${backupOld ? `<div class="hint warn">💾 ${t('backup_reminder')} <button class="btn small" id="quickBackup">${t('backup_now')}</button></div>` : ''}
      <div class="stats">
        <div class="stat"><b>${s.total}</b><span>${t('enrolled')}</span></div>
        <div class="stat"><b>${s.P}</b><span>${t('present')}${rate !== null ? ` · ${rate}% ${t('rate_short')}` : ''}</span></div>
        <div class="stat red"><b>${s.A}</b><span>${t('absent')}</span></div>
        <div class="stat orange"><b>${s.R}</b><span>${t('late')}</span></div>
      </div>
      <div class="quick">
        <button data-q="appel"><span>✅</span>${t('q_appel')}</button>
        <button data-q="incident"><span>⚠️</span>${t('q_incident')}</button>
        <button data-q="exit"><span>🚪</span>${t('q_exit')}</button>
        <button data-q="notify"><span>💬</span>${t('q_notify')}${toNotify ? `<i class="dot">${toNotify}</i>` : ''}</button>
      </div>
      <div class="card">
        <div class="card-head"><h2>${t('today_calls')}${db.settings.sessions === 2 ? ' · ' + sesLabel(ses) : ''}</h2>
          <span class="badge ${s.saved && s.saved === s.classesWithStudents ? 'ok' : 'no'}">${s.saved}/${s.classesWithStudents}</span></div>
        <div class="progress"><i style="width:${s.classesWithStudents ? Math.round((s.saved / s.classesWithStudents) * 100) : 0}%"></i></div>
        ${db.classes.length ? `<ul class="list">${s.perClass.map((p) => {
          const st = !p.total ? 'empty' : p.call && p.call.status === 'saved' ? 'saved' : p.call && Object.keys(p.call.marks).length ? 'draft' : 'todo';
          const badge = { saved: `<span class="badge ok">✓ ${p.call && p.call.savedAt ? esc(p.call.savedAt) : t('saved_short')}</span>`, draft: `<span class="badge no">${t('draft')}</span>`, todo: `<span class="badge grey">${t('todo')}</span>`, empty: '' }[st];
          return `<li data-goto-class="${p.cls.id}" class="tap"><div class="grow"><b>${esc(p.cls.name)}</b>
            <div class="sub">${p.total} ${t('students_l')}${p.marked ? ` · <span class="txt-red">${t('abs_short')} ${p.A}</span> · <span class="txt-orange">${t('late_short')} ${p.R}</span>` : ''}</div></div>${badge}</li>`;
        }).join('')}</ul>` : `<p class="empty">${t('no_class')}</p>`}
      </div>
      <div class="card">
        <div class="mini-stats">
          <div><b>${incToday}</b><span>${t('incidents')}</span></div>
          <div><b>${exitsToday}</b><span>${t('exits')}</span></div>
          <div><b>${abs.length}</b><span>${t('absent_students')}</span></div>
        </div>
        <h2 class="mt">📋 ${t('daily_report')}</h2>
        <div class="btn-row">
          <button class="btn" id="shareBtn">💬 ${t('share')}</button>
          <button class="btn light" id="printBtn">🖨️ ${t('print_pdf')}</button>
        </div>
        <button class="btn light block mt" id="copyBtn">📋 ${t('copy_report')}</button>
      </div>`;

    $$('[data-hses]', v).forEach((b) => (b.onclick = () => { state.homeSes = b.dataset.hses; render(); }));
    $$('[data-goto-class]', v).forEach((li) => (li.onclick = () => {
      state.appelClass = li.dataset.gotoClass; state.appelDate = key; state.appelSes = ses; setTab('appel');
    }));
    $$('[data-go="settings"]', v).forEach((b) => (b.onclick = () => { state.plus = 'settings'; setTab('plus', true); }));
    const hd = $('#homeDiv', v); if (hd) hd.onclick = () => divisionsModal();
    const hi = $('#homeImport', v); if (hi) hi.onclick = () => importModal(db.classes[0] && db.classes[0].id);
    const qb = $('#quickBackup', v); if (qb) qb.onclick = () => doBackup(true);
    $$('[data-q]', v).forEach((b) => (b.onclick = () => {
      const q = b.dataset.q;
      if (q === 'appel') { state.appelDate = key; state.appelSes = ses; setTab('appel'); }
      if (q === 'incident') incidentModal();
      if (q === 'exit') exitModal();
      if (q === 'notify') notifyModal(key);
    }));
    $('#shareBtn', v).onclick = () => shareText(buildDailyReport(key));
    $('#copyBtn', v).onclick = () => copyText(buildDailyReport(key));
    $('#printBtn', v).onclick = () => printDaily(key);
  }

  /* ======================= APPEL ======================= */
  function renderAppel(v) {
    if (!db.classes.length) { v.innerHTML = `<div class="card"><p class="empty">${t('no_class')}</p></div>`; return; }
    if (!classById(state.appelClass)) state.appelClass = (db.classes.find((c) => studentsOf(c.id).length) || db.classes[0]).id;
    if (!sessionsList().includes(state.appelSes)) state.appelSes = currentSession();
    const cid = state.appelClass, date = state.appelDate, ses = state.appelSes;
    const st = studentsOf(cid);
    const call = getCall(date, ses, cid);
    const marks = call ? call.marks : {};
    const saved = call && call.status === 'saved';
    const editing = call && call.status === 'draft' && call.prev;
    const cnt = { P: 0, A: 0, R: 0 };
    st.forEach((s) => { if (marks[s.id]) cnt[marks[s.id]]++; });
    const unmarked = st.length - cnt.P - cnt.A - cnt.R;
    const lbl = { P: t('st_P'), A: t('st_A'), R: t('st_R') };
    const idx = db.classes.findIndex((c) => c.id === cid);
    const nextCls = db.classes.slice(idx + 1).find((c) => studentsOf(c.id).length && !(getCall(date, ses, c.id) || {}).savedAt);

    let body = '';
    if (!st.length) {
      body = `<div class="card"><p class="empty">${t('no_student')}</p><button class="btn gold block" id="goImport">📥 ${t('import_list')}</button></div>`;
    } else if (saved) {
      const absents = st.filter((s) => marks[s.id] === 'A');
      const lates = st.filter((s) => marks[s.id] === 'R');
      body = `
        <div class="banner ok">
          <div><b>✅ ${t('call_saved')}</b><div class="sub">${call.savedAt ? tf('saved_at', { time: call.savedAt }) : ''}${call.by ? ' · ' + esc(call.by) : ''}</div></div>
          <button class="btn small light" id="editCall">✏️ ${t('edit')}</button>
        </div>
        <div class="summary-bar">
          <span class="badge ok">${t('present')} ${cnt.P}</span>
          <span class="badge red">${t('absent')} ${cnt.A}</span>
          <span class="badge no">${t('late')} ${cnt.R}</span>
        </div>
        ${absents.length ? `<div class="card"><h2>❌ ${t('absent')} (${absents.length})</h2>
          ${absents.map((s) => absentRow(s, date, ses, call)).join('')}
          <p class="legend">${t('notify_help')}</p></div>` : ''}
        ${lates.length ? `<div class="card"><h2>⏰ ${t('late')} (${lates.length})</h2>
          ${lates.map((s) => `<div class="person-row"><div class="grow"><b>${esc(s.name)}</b><div class="sub">${call.late[s.id] ? '⏱ ' + esc(call.late[s.id]) : ''}</div></div>
            ${contactBtns(s, buildMsg('late', s, { date, session: ses, time: call.late[s.id] }))}</div>`).join('')}</div>` : ''}
        <div class="card"><h2>${t('class_list')}</h2>
          ${st.map((s, i) => `<div class="student-row ro"><span class="num">${i + 1}</span><span class="name">${esc(s.name)}</span>
            <span class="pill ${marks[s.id] || ''}">${marks[s.id] ? lbl[marks[s.id]] : '—'}</span></div>`).join('')}
        </div>
        <div class="btn-row">
          <button class="btn light" id="shareClass">💬 ${t('share')}</button>
          ${nextCls ? `<button class="btn" id="nextClass">${esc(nextCls.name)} →</button>` : ''}
        </div>`;
    } else {
      v.classList.add('with-savebar');
      body = `
        ${editing ? `<div class="banner warn"><div><b>✏️ ${t('editing')}</b><div class="sub">${t('editing_help')}</div></div>
            <button class="btn small light" id="cancelEdit">${t('cancel')}</button></div>`
          : Object.keys(marks).length ? `<div class="banner warn"><div><b>📝 ${t('draft')}</b><div class="sub">${t('draft_help')}</div></div></div>` : ''}
        <div class="toolbar">
          <button class="btn light small" id="allP">✅ ${t('all_present')}</button>
          <button class="btn light small" id="restP">☑️ ${t('rest_present')}</button>
          <button class="btn danger small" id="clearAtt">${t('reset_call')}</button>
        </div>
        <div class="card">
          ${st.map((s, i) => `
            <div class="student-row" data-sid="${s.id}">
              <span class="num">${i + 1}</span>
              <span class="name">${esc(s.name)}${marks[s.id] === 'R' && call.late[s.id] ? `<button class="late-time" data-late="${s.id}">⏱ ${esc(call.late[s.id])}</button>` : ''}${s.health ? ' <span title="' + esc(s.health) + '">🩺</span>' : ''}</span>
              <div class="seg">${['P', 'A', 'R'].map((x) => `<button class="${x} ${marks[s.id] === x ? 'on' : ''}" data-st="${x}" aria-label="${t('st_' + x + '_long')}">${lbl[x]}</button>`).join('')}</div>
            </div>`).join('')}
          <p class="legend">${t('legend')}</p>
        </div>
        <div class="savebar">
          <div class="savebar-info"><b>${st.length - unmarked}/${st.length}</b> <span>${t('marked')}</span>
            <span class="txt-red">· ${cnt.A} ${t('abs_short')}</span> <span class="txt-orange">· ${cnt.R} ${t('late_short')}</span></div>
          <button class="btn save-btn" id="saveCall">💾 ${t('save_call')}</button>
        </div>`;
    }

    v.innerHTML = `
      <div class="card appel-filters">
        <div class="row2">
          <div><label>${t('class')}</label>
            <select id="clsSel">${db.classes.map((c) => {
              const cc = getCall(date, ses, c.id);
              const mark = cc && cc.status === 'saved' ? '✓ ' : cc && Object.keys(cc.marks).length ? '✎ ' : '';
              return `<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${mark}${esc(c.name)} (${studentsOf(c.id).length})</option>`;
            }).join('')}</select></div>
          <div><label>${t('date')}</label><input type="date" id="dateSel" value="${date}" max="${dateKey()}"></div>
        </div>
        ${db.settings.sessions === 2 ? `<div class="mt">${sesChips(ses, 'data-ases')}</div>` : ''}
      </div>
      ${body}`;

    $('#clsSel', v).onchange = (e) => { state.appelClass = e.target.value; render(); };
    $('#dateSel', v).onchange = (e) => { if (e.target.value) { state.appelDate = e.target.value; render(); } };
    $$('[data-ases]', v).forEach((b) => (b.onclick = () => { state.appelSes = b.dataset.ases; render(); }));
    const gi = $('#goImport', v); if (gi) gi.onclick = () => importModal(cid);

    if (saved) {
      $('#editCall', v).onclick = () => {
        call.prev = { marks: Object.assign({}, call.marks), late: Object.assign({}, call.late), savedAt: call.savedAt, by: call.by };
        call.status = 'draft'; save(); render();
      };
      bindAbsentRows(v, date, ses);
      $('#shareClass', v).onclick = () => shareText(buildClassReport(call));
      const nc = $('#nextClass', v); if (nc) nc.onclick = () => { state.appelClass = nextCls.id; render(); window.scrollTo(0, 0); };
      return;
    }
    if (!st.length) return;
    const c = () => ensureCall(date, ses, cid);
    $('#allP', v).onclick = () => { const k = c(); st.forEach((s) => { k.marks[s.id] = 'P'; delete k.late[s.id]; }); save(); render(); };
    $('#restP', v).onclick = () => { const k = c(); st.forEach((s) => { if (!k.marks[s.id]) k.marks[s.id] = 'P'; }); save(); render(); };
    $('#clearAtt', v).onclick = () => confirmBox(t('clear_confirm'), t('reset_call'), () => { const k = c(); k.marks = {}; k.late = {}; save(); render(); }, true);
    const ce = $('#cancelEdit', v);
    if (ce) ce.onclick = () => { Object.assign(call, call.prev, { status: 'saved' }); delete call.prev; save(); render(); };
    $$('.student-row[data-sid]', v).forEach((row) => row.addEventListener('click', (e) => {
      const lt = e.target.closest('[data-late]');
      if (lt) { editLateTime(c(), lt.dataset.late); return; }
      const b = e.target.closest('button[data-st]'); if (!b) return;
      const k = c(), sid = row.dataset.sid, val = b.dataset.st;
      if (k.marks[sid] === val) { delete k.marks[sid]; delete k.late[sid]; }
      else { k.marks[sid] = val; if (val === 'R') k.late[sid] = k.late[sid] || timeNow(); else delete k.late[sid]; }
      save();
      // mise à jour légère (sans re-rendu complet pour garder le défilement)
      $$('button[data-st]', row).forEach((x) => x.classList.toggle('on', k.marks[sid] === x.dataset.st));
      const nm = $('.name', row);
      const old = $('.late-time', nm); if (old) old.remove();
      if (k.marks[sid] === 'R') nm.insertAdjacentHTML('beforeend', `<button class="late-time" data-late="${sid}">⏱ ${esc(k.late[sid])}</button>`);
      updateSavebar(v, st, k);
    }));
    $('#saveCall', v).onclick = () => {
      const k = c();
      const missing = st.filter((s) => !k.marks[s.id]);
      const doSave = () => {
        k.status = 'saved'; k.savedAt = timeNow(); k.by = db.school.supervisor || ''; delete k.prev;
        save(); toast('✅ ' + t('call_saved'));
        render(); window.scrollTo(0, 0);
      };
      if (missing.length === st.length) { toast(t('nothing_marked')); return; }
      if (missing.length) {
        openModal(`<h2>${tf('unmarked_q', { n: missing.length })}</h2>
          <p class="muted">${missing.slice(0, 8).map((s) => esc(s.name)).join(', ')}${missing.length > 8 ? '…' : ''}</p>
          <button class="btn block" id="mkP">✅ ${t('mark_present_save')}</button>
          <button class="btn light block mt" data-close>${t('back_to_call')}</button>`, (m) => {
          $('#mkP', m).onclick = () => { missing.forEach((s) => (k.marks[s.id] = 'P')); closeModal(); doSave(); };
        });
      } else doSave();
    };
  }
  function updateSavebar(v, st, k) {
    const cnt = { P: 0, A: 0, R: 0 };
    st.forEach((s) => { if (k.marks[s.id]) cnt[k.marks[s.id]]++; });
    const info = $('.savebar-info', v);
    if (info) info.innerHTML = `<b>${cnt.P + cnt.A + cnt.R}/${st.length}</b> <span>${t('marked')}</span>
      <span class="txt-red">· ${cnt.A} ${t('abs_short')}</span> <span class="txt-orange">· ${cnt.R} ${t('late_short')}</span>`;
  }
  function editLateTime(call, sid) {
    const s = studentById(sid);
    openModal(`<h2>⏱ ${esc(s.name)}</h2><label>${t('arrival_time')}</label><input type="time" id="lt" value="${esc(call.late[sid] || timeNow())}">
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="ltOk">${t('save')}</button></div>`, (m) => {
      $('#ltOk', m).onclick = () => { call.late[sid] = $('#lt', m).value || timeNow(); save(); closeModal(); render(); };
    });
  }
  function absentRow(s, date, ses, call) {
    const j = justifOf(date, s.id);
    const notified = callsOfDate(date).some((c) => c.marks[s.id] === 'A' && c.notified && c.notified[s.id]);
    return `<div class="person-row" data-abs="${s.id}" data-callkey="${call ? callKey(call.date, call.session, call.classId) : ''}">
      <div class="grow"><b>${esc(s.name)}</b>
        <div class="sub">${j ? `<span class="badge ok">✓ ${t('justified')} · ${esc(t('mot_' + j.motif))}</span>` : `<span class="badge red">${t('not_justified')}</span>`}
        ${notified ? `<span class="badge blue">📨 ${t('notified')}</span>` : ''}${!s.phone && !s.phone2 ? `<span class="badge grey">${t('no_phone')}</span>` : ''}</div></div>
      ${contactBtns(s, buildMsg('absent', s, { date, session: ses }))}
      <button class="cbtn" data-justify="${s.id}" title="${t('justify')}">📝</button>
    </div>`;
  }
  function bindAbsentRows(root, date) {
    $$('[data-abs]', root).forEach((row) => {
      const sid = row.dataset.abs;
      const ck = row.dataset.callkey;
      $$('[data-sent]', row).forEach((a) => a.addEventListener('click', () => {
        const keys = ck ? [ck] : callsOfDate(date).filter((c) => c.marks[sid] === 'A').map((c) => callKey(c.date, c.session, c.classId));
        keys.forEach((k) => { const c = db.calls[k]; if (c) { c.notified = c.notified || {}; c.notified[sid] = true; } });
        save(); setTimeout(() => { if ($('#modal').hidden) render(); else { const b = row.querySelector('.sub'); if (b && !b.querySelector('.blue')) b.insertAdjacentHTML('beforeend', `<span class="badge blue">📨 ${t('notified')}</span>`); } }, 400);
      }));
      const jb = $('[data-justify]', row); if (jb) jb.onclick = () => justifyModal(date, sid);
    });
  }
  function justifyModal(date, sid) {
    const s = studentById(sid); const j = justifOf(date, sid) || { motif: 'maladie', note: '' };
    openModal(`<h2>📝 ${t('justify')} – ${esc(s.name)}</h2>
      <p class="muted" style="margin-top:-4px">${esc(fmtDate(date))}</p>
      <label>${t('motif')}</label>
      <select id="jm">${MOTIFS.map((m) => `<option value="${m}" ${m === j.motif ? 'selected' : ''}>${t('mot_' + m)}</option>`).join('')}</select>
      <label>${t('note')}</label><input id="jn" value="${esc(j.note)}" placeholder="${t('justif_ph')}">
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="jOk">${t('save')}</button></div>
      ${justifOf(date, sid) ? `<button class="btn danger block mt" id="jDel">${t('remove_justif')}</button>` : ''}`, (m) => {
      $('#jOk', m).onclick = () => { db.justifs[`${date}|${sid}`] = { motif: $('#jm', m).value, note: $('#jn', m).value.trim(), at: new Date().toISOString() }; save(); closeModal(); render(); toast(t('saved')); };
      const d = $('#jDel', m); if (d) d.onclick = () => { delete db.justifs[`${date}|${sid}`]; save(); closeModal(); render(); };
    });
  }
  function notifyModal(date) {
    const abs = absentsOfDate(date);
    openModal(`<h2>💬 ${t('notify_title')}</h2>
      <p class="muted" style="margin-top:-4px">${esc(fmtDate(date))} · ${abs.length} ${t('absent_students')}</p>
      ${abs.length ? abs.map((a) => {
        const ses = a.sessions.length === 1 ? a.sessions[0] : 'J';
        const call = a.calls.length === 1 ? a.calls[0] : null;
        return `<div class="group-label">${esc(className(a.st))}${db.settings.sessions === 2 ? ' · ' + a.sessions.map(sesLabel).join(' + ') : ''}</div>` + absentRow(a.st, date, ses, call);
      }).join('') : `<p class="empty">${t('no_absent')}</p>`}
      <p class="legend">${t('notify_help')}</p>
      <button class="btn light block mt" data-close>${t('close')}</button>`, (m) => bindAbsentRows(m, date));
  }

  /* ======================= SUIVI (incidents · sorties · absences) ======================= */
  const INC_TYPES = ['bagarre', 'insolence', 'tenue', 'devoirs', 'degradation', 'sante', 'fuite', 'vol', 'retard_rep', 'autre'];
  const ACTIONS = ['aucune', 'avertissement', 'punition', 'parents', 'directeur', 'soins', 'exclusion'];
  const MOTIFS = ['maladie', 'voyage', 'famille', 'rdv', 'deces', 'autre'];
  const EXIT_REASONS = ['malade', 'rdv', 'famille', 'parent_demande', 'autre'];
  const RELATIONS = ['pere', 'mere', 'frere', 'oncle', 'grand', 'chauffeur', 'voisin', 'autre'];

  const inRange = (date, f) => f === 'all' || (f === 'today' ? date === dateKey() : date >= addDays(dateKey(), -6));
  const filterChips = (cur, attr, total) => `<div class="chips">
      <button class="chip ${cur === 'today' ? 'on' : ''}" ${attr}="today">${t('filter_today')}</button>
      <button class="chip ${cur === 'week' ? 'on' : ''}" ${attr}="week">${t('filter_week')}</button>
      <button class="chip ${cur === 'all' ? 'on' : ''}" ${attr}="all">${t('filter_all')} (${total})</button></div>`;

  function renderRegistre(v) {
    const r = state.reg;
    v.innerHTML = `
      <div class="seg-ctl big">
        <button class="${r === 'incidents' ? 'on' : ''}" data-reg="incidents">⚠️ ${t('incidents')}</button>
        <button class="${r === 'exits' ? 'on' : ''}" data-reg="exits">🚪 ${t('exits')}</button>
        <button class="${r === 'absences' ? 'on' : ''}" data-reg="absences">📝 ${t('absences')}</button>
      </div>
      <div id="regBody"></div>`;
    $$('[data-reg]', v).forEach((b) => (b.onclick = () => { state.reg = b.dataset.reg; render(); }));
    const body = $('#regBody', v);
    if (r === 'incidents') renderIncidents(body);
    else if (r === 'exits') renderExits(body);
    else renderAbsences(body);
  }

  // ----- Incidents -----
  function incidentItem(i) {
    const st = studentById(i.studentId);
    return `<div class="inc-item" data-iid="${i.id}">
      <div class="inc-top">
        <div class="grow"><b>${esc(st ? st.name : '?')}</b> <span class="inc-meta">${esc(className(st))}</span><br>
          <span class="badge red">${t('inc_' + i.type)}</span> ${i.action && i.action !== 'aucune' ? `<span class="badge ok">${t('act_' + i.action)}</span>` : ''}</div>
        <div class="nowrap">${st ? `<a class="icon-btn" target="_blank" rel="noopener" href="${esc(waLink(st.phone || st.phone2, buildMsg('convoc', st, { reason: t('inc_' + i.type) })))}" title="${t('convoc')}">💬</a>` : ''}<button class="icon-btn" data-edit-inc>✏️</button><button class="icon-btn" data-del-inc>🗑️</button></div>
      </div>
      ${i.note ? `<p class="inc-note">${esc(i.note)}</p>` : ''}
      <div class="inc-meta">${esc(fmtDate(i.date, false))} · ${esc(i.time)}${i.witness ? ' · 👁 ' + esc(i.witness) : ''}</div>
    </div>`;
  }
  function bindIncidentItems(root) {
    $$('.inc-item', root).forEach((el) => {
      const id = el.dataset.iid;
      const del = $('[data-del-inc]', el), ed = $('[data-edit-inc]', el);
      if (del) del.onclick = () => confirmBox(t('delete_q'), t('delete'), () => { db.incidents = db.incidents.filter((x) => x.id !== id); save(); render(); }, true);
      if (ed) ed.onclick = () => incidentModal(db.incidents.find((x) => x.id === id));
    });
  }
  function incidentModal(inc, presetSid) {
    if (!db.students.length) { toast(t('no_student_any')); return; }
    const i = inc || { studentId: presetSid || '', type: 'bagarre', note: '', action: 'avertissement', date: dateKey(), time: timeNow(), witness: '' };
    openModal(`<h2>⚠️ ${inc ? t('edit') : t('new_incident')}</h2>
      <label>${t('student')} *</label>
      <select id="incStudent"><option value="">${t('choose')}</option>${studentOptions(i.studentId)}</select>
      <label>${t('type')}</label>
      <div class="chips wrap" id="incTypes">${INC_TYPES.map((x) => `<button class="chip ${x === i.type ? 'on' : ''}" data-v="${x}">${t('inc_' + x)}</button>`).join('')}</div>
      <label>${t('action')}</label>
      <select id="incAction">${ACTIONS.map((x) => `<option value="${x}" ${x === i.action ? 'selected' : ''}>${t('act_' + x)}</option>`).join('')}</select>
      <div class="row2">
        <div><label>${t('date')}</label><input type="date" id="incDate" value="${i.date}" max="${dateKey()}"></div>
        <div><label>${t('time')}</label><input type="time" id="incTime" value="${i.time}"></div>
      </div>
      <label>${t('note')}</label><textarea id="incNote" placeholder="${t('inc_ph')}">${esc(i.note)}</textarea>
      <label>${t('witness')}</label><input id="incWit" value="${esc(i.witness || '')}" placeholder="${t('witness_ph')}">
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveInc">${t('save')}</button></div>`, (m) => {
      let type = i.type;
      $('#incTypes', m).onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; type = b.dataset.v; $$('#incTypes .chip', m).forEach((x) => x.classList.toggle('on', x === b)); };
      $('#saveInc', m).onclick = () => {
        const sid = $('#incStudent', m).value;
        if (!sid) return toast(t('required') + ' : ' + t('student'));
        const d = { studentId: sid, type, action: $('#incAction', m).value, date: $('#incDate', m).value || dateKey(), time: $('#incTime', m).value || timeNow(), note: $('#incNote', m).value.trim(), witness: $('#incWit', m).value.trim() };
        if (inc) Object.assign(inc, d); else db.incidents.push(Object.assign({ id: uid() }, d));
        save(); closeModal(); render(); toast(t('saved'));
      };
    });
  }
  function renderIncidents(v) {
    const list = db.incidents.filter((i) => inRange(i.date, state.incFilter)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    v.innerHTML = `
      <button class="btn block" id="addInc">➕ ${t('new_incident')}</button>
      <div class="card mt">
        ${filterChips(state.incFilter, 'data-f', db.incidents.length)}
        ${list.length ? list.map(incidentItem).join('') : `<p class="empty">${t('no_incident')}</p>`}
      </div>`;
    $('#addInc', v).onclick = () => incidentModal();
    $$('[data-f]', v).forEach((b) => (b.onclick = () => { state.incFilter = b.dataset.f; render(); }));
    bindIncidentItems(v);
  }

  // ----- Sorties anticipées -----
  function exitModal(ex, presetSid) {
    if (!db.students.length) { toast(t('no_student_any')); return; }
    const e = ex || { studentId: presetSid || '', date: dateKey(), time: timeNow(), reason: 'malade', by: '', relation: 'pere', phone: '', note: '' };
    openModal(`<h2>🚪 ${ex ? t('edit') : t('new_exit')}</h2>
      <label>${t('student')} *</label>
      <select id="exStudent"><option value="">${t('choose')}</option>${studentOptions(e.studentId)}</select>
      <div class="row2">
        <div><label>${t('date')}</label><input type="date" id="exDate" value="${e.date}" max="${dateKey()}"></div>
        <div><label>${t('exit_time')}</label><input type="time" id="exTime" value="${e.time}"></div>
      </div>
      <label>${t('motif')}</label>
      <select id="exReason">${EXIT_REASONS.map((x) => `<option value="${x}" ${x === e.reason ? 'selected' : ''}>${t('exr_' + x)}</option>`).join('')}</select>
      <label>${t('picked_by')} *</label><input id="exBy" value="${esc(e.by)}" placeholder="${t('picked_by_ph')}">
      <div class="row2">
        <div><label>${t('relation')}</label><select id="exRel">${RELATIONS.map((x) => `<option value="${x}" ${x === e.relation ? 'selected' : ''}>${t('rel_' + x)}</option>`).join('')}</select></div>
        <div><label>${t('phone')}</label><input id="exPhone" type="tel" inputmode="tel" value="${esc(e.phone)}"></div>
      </div>
      <label>${t('note')}</label><input id="exNote" value="${esc(e.note)}">
      <p class="legend">🔒 ${t('exit_safety')}</p>
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveEx">${t('save')}</button></div>`, (m) => {
      $('#saveEx', m).onclick = () => {
        const sid = $('#exStudent', m).value;
        if (!sid) return toast(t('required') + ' : ' + t('student'));
        const by = $('#exBy', m).value.trim(); if (!by) return toast(t('required') + ' : ' + t('picked_by'));
        const d = { studentId: sid, date: $('#exDate', m).value || dateKey(), time: $('#exTime', m).value || timeNow(), reason: $('#exReason', m).value, by, relation: $('#exRel', m).value, phone: $('#exPhone', m).value.trim(), note: $('#exNote', m).value.trim() };
        if (ex) Object.assign(ex, d); else db.exits.push(Object.assign({ id: uid() }, d));
        save(); closeModal(); render(); toast(t('saved'));
      };
    });
  }
  function exitItem(e) {
    const st = studentById(e.studentId);
    const byTxt = `${e.by} (${t('rel_' + e.relation)})`;
    return `<div class="inc-item" data-eid="${e.id}">
      <div class="inc-top">
        <div class="grow"><b>${esc(st ? st.name : '?')}</b> <span class="inc-meta">${esc(className(st))}</span><br>
          <span class="badge blue">🚪 ${esc(e.time)}</span> <span class="badge grey">${t('exr_' + e.reason)}</span></div>
        <div class="nowrap">${st ? `<a class="icon-btn" target="_blank" rel="noopener" href="${esc(waLink(st.phone || st.phone2, buildMsg('exit', st, { date: e.date, time: e.time, by: byTxt })))}">💬</a>` : ''}<button class="icon-btn" data-edit-ex>✏️</button><button class="icon-btn" data-del-ex>🗑️</button></div>
      </div>
      <div class="inc-note">👤 ${esc(byTxt)}${e.phone ? ' · 📞 ' + esc(e.phone) : ''}${e.note ? ' · ' + esc(e.note) : ''}</div>
      <div class="inc-meta">${esc(fmtDate(e.date, false))}</div>
    </div>`;
  }
  function renderExits(v) {
    const list = db.exits.filter((i) => inRange(i.date, state.exitFilter)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    v.innerHTML = `
      <button class="btn block" id="addEx">➕ ${t('new_exit')}</button>
      <div class="card mt">
        ${filterChips(state.exitFilter, 'data-f', db.exits.length)}
        ${list.length ? list.map(exitItem).join('') : `<p class="empty">${t('no_exit')}</p>`}
      </div>`;
    $('#addEx', v).onclick = () => exitModal();
    $$('[data-f]', v).forEach((b) => (b.onclick = () => { state.exitFilter = b.dataset.f; render(); }));
    $$('[data-eid]', v).forEach((el) => {
      const id = el.dataset.eid;
      $('[data-edit-ex]', el).onclick = () => exitModal(db.exits.find((x) => x.id === id));
      $('[data-del-ex]', el).onclick = () => confirmBox(t('delete_q'), t('delete'), () => { db.exits = db.exits.filter((x) => x.id !== id); save(); render(); }, true);
    });
  }

  // ----- Absences & justificatifs -----
  function unjustifiedRows(days = 30) {
    const since = addDays(dateKey(), -days);
    const rows = [], seen = new Set();
    Object.values(db.calls).filter((c) => c.date >= since).sort((a, b) => b.date.localeCompare(a.date)).forEach((c) => {
      Object.entries(c.marks).forEach(([sid, val]) => {
        const k = c.date + '|' + sid;
        if (val !== 'A' || seen.has(k) || justifOf(c.date, sid)) return;
        const st = studentById(sid); if (!st) return;
        seen.add(k); rows.push({ st, date: c.date, ses: c.session });
      });
    });
    return rows;
  }
  function renderAbsences(v) {
    const mode = state.absMode;
    let html = '';
    if (mode === 'date') {
      const abs = absentsOfDate(state.absDate);
      html = `<label>${t('date')}</label><input type="date" id="absDate" value="${state.absDate}" max="${dateKey()}">
        <div class="mt">${abs.length ? abs.map((a) => `<div class="group-label">${esc(className(a.st))}${db.settings.sessions === 2 ? ' · ' + a.sessions.map(sesLabel).join(' + ') : ''}</div>` +
          absentRow(a.st, state.absDate, a.sessions.length === 1 ? a.sessions[0] : 'J', null)).join('') : `<p class="empty">${t('no_absent')}</p>`}</div>`;
    } else {
      const rows = unjustifiedRows();
      html = rows.length ? rows.map((r) => `<div class="abs-wrap" data-date="${r.date}"><div class="group-label">${esc(fmtDate(r.date, false))} · ${esc(className(r.st))}</div>${absentRow(r.st, r.date, r.ses, null)}</div>`).join('')
        : `<p class="empty">✅ ${t('all_justified')}</p>`;
    }
    v.innerHTML = `<div class="card">
      <div class="chips">
        <button class="chip ${mode === 'date' ? 'on' : ''}" data-m="date">${t('by_date')}</button>
        <button class="chip ${mode === 'nj' ? 'on' : ''}" data-m="nj">${t('unjustified_30')}</button>
      </div>${html}</div>`;
    $$('[data-m]', v).forEach((b) => (b.onclick = () => { state.absMode = b.dataset.m; render(); }));
    const ad = $('#absDate', v); if (ad) ad.onchange = (e) => { if (e.target.value) { state.absDate = e.target.value; render(); } };
    if (mode === 'date') bindAbsentRows(v, state.absDate);
    else $$('.abs-wrap', v).forEach((w) => bindAbsentRows(w, w.dataset.date));
  }

  /* ======================= ÉLÈVES ======================= */
  function renderEleves(v) {
    if (db.classes.length && !classById(state.elevesClass)) state.elevesClass = db.classes[0].id;
    const cid = state.elevesClass;
    const q = state.search.trim().toLowerCase();
    const list = q ? db.students.filter((s) => s.name.toLowerCase().includes(q) || cleanPhone(s.phone).includes(q)).sort(byName) : (cid ? studentsOf(cid) : []);
    const cls = classById(cid);
    v.innerHTML = `
      <div class="card">
        <div class="card-head"><h2>${t('classes')} <span class="muted">(${db.students.length} ${t('students_l')})</span></h2>
          <div class="nowrap"><button class="btn gold small" id="divBtn">🏫 ${t('divisions_btn')}</button> <button class="btn light small" id="addClass">${t('add_class')}</button></div></div>
        <div class="chips wrap">${db.classes.map((c) => `<button class="chip ${c.id === cid && !q ? 'on' : ''}" data-c="${c.id}">${esc(c.name)} · ${studentsOf(c.id).length}</button>`).join('')}</div>
      </div>
      <div class="card">
        <input type="search" id="search" placeholder="${t('search')}" value="${esc(state.search)}">
        ${!q ? `<div class="card-head mt"><h2 style="margin:0">${cls ? esc(cls.name) : ''}</h2>${cls ? `<button class="btn light small" id="editClass">✏️ ${t('rename')}</button>` : ''}</div>
          <div class="btn-row mt">${cid ? `<button class="btn small" id="addStudent">➕ ${t('add_student')}</button>` : ''}<button class="btn gold small" id="bulkAdd">📥 ${t('import_list')}</button></div>` : ''}
        <ul class="list mt" id="stuList">${listHtml(list, !!q)}</ul>
      </div>`;
    $$('[data-c]', v).forEach((b) => (b.onclick = () => { state.elevesClass = b.dataset.c; state.search = ''; render(); }));
    $('#search', v).oninput = (e) => {
      const wasEmpty = !state.search.trim();
      state.search = e.target.value;
      if (wasEmpty !== !state.search.trim()) { render(); const n = $('#search'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); return; }
      const qq = state.search.trim().toLowerCase();
      const l2 = qq ? db.students.filter((s) => s.name.toLowerCase().includes(qq) || cleanPhone(s.phone).includes(qq)).sort(byName) : studentsOf(cid);
      $('#stuList', v).innerHTML = listHtml(l2, !!qq); bindList();
    };
    $('#addClass', v).onclick = () => classModal();
    $('#divBtn', v).onclick = () => divisionsModal();
    const ec = $('#editClass', v); if (ec) ec.onclick = () => classModal(cls);
    const as = $('#addStudent', v); if (as) as.onclick = () => studentModal(null, cid);
    const ba = $('#bulkAdd', v); if (ba) ba.onclick = () => importModal(cid);
    function bindList() { $$('li[data-sid]', v).forEach((li) => (li.onclick = () => studentDetail(li.dataset.sid))); }
    bindList();
  }
  function listHtml(list, showClass) {
    if (!list.length) return `<p class="empty">${db.classes.length ? t('no_student') : t('no_class')}</p>`;
    return list.map((s, i) => {
      const c = studentCounters(s.id);
      return `<li data-sid="${s.id}" class="tap"><span class="num">${i + 1}</span><div class="grow"><b>${esc(s.name)}</b>${s.sex ? ` <span class="sex ${s.sex}">${s.sex === 'F' ? '♀' : '♂'}</span>` : ''}
        <div class="sub">${showClass ? esc(className(s)) + ' · ' : ''}${s.phone ? '📞 ' + esc(s.phone) : `<span class="txt-orange">${t('no_phone')}</span>`}${s.health ? ' · 🩺' : ''}</div></div>
        ${c.NJ >= 3 ? `<span class="badge red">${c.NJ} ${t('abs_short')}</span>` : ''}<span class="muted chev">›</span></li>`;
    }).join('');
  }

  function classModal(cls) {
    openModal(`<h2>${cls ? t('rename') : t('add_class')}</h2>
      <label>${t('class_name')}</label><input id="clsName" value="${esc(cls ? cls.name : '')}" placeholder="Ex : 3ème AF - B">
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveCls">${t('save')}</button></div>
      ${cls ? `<button class="btn danger block mt" id="delCls">🗑️ ${t('delete_class')}</button>` : ''}`, (m) => {
      $('#clsName', m).focus();
      $('#saveCls', m).onclick = () => {
        const name = $('#clsName', m).value.trim(); if (!name) return toast(t('name_required'));
        if (cls) cls.name = name; else { const c = { id: uid(), name }; db.classes.push(c); state.elevesClass = c.id; }
        sortClasses(); save(); closeModal(); render();
      };
      const d = $('#delCls', m);
      if (d) d.onclick = () => confirmBox(tf('delete_class_confirm2', { n: studentsOf(cls.id).length }), t('delete'), () => {
        studentsOf(cls.id).forEach((s) => purgeStudent(s.id));
        Object.keys(db.calls).forEach((k) => { if (db.calls[k].classId === cls.id) delete db.calls[k]; });
        db.classes = db.classes.filter((c) => c.id !== cls.id);
        save(); render();
      }, true);
    });
  }
  function purgeStudent(sid) {
    db.students = db.students.filter((s) => s.id !== sid);
    db.incidents = db.incidents.filter((i) => i.studentId !== sid);
    db.exits = db.exits.filter((i) => i.studentId !== sid);
    Object.values(db.calls).forEach((c) => { delete c.marks[sid]; delete c.late[sid]; if (c.notified) delete c.notified[sid]; });
    Object.keys(db.justifs).forEach((k) => { if (k.endsWith('|' + sid)) delete db.justifs[k]; });
    Object.keys(db.payments).forEach((k) => { if (k.startsWith(sid + '|')) delete db.payments[k]; });
  }

  function studentModal(st, cid) {
    const s = st || { name: '', sex: '', classId: cid, parent: '', phone: '', phone2: '', health: '', fee: '' };
    openModal(`<h2>${st ? t('edit') : t('add_student')}</h2>
      <label>${t('student_name')} *</label><input id="stName" value="${esc(s.name)}" autocomplete="off">
      <div class="row2">
        <div><label>${t('sex')}</label><select id="stSex"><option value="">—</option><option value="G" ${s.sex === 'G' ? 'selected' : ''}>${t('boy')}</option><option value="F" ${s.sex === 'F' ? 'selected' : ''}>${t('girl')}</option></select></div>
        <div><label>${t('class')}</label><select id="stClass">${db.classes.map((c) => `<option value="${c.id}" ${c.id === s.classId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      </div>
      <label>${t('parent_name')}</label><input id="stParent" value="${esc(s.parent || '')}">
      <div class="row2">
        <div><label>${t('parent_phone')}</label><input id="stPhone" type="tel" inputmode="tel" value="${esc(s.phone || '')}" placeholder="22 12 34 56"></div>
        <div><label>${t('phone2')}</label><input id="stPhone2" type="tel" inputmode="tel" value="${esc(s.phone2 || '')}"></div>
      </div>
      ${db.settings.fees ? `<label>${t('monthly_fee')} (${t('currency')})</label><input id="stFee" type="number" inputmode="numeric" value="${esc(s.fee === null || s.fee === undefined ? '' : s.fee)}" placeholder="${t('default')} : ${db.settings.feeAmount || 0}">` : ''}
      <label>🩺 ${t('health')}</label><input id="stHealth" value="${esc(s.health || '')}" placeholder="${t('health_ph')}">
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveSt">${t('save')}</button></div>
      ${!st ? `<p class="legend center">${t('quick_add_help')}</p>` : ''}`, (m) => {
      $('#stName', m).focus();
      const doSave = () => {
        const name = $('#stName', m).value.trim(); if (!name) return toast(t('name_required'));
        const fee = $('#stFee', m) ? $('#stFee', m).value.trim() : (s.fee === undefined ? '' : s.fee);
        const data = { name, sex: $('#stSex', m).value, classId: $('#stClass', m).value, parent: $('#stParent', m).value.trim(), phone: $('#stPhone', m).value.trim(), phone2: $('#stPhone2', m).value.trim(), health: $('#stHealth', m).value.trim(), fee: fee === '' || fee === null ? null : Number(fee) };
        if (st) { Object.assign(st, data); save(); closeModal(); render(); toast(t('saved')); }
        else {
          db.students.push(Object.assign({ id: uid() }, data)); save(); render(); toast(`✓ ${name}`);
          ['#stName', '#stPhone', '#stPhone2', '#stParent', '#stHealth'].forEach((x) => ($(x, m).value = ''));
          if ($('#stFee', m)) $('#stFee', m).value = '';
          $('#stSex', m).value = ''; $('#stName', m).focus();
        }
      };
      $('#saveSt', m).onclick = doSave;
      $('#stName', m).addEventListener('keydown', (e) => { if (e.key === 'Enter') doSave(); });
    });
  }

  function studentDetail(sid) {
    const st = studentById(sid); if (!st) return;
    const c = studentCounters(sid);
    const inc = db.incidents.filter((i) => i.studentId === sid).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const exits = db.exits.filter((i) => i.studentId === sid);
    const ph = st.phone || st.phone2;
    const months = db.settings.fees ? schoolMonths() : [];
    const nowM = monthKey();
    openModal(`<div class="card-head"><h2 style="margin:0">${esc(st.name)}</h2>${st.sex ? `<span class="sex ${st.sex}">${st.sex === 'F' ? '♀ ' + t('girl') : '♂ ' + t('boy')}</span>` : ''}</div>
      <p class="muted" style="margin:4px 0 10px">${esc(className(st))}</p>
      ${st.health ? `<div class="hint danger-hint">🩺 <b>${t('health')} :</b> ${esc(st.health)}</div>` : ''}
      <div class="contact-card">
        <div><span class="muted">${t('parent_name')}</span><b>${esc(st.parent || '—')}</b></div>
        <div><span class="muted">${t('parent_phone')}</span><b dir="ltr">${esc(st.phone || '—')}${st.phone2 ? ' / ' + esc(st.phone2) : ''}</b></div>
        ${ph ? `<div class="btn-row mt"><a class="btn" href="tel:${esc(cleanPhone(ph))}">📞 ${t('call')}</a><a class="btn wa-btn" target="_blank" rel="noopener" href="https://wa.me/${waPhone(ph)}">💬 WhatsApp</a></div>` : ''}
      </div>
      <div class="stats s4">
        <div class="stat red"><b>${c.NJ}</b><span>${t('abs_nj')}</span></div>
        <div class="stat"><b>${c.J}</b><span>${t('abs_j')}</span></div>
        <div class="stat orange"><b>${c.R}</b><span>${t('late')}</span></div>
        <div class="stat gold"><b>${inc.length}</b><span>${t('incidents')}</span></div>
      </div>
      ${db.settings.fees ? `<h3>💰 ${t('fees')}</h3><div class="months">${months.map((mk) => {
        const p = db.payments[sid + '|' + mk];
        return `<span class="mchip ${p ? 'paid' : mk <= nowM ? 'due' : ''}">${esc(fmtMonth(mk).split(' ')[0].slice(0, 4))}${p ? ' ✓' : ''}</span>`;
      }).join('')}</div>` : ''}
      ${c.absDates.length ? `<h3>${t('absences')}</h3><div class="months">${c.absDates.slice(0, 20).map((d) => `<span class="mchip ${justifOf(d, sid) ? 'paid' : 'due'}">${esc(fmtDate(d, false))}</span>`).join('')}</div>` : ''}
      <h3>${t('history')}</h3>
      <div>${inc.length ? inc.slice(0, 10).map(incidentItem).join('') : `<p class="empty">${t('no_incident')}</p>`}</div>
      ${exits.length ? `<h3>${t('exits')} (${exits.length})</h3>${exits.slice(-5).reverse().map(exitItem).join('')}` : ''}
      <div class="grid2 mt">
        <button class="btn light" id="dInc">⚠️ ${t('q_incident')}</button>
        <button class="btn light" id="dExit">🚪 ${t('q_exit')}</button>
        <a class="btn light" target="_blank" rel="noopener" href="${esc(waLink(ph, buildMsg('convoc', st, {})))}">📨 ${t('convoc')}</a>
        <button class="btn light" id="editSt">✏️ ${t('edit')}</button>
      </div>
      <div class="btn-row mt"><button class="btn danger" id="delSt">🗑️ ${t('delete')}</button><button class="btn light" data-close>${t('close')}</button></div>`, (m) => {
      bindIncidentItems(m);
      $$('[data-eid]', m).forEach((el) => { const b = $('[data-edit-ex]', el); if (b) b.onclick = () => exitModal(db.exits.find((x) => x.id === el.dataset.eid)); const d = $('[data-del-ex]', el); if (d) d.remove(); });
      $('#editSt', m).onclick = () => studentModal(st);
      $('#dInc', m).onclick = () => incidentModal(null, sid);
      $('#dExit', m).onclick = () => exitModal(null, sid);
      $('#delSt', m).onclick = () => confirmBox(t('delete_student_confirm'), t('delete'), () => { purgeStudent(sid); save(); render(); }, true);
    });
  }

  /* ======================= PLUS ======================= */
  function renderPlus(v) {
    const sub = state.plus;
    if (sub !== 'menu') {
      v.innerHTML = `<button class="back-btn" id="backPlus">${db.lang === 'ar' ? '→' : '←'} ${t('back')}</button><div id="plusBody"></div>`;
      $('#backPlus', v).onclick = () => { state.plus = 'menu'; render(); };
      const b = $('#plusBody', v);
      ({ fees: renderFees, reports: renderReports, paper: renderPaper, settings: renderSettings, data: renderData, help: renderHelp })[sub](b);
      return;
    }
    const items = [
      db.settings.fees ? ['fees', '💰', t('fees'), t('fees_sub')] : null,
      ['reports', '📊', t('reports'), t('reports_sub')],
      ['paper', '🖨️', t('paper'), t('paper_sub')],
      ['settings', '⚙️', t('settings'), t('settings_sub')],
      ['data', '💾', t('data'), db.lastBackup ? tf('last_backup', { d: fmtDate(db.lastBackup.slice(0, 10), false) }) : t('never_backup')],
      ['help', '📲', t('help'), t('help_sub')]
    ].filter(Boolean);
    v.innerHTML = `<div class="card menu">${items.map(([id, ic, ti, su]) => `<button class="menu-item" data-p="${id}"><span class="mi-ico">${ic}</span><span class="grow"><b>${ti}</b><small>${esc(su)}</small></span><span class="muted chev">›</span></button>`).join('')}</div>
      ${!db.settings.fees ? `<p class="legend center">${t('fees_off_hint')}</p>` : ''}
      <p class="center muted small">${t('app')} · ${t('version')} ${VERSION}</p>`;
    $$('[data-p]', v).forEach((b) => (b.onclick = () => { state.plus = b.dataset.p; render(); window.scrollTo(0, 0); }));
  }

  // ----- Mensualités -----
  function schoolMonths() {
    const y0 = parseInt(String(db.school.year).slice(0, 4), 10) || new Date().getFullYear();
    const res = [];
    for (let m = db.settings.startMonth; m <= 12; m++) res.push(`${y0}-${pad(m)}`);
    for (let m = 1; m <= 6; m++) res.push(`${y0 + 1}-${pad(m)}`);
    return res;
  }
  const feeOf = (st) => (st.fee !== null && st.fee !== undefined && st.fee !== '' ? Number(st.fee) : Number(db.settings.feeAmount) || 0);
  function renderFees(v) {
    const months = schoolMonths();
    if (!months.includes(state.feeMonth)) state.feeMonth = months.includes(monthKey()) ? monthKey() : months[0];
    const mk = state.feeMonth;
    const pool = (state.feeClass === 'all' ? db.students.slice().sort((a, b) => (className(a) + a.name).localeCompare(className(b) + b.name)) : studentsOf(state.feeClass));
    let paidN = 0, collected = 0, expected = 0;
    pool.forEach((s) => { const p = db.payments[s.id + '|' + mk]; expected += feeOf(s); if (p) { paidN++; collected += Number(p.amount) || 0; } });
    const list = pool.filter((s) => { const p = db.payments[s.id + '|' + mk]; return state.feeFilter === 'all' || (state.feeFilter === 'paid' ? p : !p); });
    v.innerHTML = `
      <h2 class="page-title">💰 ${t('fees')}</h2>
      <div class="card">
        <div class="row2">
          <div><label>${t('month')}</label><select id="fMonth">${months.map((m) => `<option value="${m}" ${m === mk ? 'selected' : ''}>${esc(fmtMonth(m))}</option>`).join('')}</select></div>
          <div><label>${t('class')}</label><select id="fClass"><option value="all">${t('all_classes')}</option>${db.classes.map((c) => `<option value="${c.id}" ${c.id === state.feeClass ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        </div>
        <div class="stats s3 mt">
          <div class="stat"><b>${paidN}/${pool.length}</b><span>${t('paid')}</span></div>
          <div class="stat"><b class="money">${fmtMoney(collected)}</b><span>${t('collected')}</span></div>
          <div class="stat red"><b class="money">${fmtMoney(Math.max(0, expected - collected))}</b><span>${t('remaining')}</span></div>
        </div>
        <div class="chips">
          <button class="chip ${state.feeFilter === 'all' ? 'on' : ''}" data-ff="all">${t('filter_all')}</button>
          <button class="chip ${state.feeFilter === 'unpaid' ? 'on' : ''}" data-ff="unpaid">${t('unpaid')} (${pool.length - paidN})</button>
          <button class="chip ${state.feeFilter === 'paid' ? 'on' : ''}" data-ff="paid">${t('paid')} (${paidN})</button>
        </div>
        ${list.length ? list.map((s) => {
          const p = db.payments[s.id + '|' + mk];
          return `<div class="person-row" data-fs="${s.id}"><div class="grow"><b>${esc(s.name)}</b><div class="sub">${state.feeClass === 'all' ? esc(className(s)) + ' · ' : ''}${fmtMoney(p ? p.amount : feeOf(s))}${p ? ' · ' + esc(fmtDate(p.date, false)) : ''}</div></div>
            ${!p ? `<a class="cbtn wa" target="_blank" rel="noopener" href="${esc(waLink(s.phone || s.phone2, buildMsg('fee', s, { month: mk, amount: feeOf(s) })))}" title="${t('remind')}">💬</a>` : ''}
            <button class="pay-btn ${p ? 'paid' : ''}" data-pay="${s.id}">${p ? '✓ ' + t('paid_one') : t('mark_paid')}</button></div>`;
        }).join('') : `<p class="empty">${db.students.length ? t('nothing_here') : t('no_student_any')}</p>`}
      </div>
      <button class="btn light block" id="feeCsv">📊 ${t('export_fees')}</button>`;
    $('#fMonth', v).onchange = (e) => { state.feeMonth = e.target.value; render(); };
    $('#fClass', v).onchange = (e) => { state.feeClass = e.target.value; render(); };
    $$('[data-ff]', v).forEach((b) => (b.onclick = () => { state.feeFilter = b.dataset.ff; render(); }));
    $$('[data-pay]', v).forEach((b) => (b.onclick = () => {
      const sid = b.dataset.pay, k = sid + '|' + mk, s = studentById(sid);
      if (!db.payments[k]) { db.payments[k] = { amount: feeOf(s), date: dateKey() }; save(); render(); toast(`✓ ${s.name}`); return; }
      const p = db.payments[k];
      openModal(`<h2>💰 ${esc(s.name)}</h2><p class="muted" style="margin-top:-4px">${esc(fmtMonth(mk))}</p>
        <div class="row2"><div><label>${t('amount')} (${t('currency')})</label><input id="pAm" type="number" inputmode="numeric" value="${esc(p.amount)}"></div>
        <div><label>${t('date')}</label><input id="pDt" type="date" value="${esc(p.date)}"></div></div>
        <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="pOk">${t('save')}</button></div>
        <button class="btn danger block mt" id="pDel">${t('cancel_payment')}</button>`, (m) => {
        $('#pOk', m).onclick = () => { p.amount = Number($('#pAm', m).value) || 0; p.date = $('#pDt', m).value || dateKey(); save(); closeModal(); render(); };
        $('#pDel', m).onclick = () => { delete db.payments[k]; save(); closeModal(); render(); };
      });
    }));
    $('#feeCsv', v).onclick = () => {
      const rows = [[t('class'), t('student'), t('parent_phone'), ...months.map((m) => fmtMonth(m))]];
      db.classes.forEach((c) => studentsOf(c.id).forEach((s) => rows.push([c.name, s.name, s.phone, ...months.map((m) => { const p = db.payments[s.id + '|' + m]; return p ? p.amount : ''; })])));
      csvDownload(`mensualites_${dateKey()}.csv`, rows);
    };
  }

  // ----- Rapports -----
  function monthStats(ym) {
    const per = {}; const stu = {};
    db.classes.forEach((c) => (per[c.id] = { cls: c, P: 0, A: 0, R: 0, days: new Set() }));
    Object.values(db.calls).forEach((c) => {
      if (!c.date.startsWith(ym) || !per[c.classId]) return;
      const pc = per[c.classId]; pc.days.add(c.date);
      Object.entries(c.marks).forEach(([sid, v]) => {
        if (!studentById(sid)) return;
        pc[v]++;
        const s = stu[sid] || (stu[sid] = { A: 0, R: 0, NJ: 0 });
        if (v === 'A') { s.A++; if (!justifOf(c.date, sid)) s.NJ++; }
        if (v === 'R') s.R++;
      });
    });
    const inc = db.incidents.filter((i) => i.date.startsWith(ym));
    const incBy = {}; inc.forEach((i) => (incBy[i.type] = (incBy[i.type] || 0) + 1));
    const top = Object.entries(stu).filter(([, s]) => s.A).sort((a, b) => b[1].A - a[1].A).slice(0, 10).map(([sid, s]) => ({ st: studentById(sid), ...s }));
    const lateTop = Object.entries(stu).filter(([, s]) => s.R).sort((a, b) => b[1].R - a[1].R).slice(0, 5).map(([sid, s]) => ({ st: studentById(sid), ...s }));
    return { per: Object.values(per).filter((p) => studentsOf(p.cls.id).length), inc, incBy, top, lateTop, exits: db.exits.filter((e) => e.date.startsWith(ym)).length };
  }
  const pct = (p) => { const n = p.P + p.A + p.R; return n ? Math.round(((p.P + p.R) / n) * 100) + '%' : '—'; };
  function renderReports(v) {
    const ms = monthStats(state.repMonth);
    v.innerHTML = `
      <h2 class="page-title">📊 ${t('reports')}</h2>
      <div class="card">
        <h2>📋 ${t('daily_report')}</h2>
        <label>${t('date')}</label><input type="date" id="rDay" value="${dateKey()}" max="${dateKey()}">
        <div class="btn-row mt"><button class="btn" id="rShare">💬 ${t('share')}</button><button class="btn light" id="rPrint">🖨️ ${t('print_pdf')}</button></div>
      </div>
      <div class="card">
        <h2>📅 ${t('monthly_report')}</h2>
        <label>${t('month')}</label><input type="month" id="rMonth" value="${state.repMonth}">
        <table class="tbl mt"><thead><tr><th>${t('class')}</th><th>${t('rate')}</th><th>${t('abs_short')}</th><th>${t('late_short')}</th></tr></thead>
        <tbody>${ms.per.map((p) => `<tr><td>${esc(p.cls.name)}</td><td><b>${pct(p)}</b></td><td class="txt-red">${p.A}</td><td class="txt-orange">${p.R}</td></tr>`).join('') || `<tr><td colspan="4" class="empty">${t('nothing_here')}</td></tr>`}</tbody></table>
        ${ms.top.length ? `<h3>${t('top_absent')}</h3><ol class="olist">${ms.top.map((x) => `<li><b>${esc(x.st.name)}</b> <span class="muted">${esc(className(x.st))}</span> — <span class="txt-red">${x.A} ${t('abs_short')}</span>${x.NJ ? ` (${x.NJ} ${t('nj_short')})` : ''}</li>`).join('')}</ol>` : ''}
        ${ms.inc.length ? `<h3>${t('incidents')} (${ms.inc.length})</h3><div class="chips wrap">${Object.entries(ms.incBy).map(([k, n]) => `<span class="badge red">${t('inc_' + k)} : ${n}</span>`).join(' ')}</div>` : ''}
        <div class="btn-row mt"><button class="btn" id="mShare">💬 ${t('share')}</button><button class="btn light" id="mPrint">🖨️ ${t('print_pdf')}</button></div>
      </div>
      <div class="card">
        <h2>📤 ${t('exports')}</h2>
        <button class="btn light block" id="xAtt">📊 ${t('export_csv')}</button>
        <button class="btn light block mt" id="xInc">⚠️ ${t('export_inc')}</button>
        <button class="btn light block mt" id="xExit">🚪 ${t('export_exits')}</button>
        <button class="btn light block mt" id="xStu">👧🏾 ${t('export_students')}</button>
      </div>`;
    const day = () => $('#rDay', v).value || dateKey();
    $('#rShare', v).onclick = () => shareText(buildDailyReport(day()));
    $('#rPrint', v).onclick = () => printDaily(day());
    $('#rMonth', v).onchange = (e) => { if (e.target.value) { state.repMonth = e.target.value; render(); } };
    $('#mShare', v).onclick = () => shareText(buildMonthlyText(state.repMonth));
    $('#mPrint', v).onclick = () => printMonthly(state.repMonth);
    $('#xAtt', v).onclick = () => {
      const names = { P: t('st_P_long'), A: t('st_A_long'), R: t('st_R_long') };
      const rows = [[t('date'), t('session'), t('class'), t('student'), t('status'), t('arrival_time'), t('justified')]];
      Object.values(db.calls).sort((a, b) => (a.date + a.session).localeCompare(b.date + b.session)).forEach((c) => {
        const cl = classById(c.classId);
        Object.entries(c.marks).forEach(([sid, s]) => {
          const st = studentById(sid); if (!st) return;
          const j = s === 'A' ? justifOf(c.date, sid) : null;
          rows.push([c.date, sesLabel(c.session), cl ? cl.name : '', st.name, names[s] || s, c.late[sid] || '', j ? t('mot_' + j.motif) : s === 'A' ? t('no') : '']);
        });
      });
      csvDownload(`presences_${dateKey()}.csv`, rows);
    };
    $('#xInc', v).onclick = () => {
      const rows = [[t('date'), t('time'), t('class'), t('student'), t('type'), t('note'), t('action'), t('witness')]];
      db.incidents.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach((i) => {
        const st = studentById(i.studentId);
        rows.push([i.date, i.time, className(st), st ? st.name : '', t('inc_' + i.type), i.note, t('act_' + i.action), i.witness || '']);
      });
      csvDownload(`incidents_${dateKey()}.csv`, rows);
    };
    $('#xExit', v).onclick = () => {
      const rows = [[t('date'), t('exit_time'), t('class'), t('student'), t('motif'), t('picked_by'), t('relation'), t('phone'), t('note')]];
      db.exits.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach((e) => {
        const st = studentById(e.studentId);
        rows.push([e.date, e.time, className(st), st ? st.name : '', t('exr_' + e.reason), e.by, t('rel_' + e.relation), e.phone, e.note]);
      });
      csvDownload(`sorties_${dateKey()}.csv`, rows);
    };
    $('#xStu', v).onclick = () => {
      const rows = [['Classe', 'Nom', 'Sexe', 'Parent', 'Téléphone', 'Téléphone 2', 'Santé']];
      db.classes.forEach((c) => studentsOf(c.id).forEach((s) => rows.push([c.name, s.name, s.sex, s.parent, s.phone, s.phone2, s.health])));
      csvDownload(`liste_eleves_${dateKey()}.csv`, rows);
    };
  }

  function buildDailyReport(date) {
    const L = [];
    L.push(`📋 *${t('daily_report')}*${db.school.name ? ' – ' + db.school.name : ''}`);
    L.push(`📅 ${fmtDate(date)}`);
    sessionsList().forEach((ses) => {
      const s = dayStats(date, ses);
      L.push('');
      if (db.settings.sessions === 2) L.push(`🕘 *${sesLabel(ses)}*`);
      L.push(`👥 ${t('enrolled')} : ${s.total} · ✅ ${t('present')} : ${s.P} · ❌ ${t('absent')} : ${s.A} · ⏰ ${t('late')} : ${s.R}`);
      L.push(`📒 ${t('calls_saved')} : ${s.saved}/${s.classesWithStudents}`);
      s.perClass.filter((p) => p.total).forEach((p) => {
        if (!p.marked) { L.push(`• ${p.cls.name} : ⚠️ ${t('call_not_done')}`); return; }
        L.push(`• ${p.cls.name} : ${p.P + p.R}/${p.total}${p.call && p.call.status !== 'saved' ? ' (' + t('draft') + ')' : ''}`);
        if (p.absents.length) L.push(`   ❌ ${p.absents.map((x) => x.name + (justifOf(date, x.id) ? ' (' + t('justified_short') + ')' : '')).join(', ')}`);
        if (p.lates.length) L.push(`   ⏰ ${p.lates.map((x) => x.name + (p.call.late[x.id] ? ' ' + p.call.late[x.id] : '')).join(', ')}`);
      });
    });
    const inc = db.incidents.filter((i) => i.date === date);
    L.push(''); L.push(`⚠️ *${t('incidents')}* (${inc.length})`);
    if (!inc.length) L.push(`• ${t('none')}`);
    inc.forEach((i) => { const st = studentById(i.studentId); L.push(`• ${i.time} – ${st ? st.name : '?'} (${className(st)}) : ${t('inc_' + i.type)}${i.note ? ' – ' + i.note : ''}${i.action && i.action !== 'aucune' ? ' → ' + t('act_' + i.action) : ''}`); });
    const ex = db.exits.filter((e) => e.date === date);
    if (ex.length) { L.push(''); L.push(`🚪 *${t('exits')}* (${ex.length})`); ex.forEach((e) => { const st = studentById(e.studentId); L.push(`• ${e.time} – ${st ? st.name : '?'} (${className(st)}) : ${t('exr_' + e.reason)} · ${e.by} (${t('rel_' + e.relation)})`); }); }
    if (db.school.supervisor) { L.push(''); L.push(`${t('supervisor_l')} : ${db.school.supervisor}`); }
    return L.join('\n');
  }
  function buildClassReport(call) {
    const cl = classById(call.classId); const st = studentsOf(call.classId);
    const A = st.filter((s) => call.marks[s.id] === 'A'), R = st.filter((s) => call.marks[s.id] === 'R');
    return [`✅ *${t('tab_appel')} – ${cl ? cl.name : ''}*`, `📅 ${fmtDate(call.date)}${db.settings.sessions === 2 ? ' · ' + sesLabel(call.session) : ''}`,
      `👥 ${st.length} · ✅ ${st.length - A.length - R.length} · ❌ ${A.length} · ⏰ ${R.length}`,
      A.length ? `❌ ${A.map((s) => s.name).join(', ')}` : '', R.length ? `⏰ ${R.map((s) => s.name + (call.late[s.id] ? ' ' + call.late[s.id] : '')).join(', ')}` : '',
      call.savedAt ? `🕘 ${tf('saved_at', { time: call.savedAt })}${call.by ? ' – ' + call.by : ''}` : ''].filter(Boolean).join('\n');
  }
  function buildMonthlyText(ym) {
    const ms = monthStats(ym);
    const L = [`📅 *${t('monthly_report')} – ${fmtMonth(ym)}*${db.school.name ? '\n' + db.school.name : ''}`, ''];
    ms.per.forEach((p) => L.push(`• ${p.cls.name} : ${pct(p)} · ❌ ${p.A} · ⏰ ${p.R}`));
    if (ms.top.length) { L.push('', `*${t('top_absent')}*`); ms.top.forEach((x, i) => L.push(`${i + 1}. ${x.st.name} (${className(x.st)}) – ${x.A}`)); }
    L.push('', `⚠️ ${t('incidents')} : ${ms.inc.length} · 🚪 ${t('exits')} : ${ms.exits}`);
    return L.join('\n');
  }

  // ----- Impression / PDF -----
  function printDoc(title, inner) {
    const area = $('#printArea');
    area.innerHTML = `<div class="p-head"><div><h1>${esc(db.school.name || t('app'))}</h1><div>${esc(db.school.year || '')}${db.school.phone ? ' · ☎ ' + esc(db.school.phone) : ''}</div></div>
      <div class="p-title">${esc(title)}</div></div>${inner}
      <div class="p-foot"><span>${t('supervisor_l')} : ${esc(db.school.supervisor || '..................')}</span><span>${t('signature')} : ..................</span><span>${t('director_sig')} : ..................</span></div>`;
    document.body.classList.add('printing');
    setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); }, 100);
  }
  function printDaily(date) {
    let inner = '';
    sessionsList().forEach((ses) => {
      const s = dayStats(date, ses);
      inner += `<h2>${esc(fmtDate(date))}${db.settings.sessions === 2 ? ' — ' + sesLabel(ses) : ''}</h2>
        <p>${t('enrolled')} : <b>${s.total}</b> · ${t('present')} : <b>${s.P}</b> · ${t('absent')} : <b>${s.A}</b> · ${t('late')} : <b>${s.R}</b></p>
        <table><thead><tr><th>${t('class')}</th><th>${t('enrolled')}</th><th>${t('present')}</th><th>${t('absent')}</th><th>${t('late')}</th><th>${t('absent_names')}</th></tr></thead><tbody>
        ${s.perClass.filter((p) => p.total).map((p) => `<tr><td>${esc(p.cls.name)}</td><td>${p.total}</td><td>${p.marked ? p.P + p.R : '—'}</td><td>${p.marked ? p.A : '—'}</td><td>${p.marked ? p.R : '—'}</td>
          <td>${p.marked ? p.absents.map((x) => esc(x.name) + (justifOf(date, x.id) ? ' (J)' : '')).join(', ') : t('call_not_done')}</td></tr>`).join('')}</tbody></table>`;
    });
    const inc = db.incidents.filter((i) => i.date === date);
    if (inc.length) inner += `<h2>${t('incidents')}</h2><table><thead><tr><th>${t('time')}</th><th>${t('student')}</th><th>${t('class')}</th><th>${t('type')}</th><th>${t('note')}</th><th>${t('action')}</th></tr></thead><tbody>
      ${inc.map((i) => { const st = studentById(i.studentId); return `<tr><td>${esc(i.time)}</td><td>${esc(st ? st.name : '')}</td><td>${esc(className(st))}</td><td>${t('inc_' + i.type)}</td><td>${esc(i.note)}</td><td>${t('act_' + i.action)}</td></tr>`; }).join('')}</tbody></table>`;
    const ex = db.exits.filter((e) => e.date === date);
    if (ex.length) inner += `<h2>${t('exits')}</h2><table><thead><tr><th>${t('exit_time')}</th><th>${t('student')}</th><th>${t('class')}</th><th>${t('motif')}</th><th>${t('picked_by')}</th></tr></thead><tbody>
      ${ex.map((e) => { const st = studentById(e.studentId); return `<tr><td>${esc(e.time)}</td><td>${esc(st ? st.name : '')}</td><td>${esc(className(st))}</td><td>${t('exr_' + e.reason)}</td><td>${esc(e.by)} (${t('rel_' + e.relation)})</td></tr>`; }).join('')}</tbody></table>`;
    printDoc(t('daily_report'), inner);
  }
  function printMonthly(ym) {
    const ms = monthStats(ym);
    let inner = `<h2>${esc(fmtMonth(ym))}</h2><table><thead><tr><th>${t('class')}</th><th>${t('enrolled')}</th><th>${t('days_called')}</th><th>${t('rate')}</th><th>${t('absent')}</th><th>${t('late')}</th></tr></thead><tbody>
      ${ms.per.map((p) => `<tr><td>${esc(p.cls.name)}</td><td>${studentsOf(p.cls.id).length}</td><td>${p.days.size}</td><td><b>${pct(p)}</b></td><td>${p.A}</td><td>${p.R}</td></tr>`).join('')}</tbody></table>`;
    if (ms.top.length) inner += `<h2>${t('top_absent')}</h2><table><thead><tr><th>#</th><th>${t('student')}</th><th>${t('class')}</th><th>${t('absent')}</th><th>${t('nj_short')}</th><th>${t('late')}</th></tr></thead><tbody>
      ${ms.top.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.st.name)}</td><td>${esc(className(x.st))}</td><td>${x.A}</td><td>${x.NJ}</td><td>${x.R}</td></tr>`).join('')}</tbody></table>`;
    inner += `<p>${t('incidents')} : <b>${ms.inc.length}</b>${ms.inc.length ? ' (' + Object.entries(ms.incBy).map(([k, n]) => `${t('inc_' + k)} : ${n}`).join(', ') + ')' : ''} · ${t('exits')} : <b>${ms.exits}</b></p>`;
    printDoc(t('monthly_report'), inner);
  }

  // ----- Fiches d'appel papier (secours) -----
  function renderPaper(v) {
    const mon = (() => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return dateKey(d); })();
    v.innerHTML = `<h2 class="page-title">🖨️ ${t('paper')}</h2>
      <div class="card"><p class="muted" style="margin-top:0">${t('paper_help')}</p>
        <label>${t('week_of')}</label><input type="date" id="pWeek" value="${mon}">
        <label>${t('class')}</label><select id="pClass"><option value="all">${t('all_classes')}</option>${db.classes.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
        <button class="btn block mt" id="pGo">🖨️ ${t('print_pdf')}</button></div>`;
    $('#pGo', v).onclick = () => {
      const start = $('#pWeek', v).value || mon;
      const days = [0, 1, 2, 3, 4].map((i) => addDays(start, i));
      const cls = $('#pClass', v).value === 'all' ? db.classes.filter((c) => studentsOf(c.id).length) : [classById($('#pClass', v).value)];
      const sub = db.settings.sessions === 2 ? ['M', 'S'] : [''];
      const inner = cls.map((c) => `<div class="p-page"><h2>${esc(c.name)} — ${t('week_of')} ${esc(fmtDate(start, false))}</h2>
        <table class="grid"><thead><tr><th rowspan="${sub.length > 1 ? 2 : 1}">N°</th><th rowspan="${sub.length > 1 ? 2 : 1}">${t('student')}</th>${days.map((d) => `<th colspan="${sub.length}">${esc(fmtDate(d, false))}</th>`).join('')}</tr>
        ${sub.length > 1 ? `<tr>${days.map(() => sub.map((s) => `<th>${s}</th>`).join('')).join('')}</tr>` : ''}</thead>
        <tbody>${studentsOf(c.id).map((s, i) => `<tr><td>${i + 1}</td><td class="nm">${esc(s.name)}</td>${days.map(() => sub.map(() => '<td></td>').join('')).join('')}</tr>`).join('')}</tbody></table>
        <p class="small">P = ${t('st_P_long')} · A = ${t('st_A_long')} · R = ${t('st_R_long')}</p></div>`).join('');
      printDoc(t('paper'), inner);
    };
  }

  // ----- Réglages -----
  function renderSettings(v) {
    const S = db.settings;
    v.innerHTML = `<h2 class="page-title">⚙️ ${t('settings')}</h2>
      <div class="card">
        <h2>🏫 ${t('school')}</h2>
        <label>${t('school_name')}</label><input id="sName" value="${esc(db.school.name)}" placeholder="${t('school_ph')}">
        <div class="row2">
          <div><label>${t('school_year')}</label><input id="sYear" value="${esc(db.school.year)}" placeholder="2026-2027"></div>
          <div><label>${t('school_phone')}</label><input id="sPhone" type="tel" value="${esc(db.school.phone)}"></div>
        </div>
        <label>${t('supervisor')}</label><input id="sSup" value="${esc(db.school.supervisor)}">
        <label>${t('language')}</label>
        <div class="seg-ctl"><button class="${db.lang === 'fr' ? 'on' : ''}" data-l="fr">Français</button><button class="${db.lang === 'ar' ? 'on' : ''}" data-l="ar">العربية</button></div>
      </div>
      <div class="card">
        <h2>🕘 ${t('organisation')}</h2>
        <label>${t('sessions_q')}</label>
        <div class="seg-ctl"><button class="${S.sessions === 1 ? 'on' : ''}" data-ses="1">${t('one_session')}</button><button class="${S.sessions === 2 ? 'on' : ''}" data-ses="2">${t('two_sessions')}</button></div>
        <button class="btn light block mt" id="sDiv">🏫 ${t('divisions_title')}</button>
      </div>
      <div class="card">
        <h2>💬 ${t('messages')}</h2>
        <label>${t('msg_lang')}</label>
        <div class="seg-ctl"><button class="${S.msgLang === 'both' ? 'on' : ''}" data-ml="both">عربي + FR</button><button class="${S.msgLang === 'ar' ? 'on' : ''}" data-ml="ar">عربي</button><button class="${S.msgLang === 'fr' ? 'on' : ''}" data-ml="fr">FR</button></div>
        <button class="btn light small mt" id="msgPreview">👁 ${t('preview')}</button>
      </div>
      <div class="card">
        <h2>💰 ${t('fees')}</h2>
        <label class="switch"><input type="checkbox" id="sFees" ${S.fees ? 'checked' : ''}> <span>${t('fees_enable')}</span></label>
        <div id="feeOpts" ${S.fees ? '' : 'hidden'}>
          <div class="row2">
            <div><label>${t('default_fee')} (${t('currency')})</label><input id="sFee" type="number" inputmode="numeric" value="${esc(S.feeAmount || '')}"></div>
            <div><label>${t('first_month')}</label><select id="sStart"><option value="9" ${S.startMonth === 9 ? 'selected' : ''}>${t('september')}</option><option value="10" ${S.startMonth === 10 ? 'selected' : ''}>${t('october')}</option></select></div>
          </div>
        </div>
      </div>
      <div class="card">
        <h2>🔒 ${t('security')}</h2>
        <p class="muted" style="margin-top:0">${S.pin ? t('pin_on') : t('pin_off')}</p>
        <div class="btn-row"><button class="btn light" id="sPin">${S.pin ? t('pin_change') : t('pin_set')}</button>${S.pin ? `<button class="btn danger" id="sPinOff">${t('pin_remove')}</button>` : ''}</div>
      </div>
      <button class="btn block save-settings" id="sSave">💾 ${t('save')}</button>`;
    const collect = () => {
      db.school.name = $('#sName', v).value.trim(); db.school.year = $('#sYear', v).value.trim() || defaultYear();
      db.school.phone = $('#sPhone', v).value.trim(); db.school.supervisor = $('#sSup', v).value.trim();
      S.fees = $('#sFees', v).checked; S.feeAmount = Number($('#sFee', v).value) || 0; S.startMonth = Number($('#sStart', v).value) || 10;
    };
    $$('[data-l]', v).forEach((b) => (b.onclick = () => { collect(); db.lang = b.dataset.l; save(); render(); }));
    $$('[data-ses]', v).forEach((b) => (b.onclick = () => { collect(); S.sessions = Number(b.dataset.ses); state.appelSes = currentSession(); state.homeSes = currentSession(); save(); render(); }));
    $$('[data-ml]', v).forEach((b) => (b.onclick = () => { collect(); S.msgLang = b.dataset.ml; save(); render(); }));
    $('#sFees', v).onchange = (e) => { $('#feeOpts', v).hidden = !e.target.checked; };
    $('#sDiv', v).onclick = () => divisionsModal();
    $('#msgPreview', v).onclick = () => {
      collect();
      const demo = { id: 'x', name: db.lang === 'ar' ? 'محمد أحمد' : 'Mohamed Ahmed', sex: 'G', classId: (db.classes[0] || {}).id };
      openModal(`<h2>👁 ${t('preview')}</h2><pre class="msg-prev">${esc(buildMsg('absent', demo, { date: dateKey(), session: currentSession() }))}</pre><button class="btn light block" data-close>${t('close')}</button>`);
    };
    $('#sPin', v).onclick = () => pinSetup();
    const po = $('#sPinOff', v); if (po) po.onclick = () => confirmBox(t('pin_remove') + ' ?', t('pin_remove'), () => { S.pin = null; save(); render(); }, true);
    $('#sSave', v).onclick = () => { collect(); save(); render(); toast(t('saved')); };
  }

  // ----- Données -----
  async function doBackup(preferShare) {
    const name = `sauvegarde_surveillant_${dateKey()}.json`;
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    let done = false;
    if (preferShare && navigator.canShare) {
      try {
        const file = new File([blob], name, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); done = true; }
      } catch (e) { if (e.name === 'AbortError') return; }
    }
    if (!done) download(name, blob);
    db.lastBackup = new Date().toISOString(); save(); render(); toast(t('backup_done'));
  }
  function renderData(v) {
    v.innerHTML = `<h2 class="page-title">💾 ${t('data')}</h2>
      <div class="card">
        <p class="muted" style="margin-top:0">🔒 ${t('privacy')}</p>
        <p><b>${db.lastBackup ? tf('last_backup', { d: fmtDate(db.lastBackup.slice(0, 10)) }) : t('never_backup')}</b></p>
        <button class="btn block" id="bShare">📤 ${t('backup_share')}</button>
        <button class="btn light block mt" id="bDl">⬇️ ${t('backup_download')}</button>
        <p class="legend">${t('backup_help')}</p>
      </div>
      <div class="card">
        <button class="btn light block" id="bRestore">⬆️ ${t('restore')}</button>
        <input type="file" id="restoreFile" accept=".json,application/json" hidden>
        <p class="legend">${t('restore_help')}</p>
      </div>
      <div class="card">
        <h2>${t('new_year')}</h2>
        <p class="muted" style="margin-top:0">${t('new_year_help')}</p>
        <button class="btn light block" id="bNewYear">🔄 ${t('new_year_btn')}</button>
        <button class="btn danger block mt" id="bReset">🗑️ ${t('reset_all')}</button>
      </div>`;
    $('#bShare', v).onclick = () => doBackup(true);
    $('#bDl', v).onclick = () => doBackup(false);
    $('#bRestore', v).onclick = () => $('#restoreFile', v).click();
    $('#restoreFile', v).onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d || !Array.isArray(d.classes) || !Array.isArray(d.students)) throw new Error('bad');
          confirmBox(tf('restore_confirm', { n: d.students.length }), t('restore'), () => { db = migrate(d); save(); render(); toast(t('restored')); });
        } catch (err) { toast(t('bad_file')); }
      };
      r.readAsText(f);
    };
    $('#bNewYear', v).onclick = () => confirmBox(t('new_year_confirm'), t('new_year_btn'), () => {
      db.calls = {}; db.justifs = {}; db.incidents = []; db.exits = []; db.payments = {};
      const y = parseInt(String(db.school.year).slice(0, 4), 10); if (y) db.school.year = `${y + 1}-${y + 2}`;
      save(); render(); toast(t('saved'));
    }, true);
    $('#bReset', v).onclick = () => confirmBox(t('reset_confirm'), t('reset_all'), () => {
      const pin = db.settings.pin; localStorage.removeItem(KEY); db = freshDB(db.lang); db.settings.pin = pin; save(); setTab('home');
    }, true);
  }

  function renderHelp(v) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    v.innerHTML = `<h2 class="page-title">📲 ${t('help')}</h2>
      <div class="card"><h2>${t('install_title')}</h2>
        ${deferredPrompt ? `<button class="btn gold block" id="hInstall">📲 ${t('install')}</button>` : ''}
        <p>${isIOS ? t('install_ios') : t('install_android')}</p><p class="muted">${isIOS ? t('install_android') : t('install_ios')}</p></div>
      <div class="card"><h2>${t('howto')}</h2><ol class="olist">${[1, 2, 3, 4, 5, 6].map((i) => `<li>${t('howto_' + i)}</li>`).join('')}</ol></div>
      <p class="center muted small">${t('app')} · ${t('version')} ${VERSION}</p>`;
    const hi = $('#hInstall', v); if (hi) hi.onclick = () => $('#installBtn').click();
  }

  /* ---------------- Partage ---------------- */
  async function shareText(text) {
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    toast(t('copied'));
  }

  /* ---------------- Code PIN ---------------- */
  async function hashPin(p) {
    const s = 'surveillant:' + p;
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'h' + h;
  }
  function pinPad(title, onDone) {
    const el = $('#lock');
    let val = '';
    el.innerHTML = `<div class="lock-box"><img src="icons/icon-192.png" alt="" class="lock-logo"><h2>${esc(title)}</h2>
      <div class="pin-dots">${[0, 1, 2, 3].map(() => '<i></i>').join('')}</div><p class="pin-err" hidden></p>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => `<button ${k === '' ? 'disabled class="ghost"' : ''} data-k="${k}">${k}</button>`).join('')}</div></div>`;
    el.hidden = false;
    const dots = $$('.pin-dots i', el);
    const upd = () => dots.forEach((d, i) => d.classList.toggle('on', i < val.length));
    el.onclick = async (e) => {
      const b = e.target.closest('[data-k]'); if (!b || b.disabled) return;
      const k = b.dataset.k;
      if (k === '⌫') val = val.slice(0, -1); else if (val.length < 4) val += k;
      upd();
      if (val.length === 4) {
        const ok = await onDone(val);
        if (ok === false) { $('.pin-err', el).textContent = t('pin_wrong'); $('.pin-err', el).hidden = false; val = ''; setTimeout(upd, 250); el.querySelector('.pin-dots').classList.add('shake'); setTimeout(() => el.querySelector('.pin-dots').classList.remove('shake'), 400); }
      }
    };
  }
  function lockApp() {
    if (!db.settings.pin) return;
    pinPad(t('pin_enter'), async (v) => {
      if ((await hashPin(v)) === db.settings.pin) { $('#lock').hidden = true; $('#lock').innerHTML = ''; return true; }
      return false;
    });
  }
  function pinSetup() {
    pinPad(t('pin_new'), async (first) => {
      setTimeout(() => pinPad(t('pin_confirm'), async (second) => {
        if (second !== first) { toast(t('pin_mismatch')); $('#lock').hidden = true; return true; }
        db.settings.pin = await hashPin(first); save();
        $('#lock').hidden = true; $('#lock').innerHTML = ''; render(); toast('🔒 ' + t('pin_saved'));
        return true;
      }), 150);
      return true;
    });
  }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (db.settings.pin && hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000) lockApp();
  });

  /* ---------------- Installation (PWA) ---------------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('#installBtn').hidden = false; });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); await deferredPrompt.userChoice;
    deferredPrompt = null; $('#installBtn').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  /* ---------- Niveaux et divisions (A, B, C…) ---------- */
  function divisionsModal() {
    const current = {};
    for (let l = 1; l <= 6; l++) {
      const cls = db.classes.filter((c) => { const p = parseClass(c.name); return p && p.level === l; });
      current[l] = cls.length;
    }
    const choice = Object.assign({}, current);
    const row = (l) => `<div class="student-row" data-level="${l}">
        <span class="name">${esc(levelLabel(l))}</span>
        <div class="seg">${[0, 1, 2, 3, 4].map((n) => `<button data-n="${n}" class="P ${choice[l] === n ? 'on' : ''}" title="${n}">${n === 0 ? '–' : n === 1 ? '1' : divLabel(0) + '…' + divLabel(n - 1)}</button>`).join('')}</div>
      </div>`;
    openModal(`<h2>🏫 ${t('divisions_title')}</h2>
      <p class="legend" style="margin-top:0">${t('divisions_help')}</p>
      <div id="divRows">${[1, 2, 3, 4, 5, 6].map(row).join('')}</div>
      <p class="legend">${t('divisions_legend')}</p>
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveDiv">${t('save')}</button></div>`, (m) => {
      $$('.seg button', m).forEach((b) => (b.style.width = 'auto', b.style.minWidth = '40px', b.style.padding = '0 6px'));
      $('#divRows', m).addEventListener('click', (e) => {
        const b = e.target.closest('button[data-n]'); if (!b) return;
        const l = +b.closest('[data-level]').dataset.level;
        choice[l] = +b.dataset.n;
        $$('button', b.parentNode).forEach((x) => x.classList.toggle('on', x === b));
      });
      $('#saveDiv', m).onclick = () => {
        const kept = applyDivisions(choice);
        save(); closeModal(); render();
        toast(kept ? `${t('saved')} – ${kept} ${t('divisions_kept')}` : t('saved'));
      };
    });
  }
  // Ajoute / renomme / supprime les classes pour obtenir le nombre de divisions voulu.
  // Une classe qui contient des élèves n'est jamais supprimée.
  function applyDivisions(choice) {
    let kept = 0;
    const hasStudents = (c) => db.students.some((s) => s.classId === c.id);
    for (let l = 1; l <= 6; l++) {
      const n = choice[l];
      const cls = db.classes.filter((c) => { const p = parseClass(c.name); return p && p.level === l; });
      const byDiv = {};
      cls.forEach((c) => { const d = parseClass(c.name).div; if (!byDiv[d]) byDiv[d] = c; else byDiv['dup' + c.id] = c; });
      const remove = (c) => { if (hasStudents(c)) { kept++; return; } db.classes = db.classes.filter((x) => x.id !== c.id); };
      if (n === 0) { cls.forEach(remove); continue; }
      if (n === 1) {
        if (!byDiv['']) {
          const first = byDiv.a || cls[0];
          if (first) { first.name = prettyClassName(l, -1); byDiv[''] = first; }
          else db.classes.push(byDiv[''] = { id: uid(), name: prettyClassName(l, -1) });
        }
        cls.forEach((c) => { if (c !== byDiv['']) remove(c); });
        continue;
      }
      // n >= 2 : divisions A, B, C…
      if (byDiv[''] && !byDiv.a) { byDiv[''].name = prettyClassName(l, 0); byDiv.a = byDiv['']; delete byDiv['']; }
      const wanted = new Set();
      for (let i = 0; i < n; i++) {
        const d = 'abcde'[i];
        if (!byDiv[d]) db.classes.push(byDiv[d] = { id: uid(), name: prettyClassName(l, i) });
        wanted.add(byDiv[d]);
      }
      cls.forEach((c) => { if (!wanted.has(c)) remove(c); });
    }
    sortClasses();
    return kept;
  }


  /* ---------- Import de liste (Excel / CSV / copier-coller) ---------- */
  const norm = (x) => String(x == null ? '' : x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u064B-\u0655\u0640]/g, '').trim();
  const AR_ORD = { 'الاولي': 1, 'الاولى': 1, 'الثانية': 2, 'الثالثة': 3, 'الرابعة': 4, 'الخامسة': 5, 'السادسة': 6 };
  const AR_ORD_NAME = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
  const DIV_LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const AR_DIV = { 'ا': 'a', 'ب': 'b', 'ج': 'c', 'د': 'd', 'ه': 'e' };
  const AR_DIV_NAME = ['أ', 'ب', 'ج', 'د', 'هـ'];
  // Analyse un nom de classe : « 3ème AF - B », « 3e AF B », « 3AFB », « السنة الثالثة ب » → { level: 3, div: 'b' }
  function parseClass(name) {
    let n = norm(name).replace(/السنة|سنة|الصف|القسم/g, ' af ');
    Object.keys(AR_ORD).forEach((w) => { n = n.split(w).join(' ' + AR_ORD[w] + ' '); });
    n = n.replace(/[^a-z0-9\u0600-\u06ff]/g, '');
    n = n.replace(/[ابجده]$/, (c) => AR_DIV[c]);
    const m = n.match(/^(?:af)?([1-6])(?:ieme|eme|em|ere|er|re|e)?(?:af|annee|anneefondamentale)?(?:af)?([a-e])?$/);
    return m ? { level: +m[1], div: m[2] || '' } : null;
  }
  function canonClass(name) {
    const p = parseClass(name);
    return p ? p.level + 'af' + p.div : norm(name).replace(/[^a-z0-9\u0600-\u06ff]/g, '');
  }
  function levelLabel(level) {
    return db.lang === 'ar' ? `السنة ${AR_ORD_NAME[level]}` : `${level}${level === 1 ? 'ère' : 'ème'} AF`;
  }
  function divLabel(i) { return db.lang === 'ar' ? AR_DIV_NAME[i] : DIV_LETTERS[i]; }
  function prettyClassName(level, divIdx) { return levelLabel(level) + (divIdx >= 0 ? ' - ' + divLabel(divIdx) : ''); }
  function prettyFromRaw(raw) {
    const p = parseClass(raw);
    return p ? prettyClassName(p.level, p.div ? 'abcde'.indexOf(p.div) : -1) : raw;
  }
  function findClassByName(name) {
    const c = canonClass(name);
    return db.classes.find((k) => canonClass(k.name) === c);
  }
  function sortClasses() {
    const key = (c, i) => { const p = parseClass(c.name); return p ? p.level * 10 + (p.div ? 'abcde'.indexOf(p.div) + 1 : 0) : 1000 + i; };
    const withIdx = db.classes.map((c, i) => ({ c, k: key(c, i) }));
    withIdx.sort((a, b) => a.k - b.k);
    db.classes = withIdx.map((x) => x.c);
  }
  let xlsxPromise = null;
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!xlsxPromise) xlsxPromise = new Promise((res, rej) => {
      const sc = document.createElement('script'); sc.src = 'lib/xlsx.full.min.js';
      sc.onload = () => res(window.XLSX); sc.onerror = () => { xlsxPromise = null; rej(new Error('xlsx')); };
      document.head.appendChild(sc);
    });
    return xlsxPromise;
  }
  function parseCSV(text) {
    const first = text.split(/\r?\n/).find((l) => l.trim()) || '';
    const cnt = (ch) => first.split(ch).length - 1;
    const delim = [';', '\t', ','].sort((a, b) => cnt(b) - cnt(a))[0];
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    row.push(cell); rows.push(row);
    return rows;
  }
  const PHONE_RE = /^\+?[\d\s.\-\/]{8,}$/;
  function headerRole(h) {
    const n = norm(h);
    if (!n) return null;
    if (/division|groupe|section|شعبة|الشعبة|فوج|الفوج/.test(n)) return 'div';
    if (/parent|tuteur|pere|mere|ولي|الاب|الام/.test(n) && /tel|phone|portable|mobile|contact|هاتف/.test(n)) return 'phone';
    if (/tel|phone|portable|mobile|contact|هاتف|جوال/.test(n)) return 'phone';
    if (/sexe|genre|الجنس/.test(n)) return 'sex';
    if (/parent|tuteur|pere|mere|ولي/.test(n)) return 'parent';
    if (/classe|class|niveau|قسم|القسم|الفصل|المستوى/.test(n)) return 'class';
    if (/prenom|first|الاسم الاول/.test(n)) return 'first';
    if (/nom|name|eleve|اسم|الاسم|تلميذ|التلميذ/.test(n)) return 'name';
    return null;
  }
  // rows : tableau de lignes ; renvoie [{name, phone, className}]
  function rowsToEntries(rows, sheetClass) {
    rows = rows.map((r) => (r || []).map((c) => String(c == null ? '' : c).replace(/\s+/g, ' ').trim()));
    let hIdx = -1, cols = {};
    for (let i = 0; i < Math.min(rows.length, 8) && hIdx < 0; i++) {
      const roles = {};
      rows[i].forEach((c, j) => {
        const r = headerRole(c);
        if (r === 'phone' && roles.phone !== undefined && roles.phone2 === undefined) roles.phone2 = j;
        else if (r && roles[r] === undefined) roles[r] = j;
      });
      if (roles.name !== undefined || roles.first !== undefined) { hIdx = i; cols = roles; }
    }
    const out = [];
    rows.slice(hIdx + 1).forEach((r) => {
      if (!r.some(Boolean)) return;
      let name = '', phone = '', cls = '', parent = '', phone2 = '', sex = '';
      if (hIdx >= 0) {
        const nm = cols.name !== undefined ? r[cols.name] || '' : '';
        const fn = cols.first !== undefined ? r[cols.first] || '' : '';
        name = [fn, nm].filter(Boolean).join(' ');
        phone = cols.phone !== undefined ? r[cols.phone] || '' : '';
        phone2 = cols.phone2 !== undefined ? r[cols.phone2] || '' : '';
        parent = cols.parent !== undefined ? r[cols.parent] || '' : '';
        const sx = cols.sex !== undefined ? norm(r[cols.sex] || '') : '';
        sex = /^(f|fille|feminin|female|انثى|انثي|بنت)/.test(sx) ? 'F' : /^(g|m|garcon|masculin|male|ذكر|ولد)/.test(sx) ? 'G' : '';
        cls = cols.class !== undefined ? r[cols.class] || '' : '';
        const dv = cols.div !== undefined ? r[cols.div] || '' : '';
        if (dv) cls = (cls ? cls + ' ' : '') + dv;
      } else {
        name = r.find((c) => c && /[A-Za-z\u00C0-\u024F\u0600-\u06FF]/.test(c) && !PHONE_RE.test(c)) || '';
        phone = r.find((c) => c && PHONE_RE.test(c)) || '';
      }
      name = name.replace(/^\d+\s*[-.)]\s*/, '').trim(); // retire « 1. » / « 2- »
      if (!name || !/[A-Za-z\u00C0-\u024F\u0600-\u06FF]/.test(name)) return;
      out.push({ name, phone: phone.trim(), phone2: phone2.trim(), parent: parent.trim(), sex, className: cls || sheetClass || '' });
    });
    return out;
  }
  async function readFileEntries(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'csv' || ext === 'txt') {
      const buf = await file.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buf);
      if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buf);
      return rowsToEntries(parseCSV(text.replace(/^\uFEFF/, '')), '');
    }
    const XLSX = await loadXLSX();
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheets = wb.SheetNames.map((n) => ({ n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' }) }))
      .filter((sh) => sh.rows.some((r) => r.some((c) => String(c).trim())));
    const generic = (n) => /^(feuil|sheet|feuille|ورقة)\s*\d*$/i.test(n.trim());
    const perSheet = sheets.length > 1;
    return sheets.flatMap((sh) => rowsToEntries(sh.rows, perSheet && !generic(sh.n) ? sh.n : ''));
  }
  function planImport(entries, targetCid) {
    const plan = [], newClasses = new Map(); let dupes = 0;
    const seen = new Set(db.students.map((s) => s.classId + '|' + norm(s.name)));
    entries.forEach((e) => {
      let cid = targetCid, label = classById(targetCid) ? classById(targetCid).name : '';
      if (e.className) {
        const c = findClassByName(e.className);
        if (c) { cid = c.id; label = c.name; }
        else {
          const key = canonClass(e.className);
          if (!newClasses.has(key)) newClasses.set(key, { id: uid(), name: prettyFromRaw(e.className) });
          cid = newClasses.get(key).id; label = newClasses.get(key).name;
        }
      }
      if (!cid) return;
      const k = cid + '|' + norm(e.name);
      if (seen.has(k)) { dupes++; return; }
      seen.add(k);
      plan.push(Object.assign({}, e, { classId: cid, label }));
    });
    return { plan, newClasses: [...newClasses.values()], dupes };
  }

  function importModal(cid) {
    if (!db.classes.length) { db.classes = I18N[db.lang].default_classes.map((n) => ({ id: uid(), name: n })); save(); }
    if (!classById(cid)) cid = db.classes[0].id;
    let entries = null;
    openModal(`<h2>📥 ${t('import_title')}</h2>
      <div class="card" style="box-shadow:none;border:1.5px solid var(--border)">
        <h3 style="margin-top:0">${t('import_file')}</h3>
        <button class="btn block" id="pickFile">${t('choose_file')}</button>
        <input type="file" id="impFile" accept=".xlsx,.xls,.ods,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain" hidden>
        <p class="legend">${t('import_file_help')}</p>
        <button class="btn light small" id="tplBtn">${t('template')}</button>
      </div>
      <label>${t('import_paste')}</label>
      <textarea id="bulk" style="min-height:120px" placeholder="Mohamed Ould Ahmed ; 22123456\nFatimetou Mint Sidi\nAminata Ba"></textarea>
      <p class="legend">${t('bulk_help')}</p>
      <label>${t('target_class')}</label>
      <select id="impClass">${db.classes.map((c) => `<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <div id="impPreview"></div>
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="doImport">${t('analyze')}</button></div>`, (m) => {
      const prev = $('#impPreview', m), btn = $('#doImport', m);
      const showPreview = () => {
        const { plan, newClasses, dupes } = planImport(entries, $('#impClass', m).value);
        if (!plan.length) {
          prev.innerHTML = `<div class="hint mt">${dupes ? `${t('all_exist')} (${dupes})` : t('nothing_found')}</div>`;
          btn.textContent = t('analyze'); return null;
        }
        const groups = {};
        plan.forEach((p) => { (groups[p.label] = groups[p.label] || []).push(p); });
        prev.innerHTML = `<div class="card mt" style="box-shadow:none;border:1.5px solid var(--green);background:var(--green-light)">
          <b>✅ ${plan.length} ${t('found')}</b>
          ${dupes ? `<div class="sub muted">${dupes} ${t('dupes')}</div>` : ''}
          ${newClasses.length ? `<div class="sub muted">+ ${newClasses.length} ${t('new_classes')} : ${newClasses.map((c) => esc(c.name)).join(', ')}</div>` : ''}
          ${Object.entries(groups).map(([g, l]) => `<div class="mt"><b>${esc(g)}</b> (${l.length})<div class="sub">${l.slice(0, 5).map((p) => esc(p.name)).join(' · ')}${l.length > 5 ? ` ${t('and_more')} ${l.length - 5} ${t('others')}` : ''}</div></div>`).join('')}
        </div>`;
        btn.textContent = `${t('do_import')} (${plan.length})`;
        return { plan, newClasses };
      };
      let ready = null;
      $('#pickFile', m).onclick = () => $('#impFile', m).click();
      $('#impFile', m).onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        prev.innerHTML = `<p class="center muted mt">${t('reading')}</p>`;
        try { entries = await readFileEntries(f); $('#bulk', m).value = ''; ready = showPreview(); }
        catch (err) { prev.innerHTML = `<div class="hint mt">${t('bad_file')}</div>`; }
        e.target.value = '';
      };
      $('#bulk', m).oninput = () => { entries = null; ready = null; prev.innerHTML = ''; btn.textContent = t('analyze'); };
      $('#impClass', m).onchange = () => { if (entries) ready = showPreview(); };
      $('#tplBtn', m).onclick = () => {
        const rows = [['Nom', 'Sexe', 'Classe', 'Nom du parent', 'Téléphone parent', 'Téléphone 2'], ['Mohamed Ould Ahmed', 'G', '3e AF - A', 'Ahmed Ould Sidi', '22123456', ''], ['Fatimetou Mint Sidi', 'F', '3e AF - A', '', '46123456', ''], ['Aminata Ba', 'F', '3e AF - B', 'Oumar Ba', '36123456', '22998877'], ['Sidi Ould Cheikh', 'G', '3e AF - C', '', '', '']];
        download('modele_eleves.csv', '\ufeff' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
      };
      btn.onclick = () => {
        if (!ready) {
          if (!entries) {
            const txt = $('#bulk', m).value;
            entries = txt.trim() ? rowsToEntries(txt.split(/\r?\n/).map((l) => l.split(/[;\t]/)), '') : [];
          }
          ready = showPreview(); return;
        }
        ready.newClasses.forEach((c) => db.classes.push(c));
        sortClasses();
        ready.plan.forEach((p) => db.students.push({ id: uid(), name: p.name, sex: p.sex || '', parent: p.parent || '', phone: p.phone || '', phone2: p.phone2 || '', health: '', fee: null, classId: p.classId }));
        save(); closeModal();
        if (ready.plan.length) state.elevesClass = ready.plan[0].classId;
        state.search = ''; tab = 'eleves';
        $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'eleves'));
        render(); toast(`${ready.plan.length} ${t('added')}`);
      };
    });
  }


  /* ---------------- Démarrage ---------------- */
  save();
  render();
  if (db.settings.pin) lockApp();
})();

/* =========================================================
   Surveillant – École primaire (Mauritanie)
   Application web installable (PWA), fonctionne hors ligne.
   Toutes les données restent sur le téléphone (localStorage).
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- Traductions FR / AR ---------------- */
  const I18N = {
    fr: {
      app: 'Surveillant',
      tab_home: 'Accueil', tab_appel: 'Appel', tab_incidents: 'Incidents', tab_eleves: 'Élèves', tab_reglages: 'Réglages',
      install: 'Installer',
      students: 'Élèves', present: 'Présents', absent: 'Absents', late: 'Retards', incidents: 'Incidents',
      today_classes: "Appel du jour par classe", done: 'Fait', not_done: 'Non fait',
      share_report: 'Partager le rapport du jour (WhatsApp)', copy_report: 'Copier le rapport',
      no_class: "Aucune classe. Ajoutez vos classes dans l'onglet Élèves.",
      no_student: "Aucun élève dans cette classe. Ajoutez-les dans l'onglet Élèves.",
      class: 'Classe', date: 'Date', all_present: 'Tous présents', reset_call: 'Effacer',
      legend: 'P = Présent · A = Absent · R = En retard. Enregistrement automatique.',
      saved: 'Enregistré ✓',
      new_incident: 'Nouvel incident', student: 'Élève', choose: '— Choisir —', type: 'Type',
      note: 'Description', action: 'Mesure prise', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', close: 'Fermer',
      recent_incidents: 'Incidents récents', no_incident: 'Aucun incident enregistré.', filter_today: "Aujourd'hui", filter_all: 'Tous',
      inc_bagarre: 'Bagarre', inc_insolence: 'Insolence / impolitesse', inc_tenue: 'Tenue non conforme', inc_devoirs: 'Travail non fait',
      inc_degradation: 'Dégradation de matériel', inc_sante: 'Malade / blessé', inc_fuite: 'Sortie sans autorisation', inc_autre: 'Autre',
      act_aucune: 'Aucune', act_avertissement: 'Avertissement oral', act_punition: 'Punition', act_parents: 'Parents convoqués',
      act_directeur: 'Directeur informé', act_soins: 'Soins / parents appelés',
      classes: 'Classes', add_class: '+ Classe', class_name: 'Nom de la classe', add_student: '+ Élève', bulk_add: '+ Liste',
      student_name: "Nom complet de l'élève", parent_phone: 'Téléphone du parent', bulk_help: "Un élève par ligne. Pour ajouter le téléphone : Nom ; 22123456",
      names: 'Noms', added: 'élève(s) ajouté(s)', rename: 'Renommer', delete_class_confirm: 'Supprimer cette classe et tous ses élèves ?',
      delete_student_confirm: 'Supprimer cet élève ?', call: 'Appeler', whatsapp: 'WhatsApp',
      absences: 'Absences', lates: 'Retards', history: 'Historique des incidents', search: 'Rechercher un élève…',
      school: 'École', school_name: "Nom de l'école", supervisor: 'Nom du surveillant', language: 'Langue',
      data: 'Données', export_csv: 'Exporter les présences (CSV / Excel)', export_inc: 'Exporter les incidents (CSV)',
      backup: 'Sauvegarder (fichier)', restore: 'Restaurer une sauvegarde', reset_all: 'Tout effacer',
      reset_confirm: 'Effacer TOUTES les données ? Cette action est définitive.', restored: 'Sauvegarde restaurée ✓', bad_file: 'Fichier invalide',
      privacy: "Les données restent uniquement sur ce téléphone. Faites une sauvegarde régulièrement.",
      install_title: "Installer sur l'écran d'accueil",
      install_android: "Android (Chrome) : touchez le bouton « Installer » en haut, ou menu ⋮ → « Ajouter à l'écran d'accueil ».",
      install_ios: "iPhone (Safari) : touchez Partager ⬆️ puis « Sur l'écran d'accueil ».",
      report_title: 'Rapport du jour', report_by_class: 'Par classe', report_absents: 'Absents', report_lates: 'Retards',
      report_incidents: 'Incidents', report_none: 'Aucun', report_sup: 'Surveillant', report_not_done: 'appel non fait',
      copied: 'Copié ✓', required: 'Champ obligatoire', name_required: 'Veuillez saisir un nom',
      welcome: "Bienvenue ! 1) Indiquez les divisions de chaque niveau (A, B, C…). 2) Importez la liste des élèves. 3) Saisissez le nom de l'école dans Réglages.",
      divisions_btn: 'Divisions', divisions_title: 'Niveaux et divisions',
      divisions_help: "Pour chaque niveau, choisissez le nombre de divisions : 1 = une seule classe, A…B = 2 divisions (A et B), A…C = 3 divisions, etc. « – » = niveau absent.",
      divisions_legend: "Les élèves déjà enregistrés sont conservés. Une classe qui contient des élèves n'est jamais supprimée.",
      divisions_kept: 'classe(s) conservée(s) car elles contiennent des élèves',
      default_classes: ['1ère AF', '2ème AF', '3ème AF', '4ème AF', '5ème AF', '6ème AF'],
      version: 'Version',
      import_list: '📥 Importer une liste', import_title: "Importer une liste d'élèves",
      import_file: 'Depuis un fichier Excel ou CSV', choose_file: '📂 Choisir un fichier (Excel, CSV)',
      import_file_help: "Colonnes reconnues : Nom (obligatoire), Prénom, Téléphone, Classe, Division. Exemple de classe : « 3e AF - A ». Si le fichier a une feuille par classe (ex : « 3AF B »), chaque feuille devient une classe.",
      import_paste: 'Ou coller les noms', target_class: 'Classe de destination (si le fichier n\'indique pas la classe)',
      analyze: 'Analyser', do_import: 'Importer', found: 'élève(s) trouvé(s)', dupes: 'doublon(s) ignoré(s)', new_classes: 'nouvelle(s) classe(s)',
      nothing_found: 'Aucun nom trouvé. Vérifiez le fichier.', reading: 'Lecture du fichier…', template: '⬇️ Télécharger un modèle',
      import_hint: "Astuce : vous pouvez importer toute l'école d'un coup avec une colonne « Classe ».",
      all_exist: 'Ces élèves existent déjà dans l\'application.',
      and_more: 'et',
      others: 'autres'
    },
    ar: {
      app: 'المراقب',
      tab_home: 'الرئيسية', tab_appel: 'الحضور', tab_incidents: 'المخالفات', tab_eleves: 'التلاميذ', tab_reglages: 'الإعدادات',
      install: 'تثبيت',
      students: 'التلاميذ', present: 'حاضرون', absent: 'غائبون', late: 'متأخرون', incidents: 'مخالفات',
      today_classes: 'حضور اليوم حسب القسم', done: 'تم', not_done: 'لم يتم',
      share_report: 'مشاركة تقرير اليوم (واتساب)', copy_report: 'نسخ التقرير',
      no_class: 'لا توجد أقسام. أضف الأقسام من تبويب التلاميذ.',
      no_student: 'لا يوجد تلاميذ في هذا القسم. أضفهم من تبويب التلاميذ.',
      class: 'القسم', date: 'التاريخ', all_present: 'الكل حاضر', reset_call: 'مسح',
      legend: 'ح = حاضر · غ = غائب · ت = متأخر. الحفظ تلقائي.',
      saved: 'تم الحفظ ✓',
      new_incident: 'مخالفة جديدة', student: 'التلميذ', choose: '— اختر —', type: 'النوع',
      note: 'الوصف', action: 'الإجراء المتخذ', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', close: 'إغلاق',
      recent_incidents: 'آخر المخالفات', no_incident: 'لا توجد مخالفات مسجلة.', filter_today: 'اليوم', filter_all: 'الكل',
      inc_bagarre: 'شجار', inc_insolence: 'سوء أدب', inc_tenue: 'زي غير لائق', inc_devoirs: 'عدم إنجاز الواجب',
      inc_degradation: 'إتلاف الممتلكات', inc_sante: 'مريض / مصاب', inc_fuite: 'خروج دون إذن', inc_autre: 'أخرى',
      act_aucune: 'لا شيء', act_avertissement: 'تنبيه شفهي', act_punition: 'عقوبة', act_parents: 'استدعاء ولي الأمر',
      act_directeur: 'إبلاغ المدير', act_soins: 'إسعاف / الاتصال بالأهل',
      classes: 'الأقسام', add_class: '+ قسم', class_name: 'اسم القسم', add_student: '+ تلميذ', bulk_add: '+ قائمة',
      student_name: 'الاسم الكامل للتلميذ', parent_phone: 'هاتف ولي الأمر', bulk_help: 'تلميذ واحد في كل سطر. لإضافة الهاتف: الاسم ; 22123456',
      names: 'الأسماء', added: 'تلميذ أضيف', rename: 'إعادة تسمية', delete_class_confirm: 'حذف هذا القسم وجميع تلاميذه؟',
      delete_student_confirm: 'حذف هذا التلميذ؟', call: 'اتصال', whatsapp: 'واتساب',
      absences: 'الغيابات', lates: 'التأخرات', history: 'سجل المخالفات', search: 'ابحث عن تلميذ…',
      school: 'المدرسة', school_name: 'اسم المدرسة', supervisor: 'اسم المراقب', language: 'اللغة',
      data: 'البيانات', export_csv: 'تصدير الحضور (CSV / Excel)', export_inc: 'تصدير المخالفات (CSV)',
      backup: 'نسخة احتياطية (ملف)', restore: 'استرجاع نسخة احتياطية', reset_all: 'مسح كل البيانات',
      reset_confirm: 'مسح جميع البيانات؟ لا يمكن التراجع.', restored: 'تم الاسترجاع ✓', bad_file: 'ملف غير صالح',
      privacy: 'تبقى البيانات على هذا الهاتف فقط. احفظ نسخة احتياطية بانتظام.',
      install_title: 'التثبيت على الشاشة الرئيسية',
      install_android: 'أندرويد (كروم): اضغط زر «تثبيت» في الأعلى، أو القائمة ⋮ ← «إضافة إلى الشاشة الرئيسية».',
      install_ios: 'آيفون (سفاري): اضغط مشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية».',
      report_title: 'تقرير اليوم', report_by_class: 'حسب القسم', report_absents: 'الغائبون', report_lates: 'المتأخرون',
      report_incidents: 'المخالفات', report_none: 'لا يوجد', report_sup: 'المراقب', report_not_done: 'لم يُسجل الحضور',
      copied: 'تم النسخ ✓', required: 'حقل إجباري', name_required: 'يرجى إدخال الاسم',
      welcome: 'مرحباً! 1) حدد شعب كل مستوى (أ، ب، ج…). 2) استورد قائمة التلاميذ. 3) أدخل اسم المدرسة في الإعدادات.',
      divisions_btn: 'الشعب', divisions_title: 'المستويات والشعب',
      divisions_help: 'لكل مستوى اختر عدد الشعب: 1 = قسم واحد، أ…ب = شعبتان، أ…ج = ثلاث شعب، إلخ. «–» = المستوى غير موجود.',
      divisions_legend: 'يتم الاحتفاظ بالتلاميذ المسجلين. لا يُحذف أبداً قسم يحتوي على تلاميذ.',
      divisions_kept: 'قسم تم الاحتفاظ به لأنه يحتوي على تلاميذ',
      default_classes: ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة', 'السنة السادسة'],
      version: 'الإصدار',
      import_list: '📥 استيراد قائمة', import_title: 'استيراد قائمة التلاميذ',
      import_file: 'من ملف Excel أو CSV', choose_file: '📂 اختر ملفاً (Excel، CSV)',
      import_file_help: 'الأعمدة المعروفة: الاسم (إجباري)، الهاتف، القسم، الشعبة. إذا كان الملف يحتوي على ورقة لكل قسم، تصبح كل ورقة قسماً.',
      import_paste: 'أو الصق الأسماء', target_class: 'القسم المستهدف (إذا لم يحدد الملف القسم)',
      analyze: 'تحليل', do_import: 'استيراد', found: 'تلميذ', dupes: 'مكرر تم تجاهله', new_classes: 'قسم جديد',
      nothing_found: 'لم يتم العثور على أسماء. تحقق من الملف.', reading: 'جارٍ قراءة الملف…', template: '⬇️ تحميل نموذج',
      import_hint: 'نصيحة: يمكنك استيراد كل المدرسة دفعة واحدة باستخدام عمود «القسم».',
      all_exist: 'هؤلاء التلاميذ موجودون بالفعل في التطبيق.',
      and_more: 'و',
      others: 'آخرين'
    }
  };
  const STATUS_LABEL = { fr: { P: 'P', A: 'A', R: 'R' }, ar: { P: 'ح', A: 'غ', R: 'ت' } };
  const INC_TYPES = ['bagarre', 'insolence', 'tenue', 'devoirs', 'degradation', 'sante', 'fuite', 'autre'];
  const ACTIONS = ['aucune', 'avertissement', 'punition', 'parents', 'directeur', 'soins'];

  /* ---------------- Données ---------------- */
  const KEY = 'surveillant_data_v1';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.classes) return d;
    } catch (e) { /* ignore */ }
    const lang = (navigator.language || 'fr').startsWith('ar') ? 'ar' : 'fr';
    return {
      lang,
      school: { name: '', supervisor: '' },
      classes: I18N[lang].default_classes.map((n) => ({ id: uid(), name: n })),
      students: [],
      attendance: {},
      incidents: []
    };
  }
  let db = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));

  /* ---------------- Utilitaires ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const t = (k) => (I18N[db.lang][k] !== undefined ? I18N[db.lang][k] : I18N.fr[k] || k);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeNow = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const locale = () => (db.lang === 'ar' ? 'ar-MR-u-nu-latn' : 'fr-FR');
  function fmtDate(key, long = true) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    try {
      return dt.toLocaleDateString(locale(), long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' });
    } catch (e) { return key; }
  }
  const byName = (a, b) => a.name.localeCompare(b.name, db.lang === 'ar' ? 'ar' : 'fr');
  const classById = (id) => db.classes.find((c) => c.id === id);
  const studentById = (id) => db.students.find((s) => s.id === id);
  const studentsOf = (cid) => db.students.filter((s) => s.classId === cid).sort(byName);
  const cleanPhone = (p) => String(p || '').replace(/[^\d+]/g, '');
  function waPhone(p) {
    let n = cleanPhone(p).replace(/^\+/, '').replace(/^00/, '');
    if (n.length === 8) n = '222' + n; // numéro mauritanien local
    return n;
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 1800);
  }
  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    if (onMount) onMount($('#modalBody'));
  }
  function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const csvCell = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;

  /* ---------------- Statistiques ---------------- */
  function dayStats(key) {
    const att = db.attendance[key] || {};
    const res = { total: db.students.length, P: 0, A: 0, R: 0, perClass: [] };
    db.classes.forEach((c) => {
      const st = studentsOf(c.id);
      const pc = { cls: c, total: st.length, P: 0, A: 0, R: 0, marked: 0, absents: [], lates: [] };
      st.forEach((s) => {
        const v = att[s.id];
        if (v) { pc.marked++; pc[v]++; res[v]++; }
        if (v === 'A') pc.absents.push(s.name);
        if (v === 'R') pc.lates.push(s.name);
      });
      res.perClass.push(pc);
    });
    return res;
  }

  function buildReport(key) {
    const s = dayStats(key);
    const inc = db.incidents.filter((i) => i.date === key);
    const L = [];
    L.push(`📋 *${t('report_title')}*${db.school.name ? ' – ' + db.school.name : ''}`);
    L.push(`📅 ${fmtDate(key)}`);
    L.push('');
    L.push(`👥 ${t('students')} : ${s.total}`);
    L.push(`✅ ${t('present')} : ${s.P}   ❌ ${t('absent')} : ${s.A}   ⏰ ${t('late')} : ${s.R}`);
    L.push('');
    L.push(`*${t('report_by_class')}*`);
    s.perClass.filter((p) => p.total).forEach((p) => {
      if (!p.marked) { L.push(`• ${p.cls.name} : ${t('report_not_done')}`); return; }
      L.push(`• ${p.cls.name} : ${p.P + p.R}/${p.total} (${t('absent')} ${p.A}, ${t('late')} ${p.R})`);
      if (p.absents.length) L.push(`   ❌ ${p.absents.join(', ')}`);
      if (p.lates.length) L.push(`   ⏰ ${p.lates.join(', ')}`);
    });
    L.push('');
    L.push(`⚠️ *${t('report_incidents')}* (${inc.length})`);
    if (!inc.length) L.push(`• ${t('report_none')}`);
    inc.forEach((i) => {
      const st = studentById(i.studentId);
      const cl = st ? classById(st.classId) : null;
      L.push(`• ${i.time} – ${st ? st.name : '?'}${cl ? ' (' + cl.name + ')' : ''} : ${t('inc_' + i.type)}${i.note ? ' – ' + i.note : ''}${i.action && i.action !== 'aucune' ? ' → ' + t('act_' + i.action) : ''}`);
    });
    if (db.school.supervisor) { L.push(''); L.push(`${t('report_sup')} : ${db.school.supervisor}`); }
    return L.join('\n');
  }

  async function shareReport(key) {
    const text = buildReport(key);
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast(t('copied'));
  }

  /* ---------------- Navigation ---------------- */
  let tab = 'home';
  const state = { appelClass: null, appelDate: dateKey(), incFilter: 'today', elevesClass: null, search: '' };

  function setTab(name) {
    tab = name;
    $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    render();
    window.scrollTo(0, 0);
  }
  $('#tabbar').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });

  function applyLang() {
    document.documentElement.lang = db.lang;
    document.documentElement.dir = db.lang === 'ar' ? 'rtl' : 'ltr';
    $('#appTitle').textContent = t('app');
    $('#schoolName').textContent = db.school.name || '';
    $('#langBtn').textContent = db.lang === 'ar' ? 'FR' : 'ع';
    $('#installBtn').textContent = t('install');
    $$('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t)));
  }
  $('#langBtn').addEventListener('click', () => { db.lang = db.lang === 'ar' ? 'fr' : 'ar'; save(); applyLang(); render(); });

  function render() {
    applyLang();
    const v = $('#view');
    ({ home: renderHome, appel: renderAppel, incidents: renderIncidents, eleves: renderEleves, reglages: renderReglages })[tab](v);
  }

  /* ---------------- Vue : Accueil ---------------- */
  function renderHome(v) {
    const key = dateKey();
    const s = dayStats(key);
    const incToday = db.incidents.filter((i) => i.date === key).length;
    const showWelcome = !db.students.length;
    v.innerHTML = `
      <p class="date-line">${esc(fmtDate(key))}</p>
      ${showWelcome ? `<div class="hint">👋 ${esc(t('welcome'))}<div class="btn-row mt"><button class="btn light" id="homeDiv">🏫 ${t('divisions_btn')}</button><button class="btn gold" id="homeImport">${t('import_list')}</button></div></div>` : ''}
      <div class="stats">
        <div class="stat"><b>${s.total}</b><span>${t('students')}</span></div>
        <div class="stat"><b>${s.P}</b><span>${t('present')}</span></div>
        <div class="stat red"><b>${s.A}</b><span>${t('absent')}</span></div>
        <div class="stat orange"><b>${s.R}</b><span>${t('late')}</span></div>
      </div>
      <div class="card">
        <h2>${t('today_classes')}</h2>
        ${db.classes.length ? `<ul class="list">${s.perClass.map((p) => `
          <li data-goto-class="${p.cls.id}" style="cursor:pointer">
            <div class="grow"><b>${esc(p.cls.name)}</b>
              <div class="sub">${p.total} ${t('students')}${p.marked ? ` · ❌ ${p.A} · ⏰ ${p.R}` : ''}</div></div>
            ${p.total && p.marked >= p.total ? `<span class="badge ok">${t('done')}</span>` : `<span class="badge no">${t('not_done')}</span>`}
          </li>`).join('')}</ul>` : `<p class="empty">${t('no_class')}</p>`}
      </div>
      <div class="card">
        <div class="stat gold" style="box-shadow:none;padding:4px 10px;margin-bottom:12px"><b>${incToday}</b><span>${t('incidents')} – ${t('filter_today')}</span></div>
        <button class="btn block" id="shareBtn">📤 ${t('share_report')}</button>
        <button class="btn light block mt" id="copyBtn">📋 ${t('copy_report')}</button>
      </div>`;
    $$('[data-goto-class]', v).forEach((li) => li.addEventListener('click', () => {
      state.appelClass = li.dataset.gotoClass; state.appelDate = key; setTab('appel');
    }));
    const hd = $('#homeDiv', v); if (hd) hd.onclick = () => divisionsModal();
    const hi = $('#homeImport', v); if (hi) hi.onclick = () => importModal(db.classes[0] && db.classes[0].id);
    $('#shareBtn', v).onclick = () => shareReport(key);
    $('#copyBtn', v).onclick = () => copyText(buildReport(key));
  }

  /* ---------------- Vue : Appel ---------------- */
  function renderAppel(v) {
    if (!db.classes.length) { v.innerHTML = `<div class="card"><p class="empty">${t('no_class')}</p></div>`; return; }
    if (!classById(state.appelClass)) state.appelClass = db.classes[0].id;
    const cid = state.appelClass, key = state.appelDate;
    const st = studentsOf(cid);
    const att = db.attendance[key] || {};
    const lbl = STATUS_LABEL[db.lang];
    const count = { P: 0, A: 0, R: 0 };
    st.forEach((s) => { if (att[s.id]) count[att[s.id]]++; });

    v.innerHTML = `
      <div class="card">
        <div class="row2">
          <div><label>${t('class')}</label>
            <select id="clsSel">${db.classes.map((c) => `<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div><label>${t('date')}</label><input type="date" id="dateSel" value="${key}" max="${dateKey()}"></div>
        </div>
        <div class="summary-bar mt">
          <span class="badge ok">${t('present')} ${count.P}</span>
          <span class="badge red">${t('absent')} ${count.A}</span>
          <span class="badge no">${t('late')} ${count.R}</span>
          <span class="badge" style="background:#eef1ef">${st.length - count.P - count.A - count.R} / ${st.length}</span>
        </div>
        ${st.length ? `<div class="btn-row"><button class="btn light small" id="allP">✅ ${t('all_present')}</button><button class="btn danger small" id="clearAtt">${t('reset_call')}</button></div>` : ''}
      </div>
      <div class="card">
        ${st.length ? st.map((s, i) => `
          <div class="student-row" data-sid="${s.id}">
            <span class="num">${i + 1}</span>
            <span class="name">${esc(s.name)}</span>
            <div class="seg">${['P', 'A', 'R'].map((x) => `<button class="${x} ${att[s.id] === x ? 'on' : ''}" data-st="${x}">${lbl[x]}</button>`).join('')}</div>
          </div>`).join('') : `<p class="empty">${t('no_student')}</p>`}
        ${st.length ? `<p class="legend">${t('legend')}</p>` : ''}
      </div>`;

    $('#clsSel', v).onchange = (e) => { state.appelClass = e.target.value; render(); };
    $('#dateSel', v).onchange = (e) => { if (e.target.value) { state.appelDate = e.target.value; render(); } };
    const ensure = () => (db.attendance[key] = db.attendance[key] || {});
    if (st.length) {
      $('#allP', v).onclick = () => { const a = ensure(); st.forEach((s) => (a[s.id] = 'P')); save(); render(); toast(t('saved')); };
      $('#clearAtt', v).onclick = () => { const a = ensure(); st.forEach((s) => delete a[s.id]); save(); render(); };
    }
    $$('.student-row', v).forEach((row) => row.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-st]'); if (!b) return;
      const a = ensure(), sid = row.dataset.sid;
      if (a[sid] === b.dataset.st) delete a[sid]; else a[sid] = b.dataset.st;
      save(); render();
    }));
  }

  /* ---------------- Vue : Incidents ---------------- */
  function studentOptions(selected) {
    return db.classes.map((c) => {
      const st = studentsOf(c.id); if (!st.length) return '';
      return `<optgroup label="${esc(c.name)}">${st.map((s) => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</optgroup>`;
    }).join('');
  }
  function incidentForm(inc, presetStudent) {
    const i = inc || { studentId: presetStudent || '', type: 'bagarre', note: '', action: 'avertissement', date: dateKey(), time: timeNow() };
    return `
      <label>${t('student')} *</label>
      <select id="incStudent"><option value="">${t('choose')}</option>${studentOptions(i.studentId)}</select>
      <div class="row2">
        <div><label>${t('type')}</label><select id="incType">${INC_TYPES.map((x) => `<option value="${x}" ${x === i.type ? 'selected' : ''}>${t('inc_' + x)}</option>`).join('')}</select></div>
        <div><label>${t('action')}</label><select id="incAction">${ACTIONS.map((x) => `<option value="${x}" ${x === i.action ? 'selected' : ''}>${t('act_' + x)}</option>`).join('')}</select></div>
      </div>
      <div class="row2">
        <div><label>${t('date')}</label><input type="date" id="incDate" value="${i.date}"></div>
        <div><label>⏱</label><input type="time" id="incTime" value="${i.time}"></div>
      </div>
      <label>${t('note')}</label>
      <textarea id="incNote">${esc(i.note)}</textarea>`;
  }
  function readIncidentForm(root) {
    const sid = $('#incStudent', root).value;
    if (!sid) { toast(t('required') + ' : ' + t('student')); return null; }
    return {
      studentId: sid, type: $('#incType', root).value, action: $('#incAction', root).value,
      date: $('#incDate', root).value || dateKey(), time: $('#incTime', root).value || timeNow(),
      note: $('#incNote', root).value.trim()
    };
  }
  function incidentItem(i) {
    const st = studentById(i.studentId);
    const cl = st ? classById(st.classId) : null;
    return `<div class="inc-item" data-iid="${i.id}">
      <div class="inc-top">
        <div><b>${esc(st ? st.name : '?')}</b> <span class="inc-meta">${cl ? esc(cl.name) : ''}</span><br>
          <span class="badge red">${t('inc_' + i.type)}</span> ${i.action && i.action !== 'aucune' ? `<span class="badge ok">${t('act_' + i.action)}</span>` : ''}</div>
        <div style="white-space:nowrap"><button class="icon-btn" data-edit-inc title="${t('edit')}">✏️</button><button class="icon-btn" data-del-inc title="${t('delete')}">🗑️</button></div>
      </div>
      ${i.note ? `<p class="inc-note">${esc(i.note)}</p>` : ''}
      <div class="inc-meta">${esc(fmtDate(i.date, false))} · ${esc(i.time)}</div>
    </div>`;
  }
  function bindIncidentItems(root) {
    $$('.inc-item', root).forEach((el) => {
      const id = el.dataset.iid;
      const del = $('[data-del-inc]', el), ed = $('[data-edit-inc]', el);
      if (del) del.onclick = () => { if (confirm(t('delete') + ' ?')) { db.incidents = db.incidents.filter((x) => x.id !== id); save(); closeModal(); render(); } };
      if (ed) ed.onclick = () => {
        const inc = db.incidents.find((x) => x.id === id);
        openModal(`<h2>${t('edit')}</h2>${incidentForm(inc)}
          <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveInc">${t('save')}</button></div>`, (m) => {
          $('#saveInc', m).onclick = () => { const d = readIncidentForm(m); if (!d) return; Object.assign(inc, d); save(); closeModal(); render(); toast(t('saved')); };
        });
      };
    });
  }
  function renderIncidents(v) {
    const today = dateKey();
    const list = db.incidents
      .filter((i) => state.incFilter === 'all' || i.date === today)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    v.innerHTML = `
      <div class="card">
        <h2>➕ ${t('new_incident')}</h2>
        ${db.students.length ? incidentForm() + `<button class="btn block mt" id="addInc">${t('save')}</button>` : `<p class="empty">${t('no_student')}</p>`}
      </div>
      <div class="card">
        <h2>${t('recent_incidents')}</h2>
        <div class="chips">
          <button class="chip ${state.incFilter === 'today' ? 'on' : ''}" data-f="today">${t('filter_today')}</button>
          <button class="chip ${state.incFilter === 'all' ? 'on' : ''}" data-f="all">${t('filter_all')} (${db.incidents.length})</button>
        </div>
        ${list.length ? list.map(incidentItem).join('') : `<p class="empty">${t('no_incident')}</p>`}
      </div>`;
    const add = $('#addInc', v);
    if (add) add.onclick = () => {
      const d = readIncidentForm(v); if (!d) return;
      db.incidents.push(Object.assign({ id: uid() }, d)); save(); render(); toast(t('saved'));
    };
    $$('[data-f]', v).forEach((b) => (b.onclick = () => { state.incFilter = b.dataset.f; render(); }));
    bindIncidentItems(v);
  }

  /* ---------------- Vue : Élèves ---------------- */
  function renderEleves(v) {
    if (db.classes.length && !classById(state.elevesClass)) state.elevesClass = db.classes[0].id;
    const cid = state.elevesClass;
    const q = state.search.trim().toLowerCase();
    const list = q
      ? db.students.filter((s) => s.name.toLowerCase().includes(q)).sort(byName)
      : (cid ? studentsOf(cid) : []);
    v.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <h2 style="margin:0">${t('classes')}</h2>
          <div style="display:flex;gap:6px"><button class="btn gold small" id="divBtn">🏫 ${t('divisions_btn')}</button><button class="btn light small" id="addClass">${t('add_class')}</button></div>
        </div>
        <div class="chips wrap mt">${db.classes.map((c) => `<button class="chip ${c.id === cid && !q ? 'on' : ''}" data-c="${c.id}">${esc(c.name)} · ${studentsOf(c.id).length}</button>`).join('')}</div>
        ${cid && !q ? `<button class="btn light small" id="editClass">✏️ ${t('rename')} / ${t('delete')}</button>` : ''}
      </div>
      <div class="card">
        <input type="search" id="search" placeholder="${t('search')}" value="${esc(state.search)}">
        ${!q ? `<div class="btn-row mt">${cid ? `<button class="btn small" id="addStudent">${t('add_student')}</button>` : ''}<button class="btn gold small" id="bulkAdd">${t('import_list')}</button></div>` : ''}
        <ul class="list mt" id="stuList">${listHtml(list, !!q)}</ul>
      </div>`;

    $$('[data-c]', v).forEach((b) => (b.onclick = () => { state.elevesClass = b.dataset.c; state.search = ''; render(); }));
    const sEl = $('#search', v);
    sEl.oninput = (e) => {
      const wasEmpty = !state.search.trim();
      state.search = e.target.value;
      if (wasEmpty !== !state.search.trim()) { // changement de mode : re-rendu complet
        render();
        const n = $('#search'); n.focus(); n.setSelectionRange(n.value.length, n.value.length);
        return;
      }
      const qq = state.search.trim().toLowerCase();
      const l2 = qq ? db.students.filter((s) => s.name.toLowerCase().includes(qq)).sort(byName) : studentsOf(cid);
      $('#stuList', v).innerHTML = listHtml(l2, !!qq);
      bindList();
    };
    $('#addClass', v).onclick = () => classModal();
    $('#divBtn', v).onclick = () => divisionsModal();
    const ec = $('#editClass', v); if (ec) ec.onclick = () => classModal(classById(cid));
    const as = $('#addStudent', v); if (as) as.onclick = () => studentModal(null, cid);
    const ba = $('#bulkAdd', v); if (ba) ba.onclick = () => importModal(cid);
    function bindList() { $$('li[data-sid]', v).forEach((li) => (li.onclick = () => studentDetail(li.dataset.sid))); }
    bindList();
  }
  function listHtml(list, showClass) {
    if (!list.length) return `<p class="empty">${db.classes.length ? t('no_student') : t('no_class')}</p>`;
    return list.map((s) => {
      const cl = classById(s.classId);
      return `<li data-sid="${s.id}" style="cursor:pointer"><div class="grow"><b>${esc(s.name)}</b>
        <div class="sub">${showClass && cl ? esc(cl.name) + ' · ' : ''}${s.phone ? '📞 ' + esc(s.phone) : ''}</div></div><span class="muted">›</span></li>`;
    }).join('');
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

  function classModal(cls) {
    openModal(`<h2>${cls ? t('rename') : t('add_class')}</h2>
      <label>${t('class_name')}</label><input id="clsName" value="${esc(cls ? cls.name : '')}" placeholder="Ex : 3ème AF - B">
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveCls">${t('save')}</button></div>
      ${cls ? `<button class="btn danger block mt" id="delCls">🗑️ ${t('delete')}</button>` : ''}`, (m) => {
      $('#clsName', m).focus();
      $('#saveCls', m).onclick = () => {
        const name = $('#clsName', m).value.trim(); if (!name) return toast(t('name_required'));
        if (cls) cls.name = name; else { const c = { id: uid(), name }; db.classes.push(c); state.elevesClass = c.id; }
        sortClasses();
        save(); closeModal(); render();
      };
      const d = $('#delCls', m);
      if (d) d.onclick = () => {
        if (!confirm(t('delete_class_confirm'))) return;
        const ids = new Set(studentsOf(cls.id).map((s) => s.id));
        db.students = db.students.filter((s) => !ids.has(s.id));
        db.incidents = db.incidents.filter((i) => !ids.has(i.studentId));
        Object.values(db.attendance).forEach((a) => ids.forEach((id) => delete a[id]));
        db.classes = db.classes.filter((c) => c.id !== cls.id);
        save(); closeModal(); render();
      };
    });
  }

  function studentModal(st, cid) {
    openModal(`<h2>${st ? t('edit') : t('add_student')}</h2>
      <label>${t('student_name')} *</label><input id="stName" value="${esc(st ? st.name : '')}">
      <label>${t('parent_phone')}</label><input id="stPhone" type="tel" inputmode="tel" value="${esc(st ? st.phone : '')}" placeholder="22 12 34 56">
      <label>${t('class')}</label><select id="stClass">${db.classes.map((c) => `<option value="${c.id}" ${c.id === (st ? st.classId : cid) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveSt">${t('save')}</button></div>
      ${!st ? `<p class="legend center">↩︎ ${t('save')} → ${t('add_student')}</p>` : ''}`, (m) => {
      $('#stName', m).focus();
      const doSave = () => {
        const name = $('#stName', m).value.trim(); if (!name) return toast(t('name_required'));
        const data = { name, phone: $('#stPhone', m).value.trim(), classId: $('#stClass', m).value };
        if (st) { Object.assign(st, data); save(); closeModal(); render(); toast(t('saved')); }
        else {
          db.students.push(Object.assign({ id: uid() }, data)); save(); render(); toast(t('saved'));
          $('#stName', m).value = ''; $('#stPhone', m).value = ''; $('#stName', m).focus(); // saisie rapide en série
        }
      };
      $('#saveSt', m).onclick = doSave;
      $('#stName', m).addEventListener('keydown', (e) => { if (e.key === 'Enter') doSave(); });
    });
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
    if (/parent|tuteur|pere|mere|ولي/.test(n)) return null;
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
      rows[i].forEach((c, j) => { const r = headerRole(c); if (r && roles[r] === undefined) roles[r] = j; });
      if (roles.name !== undefined || roles.first !== undefined) { hIdx = i; cols = roles; }
    }
    const out = [];
    rows.slice(hIdx + 1).forEach((r) => {
      if (!r.some(Boolean)) return;
      let name = '', phone = '', cls = '';
      if (hIdx >= 0) {
        const nm = cols.name !== undefined ? r[cols.name] || '' : '';
        const fn = cols.first !== undefined ? r[cols.first] || '' : '';
        name = [fn, nm].filter(Boolean).join(' ');
        phone = cols.phone !== undefined ? r[cols.phone] || '' : '';
        cls = cols.class !== undefined ? r[cols.class] || '' : '';
        const dv = cols.div !== undefined ? r[cols.div] || '' : '';
        if (dv) cls = (cls ? cls + ' ' : '') + dv;
      } else {
        name = r.find((c) => c && /[A-Za-z\u00C0-\u024F\u0600-\u06FF]/.test(c) && !PHONE_RE.test(c)) || '';
        phone = r.find((c) => c && PHONE_RE.test(c)) || '';
      }
      name = name.replace(/^\d+\s*[-.)]\s*/, '').trim(); // retire « 1. » / « 2- »
      if (!name || !/[A-Za-z\u00C0-\u024F\u0600-\u06FF]/.test(name)) return;
      out.push({ name, phone: phone.trim(), className: cls || sheetClass || '' });
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
      plan.push({ name: e.name, phone: e.phone, classId: cid, label });
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
        const rows = [['Nom', 'Téléphone parent', 'Classe'], ['Mohamed Ould Ahmed', '22123456', '3e AF - A'], ['Fatimetou Mint Sidi', '', '3e AF - A'], ['Aminata Ba', '36123456', '3e AF - B'], ['Sidi Ould Cheikh', '', '3e AF - C']];
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
        ready.plan.forEach((p) => db.students.push({ id: uid(), name: p.name, phone: p.phone, classId: p.classId }));
        save(); closeModal();
        if (ready.plan.length) state.elevesClass = ready.plan[0].classId;
        state.search = ''; tab = 'eleves';
        $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'eleves'));
        render(); toast(`${ready.plan.length} ${t('added')}`);
      };
    });
  }

  function studentDetail(sid) {
    const st = studentById(sid); if (!st) return;
    const cl = classById(st.classId);
    let A = 0, R = 0; const absDates = [];
    Object.entries(db.attendance).forEach(([d, a]) => { if (a[sid] === 'A') { A++; absDates.push(d); } if (a[sid] === 'R') R++; });
    const inc = db.incidents.filter((i) => i.studentId === sid).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const phone = cleanPhone(st.phone);
    openModal(`<h2>${esc(st.name)}</h2>
      <p class="muted" style="margin-top:-6px">${cl ? esc(cl.name) : ''}${st.phone ? ' · 📞 ' + esc(st.phone) : ''}</p>
      <div class="stats" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat red"><b>${A}</b><span>${t('absences')}</span></div>
        <div class="stat orange"><b>${R}</b><span>${t('lates')}</span></div>
        <div class="stat gold"><b>${inc.length}</b><span>${t('incidents')}</span></div>
      </div>
      ${phone ? `<div class="btn-row"><a class="btn" href="tel:${phone}">📞 ${t('call')}</a><a class="btn gold" target="_blank" rel="noopener" href="https://wa.me/${waPhone(st.phone)}">💬 ${t('whatsapp')}</a></div>` : ''}
      ${absDates.length ? `<h3>${t('absences')}</h3><p style="margin:0">${absDates.sort().reverse().slice(0, 15).map((d) => `<span class="badge red" style="margin:2px">${esc(fmtDate(d, false))}</span>`).join('')}</p>` : ''}
      <h3>${t('history')}</h3>
      <div id="incList">${inc.length ? inc.map(incidentItem).join('') : `<p class="empty">${t('no_incident')}</p>`}</div>
      <button class="btn light block mt" id="newIncFor">➕ ${t('new_incident')}</button>
      <div class="btn-row mt"><button class="btn light" id="editSt">✏️ ${t('edit')}</button><button class="btn danger" id="delSt">🗑️ ${t('delete')}</button></div>
      <button class="btn light block mt" data-close>${t('close')}</button>`, (m) => {
      bindIncidentItems(m);
      $('#editSt', m).onclick = () => studentModal(st);
      $('#newIncFor', m).onclick = () => {
        openModal(`<h2>${t('new_incident')}</h2>${incidentForm(null, sid)}
          <div class="btn-row mt"><button class="btn light" data-close>${t('cancel')}</button><button class="btn" id="saveInc">${t('save')}</button></div>`, (mm) => {
          $('#saveInc', mm).onclick = () => { const d = readIncidentForm(mm); if (!d) return; db.incidents.push(Object.assign({ id: uid() }, d)); save(); closeModal(); render(); toast(t('saved')); };
        });
      };
      $('#delSt', m).onclick = () => {
        if (!confirm(t('delete_student_confirm'))) return;
        db.students = db.students.filter((s) => s.id !== sid);
        db.incidents = db.incidents.filter((i) => i.studentId !== sid);
        Object.values(db.attendance).forEach((a) => delete a[sid]);
        save(); closeModal(); render();
      };
    });
  }

  /* ---------------- Vue : Réglages ---------------- */
  function renderReglages(v) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    v.innerHTML = `
      <div class="card">
        <h2>🏫 ${t('school')}</h2>
        <label>${t('school_name')}</label><input id="schName" value="${esc(db.school.name)}" placeholder="Ex : École Ksar 2">
        <label>${t('supervisor')}</label><input id="supName" value="${esc(db.school.supervisor)}">
        <label>${t('language')}</label>
        <div class="chips"><button class="chip ${db.lang === 'fr' ? 'on' : ''}" data-l="fr">Français</button><button class="chip ${db.lang === 'ar' ? 'on' : ''}" data-l="ar">العربية</button></div>
        <button class="btn block mt" id="saveSch">${t('save')}</button>
        <button class="btn light block mt" id="divSettings">🏫 ${t('divisions_title')}</button>
      </div>
      <div class="card">
        <h2>💾 ${t('data')}</h2>
        <p class="legend" style="margin-top:0">🔒 ${t('privacy')}</p>
        <button class="btn light block mt" id="expCsv">📊 ${t('export_csv')}</button>
        <button class="btn light block mt" id="expInc">⚠️ ${t('export_inc')}</button>
        <button class="btn block mt" id="backup">⬇️ ${t('backup')}</button>
        <button class="btn light block mt" id="restoreBtn">⬆️ ${t('restore')}</button>
        <input type="file" id="restoreFile" accept=".json,application/json" hidden>
        <button class="btn danger block mt" id="resetAll">🗑️ ${t('reset_all')}</button>
      </div>
      <div class="card">
        <h2>📲 ${t('install_title')}</h2>
        <p style="margin:6px 0">${isIOS ? t('install_ios') : t('install_android')}</p>
        <p style="margin:6px 0" class="muted">${isIOS ? t('install_android') : t('install_ios')}</p>
      </div>
      <p class="center muted" style="font-size:13px">${t('version')} 1.3</p>`;

    $('#divSettings', v).onclick = () => divisionsModal();
    $('#saveSch', v).onclick = () => {
      db.school.name = $('#schName', v).value.trim();
      db.school.supervisor = $('#supName', v).value.trim();
      save(); render(); toast(t('saved'));
    };
    $$('[data-l]', v).forEach((b) => (b.onclick = () => { db.lang = b.dataset.l; save(); render(); }));

    $('#expCsv', v).onclick = () => {
      const rows = [[t('date'), t('class'), t('student'), 'Statut / الحالة']];
      const names = { P: 'Présent / حاضر', A: 'Absent / غائب', R: 'Retard / متأخر' };
      Object.keys(db.attendance).sort().forEach((d) => {
        Object.entries(db.attendance[d]).forEach(([sid, s]) => {
          const st = studentById(sid); if (!st) return;
          const cl = classById(st.classId);
          rows.push([d, cl ? cl.name : '', st.name, names[s] || s]);
        });
      });
      download(`presences_${dateKey()}.csv`, '\ufeff' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
    };
    $('#expInc', v).onclick = () => {
      const rows = [[t('date'), '⏱', t('class'), t('student'), t('type'), t('note'), t('action')]];
      db.incidents.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach((i) => {
        const st = studentById(i.studentId); const cl = st ? classById(st.classId) : null;
        rows.push([i.date, i.time, cl ? cl.name : '', st ? st.name : '', t('inc_' + i.type), i.note, t('act_' + i.action)]);
      });
      download(`incidents_${dateKey()}.csv`, '\ufeff' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
    };
    $('#backup', v).onclick = () => download(`sauvegarde_surveillant_${dateKey()}.json`, JSON.stringify(db, null, 1), 'application/json');
    $('#restoreBtn', v).onclick = () => $('#restoreFile', v).click();
    $('#restoreFile', v).onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d || !Array.isArray(d.classes) || !Array.isArray(d.students)) throw new Error('bad');
          d.attendance = d.attendance || {}; d.incidents = d.incidents || []; d.school = d.school || { name: '', supervisor: '' };
          d.lang = d.lang || 'fr';
          db = d; save(); render(); toast(t('restored'));
        } catch (err) { toast(t('bad_file')); }
      };
      r.readAsText(f);
    };
    $('#resetAll', v).onclick = () => {
      if (!confirm(t('reset_confirm'))) return;
      localStorage.removeItem(KEY); db = load(); save(); render();
    };
  }

  /* ---------------- Installation (PWA) ---------------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; $('#installBtn').hidden = false;
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; $('#installBtn').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  save();
  render();
})();

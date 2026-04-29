/* =========================================================
   Abschiedszeitung - Editor Logic (reiner Client)
   Alle Daten bleiben im Browser (localStorage).
   ========================================================= */

(function () {
  'use strict';

  // ---------- State / Storage ----------

  const STORAGE_KEY = 'abschiedszeitung:v1';

  // Sorgfältig kuratierte Farbschemata. Jede Variante ist druckfreundlich
  // (ausreichender Kontrast auf weißem/cremefarbenem Papier, keine Neons).
  const THEMES = [
    { id: 'default', name: 'Klassisch Blau',  desc: 'Zeitloses Schulblau',       accent: '#0055a4', paper: '#ffffff' },
    { id: 'forest',  name: 'Waldgrün',        desc: 'Ruhig, erdend',             accent: '#2f6a4f', paper: '#ffffff' },
    { id: 'ocean',   name: 'Ozean',           desc: 'Petrol, frisch',            accent: '#2a7a8a', paper: '#ffffff' },
    { id: 'plum',    name: 'Pflaume',         desc: 'Warm, elegant',             accent: '#6b4a7a', paper: '#ffffff' },
    { id: 'rose',    name: 'Rosenholz',       desc: 'Weich, freundlich',         accent: '#b85672', paper: '#ffffff' },
    { id: 'sunset',  name: 'Sonnenuntergang', desc: 'Energisch, herzlich',       accent: '#d0492e', paper: '#ffffff' },
    { id: 'warm',    name: 'Terrakotta',      desc: 'Ocker auf cremefarben',     accent: '#b2542b', paper: '#faf7f1' },
    { id: 'mono',    name: 'Monochrom',       desc: 'Reduzierter Graustil',      accent: '#1a1a1a', paper: '#ffffff' }
  ];
  const THEME_IDS = THEMES.map(t => t.id);

  /** @type {any} */
  let state = normalizeState(loadState()) || defaultState();

  function defaultState() {
    return {
      theme: 'default',
      fields: {
        // Seite 1 Cover
        kicker: 'Für unsere Klassenlehrkraft',
        year: new Date().getFullYear().toString(),
        titleLine1: 'Danke',
        titleLine2: 'für vier Jahre!',
        subtitle: 'Eine Abschiedszeitung von deiner Klasse.',
        schoolName: 'Grundschule',
        schoolYears: 'Schuljahre 2022 – 2026',

        // Seite 2 Grußwort — von den Kindern an die Lehrkraft
        introTitle: 'Liebe Klassenlehrkraft',
        introKicker: 'Ein paar Worte von uns Kindern, bevor wir gehen.',
        introLead: 'Vier Jahre lang hast du uns begleitet — vom ersten wackeligen Schultag bis zu diesem Sommer, an dem wir die Grundschule verlassen. Das ist eine lange Zeit. Eine richtig lange Zeit.',
        introText: 'Du hast uns lesen, schreiben und rechnen beigebracht. Du hast uns zugehört, wenn wir traurig waren. Du hast uns Mut gemacht, wenn wir uns etwas nicht zugetraut haben. Du warst streng, wenn es sein musste, und lustig, wenn wir es gebraucht haben.\n\nDiese Zeitung ist unser Dankeschön. Sie erzählt von unseren schönsten Momenten mit dir, von Ausflügen, Projekten, Pannen und Überraschungen. Jedes Foto, jeder Steckbrief, jede warme Dusche ist für dich — weil du es warst, die das alles möglich gemacht hat.',
        introSign: 'Deine Klasse',
        footerLeft2: 'Von uns für dich',

        // Seite 3 Chronik I
        chronicle1Title: 'Die ersten Jahre',
        chronicle1Kicker: 'Momente mit dir aus Klasse 1 und 2',
        footerLeft3: 'Chronik — Teil 1',

        // Seiten 4+5 Yearbook-Spread
        spreadTitle: 'Das sind wir',
        spreadKicker: 'Deine Klasse — jede:r mit einer Erinnerung an dich.',
        spreadFooterLeft: 'Deine Klasse — Yearbook',
        spreadTitleRight: '… und das bleibt von uns.',
        spreadKickerRight: 'Ein letzter Gruß von jeder und jedem Einzelnen.',
        spreadFooterRight: 'Grundschule — Jahrgang 2026',

        // Seite 6 Chronik II
        chronicle2Title: 'Und dann die Großen',
        chronicle2Kicker: 'Momente mit dir aus Klasse 3 und 4',
        footerLeft6: 'Chronik — Teil 2',

        // Seite 7 Warme Duschen für die Lehrkraft
        showersPageTitle: 'Warme Duschen für dich',
        showersPageKicker: 'Das, was wir an dir am meisten schätzen — in einem Satz.',
        footerLeft7: 'Mit Liebe von uns',

        // Seite 8 Rückseite — letzter Gruß von der Klasse
        page8Title: 'Wir werden dich vermissen',
        page8Kicker: 'Bleib so, wie du bist.',
        teacherTitle: 'Zum Abschied',
        teacherText: 'Liebe Klassenlehrkraft, mit diesen Seiten wollen wir dir sagen, wie viel uns die Zeit mit dir bedeutet hat. Du hast uns nicht nur Mathe und Deutsch beigebracht — du hast uns gezeigt, dass Fehler okay sind, dass man einander zuhört und dass Neugier das Beste ist, das man haben kann. Wir nehmen das mit auf unsere neue Schule. Und dich auch — irgendwie. Pass gut auf dich auf. Wir haben dich lieb.',
        teacherSign: 'In Dankbarkeit, deine Klasse',
        imprintRedaktion: 'Von den Kindern der Klasse; organisiert von den Eltern',
        imprintDate: 'Juli — einmalig',
        imprintNote: 'Nicht für den öffentlichen Vertrieb. Bilder mit Einwilligung der Erziehungsberechtigten.'
      },
      photos: {
        hero: null,   // Seite 1 Klassenfoto
        intro: null   // Seite 2 Grußwort-Foto
      },
      // Bild-Positions-Overrides: photoKey → { x: 0..100, y: 0..100 }
      // Werden beim Rendern auf img.style.objectPosition gesetzt.
      photoOffsets: {},
      students: seedStudents(),
      memories: seedMemories(),
      showers: seedShowers()
    };
  }

  function seedStudents() {
    const names = ['Mitschüler/in 1', 'Mitschüler/in 2', 'Mitschüler/in 3', 'Mitschüler/in 4'];
    return names.map((n) => ({
      id: uid(),
      name: n,
      fach: '',
      hobby: '',
      essen: '',
      buch: '',
      beruf: '',
      motto: '',
      memory: '',
      photo: null
    }));
  }

  function seedMemories() {
    // Momente, die die Klasse mit der Lehrkraft erlebt hat
    return [
      // Chronik I (Klasse 1+2)
      { id: uid(), title: 'Unser erster Schultag',   meta: '1. Klasse',            text: 'Du hast uns empfangen — leuchtende Schultüten, wackelige Knie und ein neues Kapitel begann.',           photo: null },
      { id: uid(), title: 'Das erste Laternenfest',  meta: '1. Klasse · Herbst',   text: 'Bei Regen durch den Schulhof, Laternen hoch und laut gesungen. Du bist mit jeder Pfütze mitgesprungen.', photo: null },
      { id: uid(), title: 'Waldtage',                meta: '2. Klasse · Herbst',   text: 'Wir sind im Wald gewesen, Blätter gesammelt, am Feuer gesungen — und du hast uns beigebracht, wie man Rinden bestimmt.', photo: null },
      // Chronik II (Klasse 3+4)
      { id: uid(), title: 'Klassenfahrt',            meta: '3. Klasse · Frühling', text: 'Drei Tage, drei Nächte — mit dir als Begleitung. Die Geschichten am Abend werden wir nicht vergessen.', photo: null },
      { id: uid(), title: 'Sportfest',               meta: '3. Klasse',            text: 'Wettrennen, Staffeln, Zielwurf — und du warst an der Ziellinie, hast jeden einzeln bejubelt.',             photo: null },
      { id: uid(), title: 'Projektwoche',            meta: '4. Klasse',            text: 'Forschen, basteln, präsentieren. Wir durften alles ausprobieren — und du hast uns vertraut.',              photo: null }
    ];
  }

  function seedShowers() {
    // Warme Duschen von den Kindern für die Lehrkraft
    return [
      { id: uid(), text: '„Du hörst immer zu, egal wie chaotisch es gerade war.“',  from: '— deine Klasse' },
      { id: uid(), text: '„Du hast uns nie aufgegeben, auch wenn wir schwierig waren.“', from: '— deine Klasse' },
      { id: uid(), text: '„Bei dir durften Fehler sein. Das war das Schönste.“',    from: '— deine Klasse' },
      { id: uid(), text: '„Du erklärst so lange, bis es wirklich jede:r verstanden hat.“', from: '— deine Klasse' },
      { id: uid(), text: '„Streng, aber immer fair — und mit trockenem Humor.“',   from: '— deine Klasse' },
      { id: uid(), text: '„Du hast jedes Kind gesehen. Auch die leisen.“',          from: '— deine Klasse' }
    ];
  }

  function uid() {
    return 'id-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('State konnte nicht geladen werden', e);
      return null;
    }
  }

  /**
   * Sanftes Upgrade alter localStorage-States auf das aktuelle Schema.
   * Migration: frühere page2/page3-Felder → neue spread-Felder.
   * Außerdem: fehlende Listen / Objekte auffüllen.
   */
  function normalizeState(loaded) {
    if (!loaded || typeof loaded !== 'object') return null;
    const d = defaultState();

    // Defensive Listen / Objekte
    if (!Array.isArray(loaded.students)) loaded.students = d.students;
    // Jeder Steckbrief braucht eine ID + alle erwarteten Text-Felder.
    loaded.students.forEach(s => {
      if (!s || typeof s !== 'object') return;
      if (!s.id || typeof s.id !== 'string') s.id = uid();
      if (typeof s.name  !== 'string') s.name  = 'Mitschüler:in';
      if (typeof s.fach  !== 'string') s.fach  = '';
      if (typeof s.hobby !== 'string') s.hobby = '';
      if (typeof s.essen !== 'string') s.essen = '';
      if (typeof s.buch  !== 'string') s.buch  = '';
      if (typeof s.beruf !== 'string') s.beruf = '';
      if (typeof s.motto !== 'string') s.motto = '';
      if (typeof s.memory !== 'string') s.memory = '';
      if (s.photo !== null && typeof s.photo !== 'string') s.photo = null;
    });
    if (!Array.isArray(loaded.memories)) loaded.memories = d.memories;
    loaded.memories.forEach(m => {
      if (!m || typeof m !== 'object') return;
      if (!m.id || typeof m.id !== 'string') m.id = uid();
      if (typeof m.title !== 'string') m.title = '';
      if (typeof m.meta  !== 'string') m.meta  = '';
      if (typeof m.text  !== 'string') m.text  = '';
      if (m.photo !== null && typeof m.photo !== 'string') m.photo = null;
    });
    if (!Array.isArray(loaded.showers))  loaded.showers  = d.showers;
    loaded.showers.forEach(sw => {
      if (!sw || typeof sw !== 'object') return;
      if (!sw.id || typeof sw.id !== 'string') sw.id = uid();
      if (typeof sw.text !== 'string') sw.text = '';
      if (typeof sw.from !== 'string') sw.from = '';
    });
    if (!loaded.photos || typeof loaded.photos !== 'object') loaded.photos = { hero: null, intro: null };
    if (loaded.photos.intro === undefined) loaded.photos.intro = null;
    if (!loaded.photoOffsets || typeof loaded.photoOffsets !== 'object') loaded.photoOffsets = {};
    if (!loaded.fields || typeof loaded.fields !== 'object') loaded.fields = {};

    const f = loaded.fields;

    // Migration: alte Feldnamen → neue
    if (f.page2Title && !f.spreadTitle)    f.spreadTitle    = f.page2Title;
    if (f.page2Kicker && !f.spreadKicker)  f.spreadKicker   = f.page2Kicker;
    if (f.page2Footer && !f.spreadFooterLeft) f.spreadFooterLeft = f.page2Footer;
    if (f.page3Title && !f.memoriesTitle)  f.memoriesTitle  = f.page3Title;

    // Fehlende Default-Felder ergänzen (damit Platzhalter nicht leer bleiben)
    Object.entries(d.fields).forEach(([k, v]) => {
      if (f[k] === undefined || f[k] === null) f[k] = v;
    });

    // Theme-ID auf gültigen Wert beschränken
    if (!THEME_IDS.includes(loaded.theme)) loaded.theme = 'default';

    return loaded;
  }

  let saveTimer = null;
  let quotaWarned = false;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        quotaWarned = false;
      } catch (e) {
        // Speicher voll: einmal warnen, nicht spammen. Daten bleiben im
        // Memory bestehen — User soll als JSON exportieren.
        if (!quotaWarned) {
          quotaWarned = true;
          if (typeof toast === 'function') {
            toast('Speicher voll! Bitte als JSON exportieren.', 6000);
          } else {
            console.error('localStorage voll', e);
          }
        }
      }
    }, 250);
  }

  // ---------- Render ----------

  function render() {
    // Theme
    document.documentElement.setAttribute('data-theme', state.theme || 'default');

    // Fields
    Object.entries(state.fields).forEach(([key, val]) => {
      document.querySelectorAll(`[data-field="${key}"]`).forEach(el => {
        if (document.activeElement === el) return; // nicht beim Tippen ueberschreiben
        el.textContent = val;
      });
    });

    // Fotos auf Titel- und Grußwort-Seite
    applyPhoto(document.querySelector('.photo[data-photo="hero"]'),  state.photos.hero);
    applyPhoto(document.querySelector('.photo[data-photo="intro"]'), state.photos.intro);

    // Students auf zwei Seiten splitten (Yearbook-Spread)
    renderStudentSpread();

    // Erinnerungen auf Chronik I (Seite 3) + Chronik II (Seite 6) splitten
    renderMemories();

    // Showers
    const showerContainer = document.getElementById('shower-grid');
    if (state.showers.length === 0) {
      showerContainer.innerHTML = '<div class="empty-state">Noch keine Zitate. <strong>+ Zitat</strong> in der Sidebar.</div>';
    } else {
      renderList('shower-grid', 'tpl-shower', state.showers, (root, item) => {
        root.dataset.showerId = item.id;
        setField(root, 'text', item.text);
        setField(root, 'from', item.from);
      });
    }

    // Zähler in Sidebar
    updateCounters();

    // Print-Mirror aktualisieren
    mirrorPrintLayout();
  }

  // ---------- Yearbook-Spread Rendering ----------

  /**
   * Berechnet die optimale Grid-Aufteilung für den Spread.
   * Ziel: keine halb-leeren Seiten, ausgewogene Spalten x Reihen,
   * bis 30 Kinder insgesamt.
   */
  function computeSpreadLayout(totalCount) {
    // Minimum: immer mindestens 2 Karten pro Seite zeigen, auch wenn leer
    const visualCount = Math.max(totalCount, 2);

    // Aufteilung: linke Seite = ceil(n/2), rechte = floor(n/2)
    const leftCount  = Math.ceil(visualCount / 2);
    const rightCount = Math.floor(visualCount / 2);

    // Tier (beide Seiten nutzen dasselbe Tier, damit die Optik gleich ist)
    // Richtgröße: größere Hälfte bestimmt das Tier.
    const perPage = leftCount;

    let tier, cols, rows;
    if (perPage <= 2)      { tier = 'tier-xl';  cols = 1; rows = 2; }
    else if (perPage <= 4) { tier = 'tier-l';   cols = 2; rows = 2; }
    else if (perPage <= 6) { tier = 'tier-m';   cols = 2; rows = 3; }
    else if (perPage <= 9) { tier = 'tier-s';   cols = 3; rows = 3; }
    else if (perPage <= 12){ tier = 'tier-xs';  cols = 3; rows = 4; }
    else                   { tier = 'tier-xxs'; cols = 3; rows = 5; }

    return { tier, cols, rows, leftCount, rightCount };
  }

  function renderStudentSpread() {
    const leftEl  = document.getElementById('student-grid-left');
    const rightEl = document.getElementById('student-grid-right');
    if (!leftEl || !rightEl) return;

    // Im 8-Seiten-Booklet leben die Steckbriefe auf Seite 4 + 5.
    const spreadLeftPage  = document.getElementById('page-4');
    const spreadRightPage = document.getElementById('page-5');
    const TIER_CLASSES = ['tier-xl', 'tier-l', 'tier-m', 'tier-s', 'tier-xs', 'tier-xxs'];

    const total = state.students.length;

    // Empty-State
    if (total === 0) {
      const msg = '<div class="empty-state">Noch keine Steckbriefe. Links in der Sidebar auf <strong>+ Steckbrief</strong> klicken.</div>';
      leftEl.innerHTML  = msg;
      rightEl.innerHTML = '';
      leftEl.style.removeProperty('--cols');
      leftEl.style.removeProperty('--rows');
      rightEl.style.removeProperty('--cols');
      rightEl.style.removeProperty('--rows');
      TIER_CLASSES.forEach(c => {
        spreadLeftPage && spreadLeftPage.classList.remove(c);
        spreadRightPage && spreadRightPage.classList.remove(c);
      });
      return;
    }

    const layout = computeSpreadLayout(total);

    // Tier-Klasse an die Spread-Seiten (page-4 + page-5), damit Selektoren
    // wie .tier-xl .student-card greifen.
    TIER_CLASSES.forEach(c => {
      spreadLeftPage && spreadLeftPage.classList.remove(c);
      spreadRightPage && spreadRightPage.classList.remove(c);
    });
    spreadLeftPage  && spreadLeftPage.classList.add(layout.tier);
    spreadRightPage && spreadRightPage.classList.add(layout.tier);

    // Grid-Dimensionen via CSS-Variablen
    [leftEl, rightEl].forEach(el => {
      el.style.setProperty('--cols', layout.cols);
      el.style.setProperty('--rows', layout.rows);
    });

    // Liste splitten
    const half = Math.ceil(total / 2);
    const leftList  = state.students.slice(0, half);
    const rightList = state.students.slice(half);

    fillStudentGrid(leftEl,  leftList);
    fillStudentGrid(rightEl, rightList);
  }

  function renderMemories() {
    const bento1 = document.getElementById('memory-bento-1');
    const bento2 = document.getElementById('memory-bento-2');
    if (!bento1 || !bento2) return;

    const memTpl = document.getElementById('tpl-memory');
    const list = state.memories;

    if (list.length === 0) {
      const empty = '<div class="empty-state">Noch keine Erinnerungen. In der Sidebar <strong>+ Erinnerung</strong> klicken.</div>';
      bento1.innerHTML = empty;
      bento2.innerHTML = '';
      return;
    }

    // Auf die zwei Chronik-Seiten splitten (jede Seite bekommt ca. die Hälfte,
    // bei ungerader Anzahl mehr auf die erste Seite).
    const half = Math.ceil(list.length / 2);
    const first  = list.slice(0, half);
    const second = list.slice(half);

    fillMemoryBento(bento1, first, memTpl);
    if (second.length === 0) {
      bento2.innerHTML = '<div class="empty-state">Platz für weitere Erinnerungen aus Klasse 3 und 4.</div>';
    } else {
      fillMemoryBento(bento2, second, memTpl);
    }
  }

  function fillMemoryBento(container, list, tpl) {
    container.innerHTML = '';
    list.forEach(item => {
      const clone = tpl.content.firstElementChild.cloneNode(true);
      clone.dataset.memoryId = item.id;
      setField(clone, 'title', item.title);
      setField(clone, 'meta', item.meta);
      setField(clone, 'text', item.text);
      const photoEl = clone.querySelector('.photo');
      photoEl.dataset.photo = 'memory:' + item.id;
      applyPhoto(photoEl, item.photo);
      container.appendChild(clone);
    });
  }

  function fillStudentGrid(container, list) {
    const tpl = document.getElementById('tpl-student');
    container.innerHTML = '';
    list.forEach(item => {
      const clone = tpl.content.firstElementChild.cloneNode(true);
      clone.dataset.studentId = item.id;
      setField(clone, 'name',   item.name);
      setField(clone, 'fach',   item.fach);
      setField(clone, 'hobby',  item.hobby);
      setField(clone, 'essen',  item.essen);
      setField(clone, 'buch',   item.buch);
      setField(clone, 'beruf',  item.beruf);
      setField(clone, 'motto',  item.motto);
      setField(clone, 'memory', item.memory);
      const photoEl = clone.querySelector('.photo');
      photoEl.dataset.photo = 'student:' + item.id;
      applyPhoto(photoEl, item.photo);
      container.appendChild(clone);
    });
  }

  function updateCounters() {
    const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
    set('count-students', state.students.length);
    set('count-memories', state.memories.length);
    set('count-showers',  state.showers.length);
  }

  function setField(root, name, value) {
    const el = root.querySelector(`[data-field="${name}"]`);
    if (!el) return;
    if (document.activeElement === el) return;
    el.textContent = value || '';
  }

  function renderList(containerId, tplId, list, configure) {
    const container = document.getElementById(containerId);
    const tpl = document.getElementById(tplId);
    container.innerHTML = '';
    list.forEach(item => {
      const clone = tpl.content.firstElementChild.cloneNode(true);
      configure(clone, item);
      container.appendChild(clone);
    });
  }

  function applyPhoto(photoEl, dataUrl) {
    if (!photoEl) return;
    // Vorhandenes img entfernen
    const existing = photoEl.querySelector('img');
    if (existing) existing.remove();
    if (dataUrl) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = dataUrl;
      img.draggable = false; // Browser-Drag-Ghost unterdrücken
      applyPhotoOffset(img, photoEl.dataset.photo);
      photoEl.insertBefore(img, photoEl.firstChild);
      photoEl.classList.add('has-image');
    } else {
      photoEl.classList.remove('has-image');
    }
  }

  function applyPhotoOffset(img, photoKey) {
    if (!img || !photoKey) return;
    const off = state.photoOffsets && state.photoOffsets[photoKey];
    if (off && typeof off.x === 'number' && typeof off.y === 'number') {
      img.style.objectPosition = off.x + '% ' + off.y + '%';
    } else {
      img.style.objectPosition = '50% 50%';
    }
  }

  // ---------- Druck-Layout spiegeln ----------

  function mirrorPrintLayout() {
    document.querySelectorAll('.sheet-slot[data-mirrors]').forEach(slot => {
      const srcId = slot.dataset.mirrors;
      const src = document.getElementById(srcId);
      if (!src) return;
      slot.innerHTML = '';
      const clone = src.cloneNode(true);
      clone.removeAttribute('id');
      // ALLE inneren IDs entfernen — sonst entstehen Duplikate (page-4 enthält
      // z.B. #student-grid-left, das nach dem Klon im DOM zweimal existieren
      // würde). Verstößt gegen HTML-Spec und kann getElementById verwirren.
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      // Content nicht erneut editierbar machen
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      clone.querySelectorAll('button, input[type="file"]').forEach(el => el.remove());
      slot.appendChild(clone);
    });
  }

  // ---------- Event-Handling (Delegation) ----------

  const workspace = document.getElementById('workspace');

  // Felder, in denen Mehrzeilen-Text erlaubt ist (Browser fügt bei Enter
  // <div>/<br> ein). Sonst würde textContent die Newlines verschlucken.
  const MULTILINE_FIELDS = new Set([
    'introLead', 'introText', 'teacherText',
    'memory', 'text'
  ]);

  /**
   * Liest editierbaren Inhalt mehrzeilen-sicher aus.
   * textContent ignoriert <div>/<br>-Brüche; wir laufen den Baum ab und
   * wandeln Block-Elemente in \n um. Nicht-mehrzeilige Felder nutzen
   * weiter textContent, um z.B. Caret-Verschiebungen zu vermeiden.
   */
  function readEditableText(el, allowNewlines) {
    if (!allowNewlines) return el.textContent;
    let out = '';
    const walk = (node) => {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          out += child.nodeValue;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName;
          if (tag === 'BR') {
            out += '\n';
          } else {
            const isBlock = /^(DIV|P|LI|H[1-6]|BLOCKQUOTE|PRE|SECTION|ARTICLE)$/.test(tag);
            if (isBlock && out.length > 0 && !out.endsWith('\n')) out += '\n';
            walk(child);
            if (isBlock && !out.endsWith('\n')) out += '\n';
          }
        }
      });
    };
    walk(el);
    return out.replace(/\n+$/, ''); // trailing newlines beim Editieren stören
  }

  // Inline-Editing - contenteditable
  workspace.addEventListener('input', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.isContentEditable === false) return;

    // Wenn der User alles gelöscht hat, lassen Browser oft ein <br>
    // oder leere <div>s zurück. Dadurch trifft :empty nicht mehr zu und
    // unser CSS-Placeholder verschwindet, obwohl das Feld leer wirkt.
    // Sauberer State + sauberes Placeholder-Verhalten:
    if (el.textContent.trim() === '' && el.firstChild) {
      el.innerHTML = '';
    }

    // globales Feld?
    const field = el.getAttribute('data-field');
    if (!field) return;

    const allowNewlines = MULTILINE_FIELDS.has(field);
    const value = readEditableText(el, allowNewlines);

    const studentCard = el.closest('[data-student-id]');
    const memoryCard = el.closest('[data-memory-id]');
    const showerCard = el.closest('[data-shower-id]');

    if (studentCard) {
      const item = state.students.find(s => s.id === studentCard.dataset.studentId);
      if (item) item[field] = value;
    } else if (memoryCard) {
      const item = state.memories.find(s => s.id === memoryCard.dataset.memoryId);
      if (item) item[field] = value;
    } else if (showerCard) {
      const item = state.showers.find(s => s.id === showerCard.dataset.showerId);
      if (item) item[field] = value;
    } else {
      state.fields[field] = value;
    }
    saveState();
    // Druck-Layout-Spiegelung mit leichter Verzoegerung
    schedulePrintMirror();
  });

  // Klick auf ein Q/A-Icon fokussiert die zugehörige Antwort —
  // bequemer als das schmale dotted-Underline-Feld zu treffen.
  workspace.addEventListener('click', (e) => {
    const iconLabel = e.target.closest('.qa-q');
    if (!iconLabel) return;
    const qa = iconLabel.parentElement;
    const answer = qa && qa.querySelector('.qa-a');
    if (answer && answer.isContentEditable !== false) {
      answer.focus();
    }
  });

  // Foto-Klick -> Dateiauswahl (außer auf einem Kontroll-Button)
  workspace.addEventListener('click', (e) => {
    const photo = e.target.closest('.photo');
    if (!photo) return;
    if (e.target.closest('.photo-remove, .photo-pan')) return;
    // Nach dem Repositionieren schluckt die Drag-Logik den Folge-Click.
    if (photo.dataset.suppressClick === '1') {
      delete photo.dataset.suppressClick;
      return;
    }
    const input = photo.querySelector('input[type="file"]');
    if (input) input.click();
  });

  // Foto-Remove
  workspace.addEventListener('click', (e) => {
    const btn = e.target.closest('.photo-remove');
    if (!btn) return;
    e.stopPropagation();
    const photo = btn.closest('.photo');
    setPhoto(photo.dataset.photo, null);
    // Offset beim Entfernen mitlöschen
    if (state.photoOffsets && photo.dataset.photo in state.photoOffsets) {
      delete state.photoOffsets[photo.dataset.photo];
    }
    render();
  });

  // ---------- Bild-Ausschnitt verschieben (Pan) ----------
  //
  // Pan-Button gedrückt halten -> Drag verschiebt object-position.
  // Loslassen speichert; keine Seiten-Scroll-Konflikte (pointer events).

  workspace.addEventListener('pointerdown', (e) => {
    const pan = e.target.closest('.photo-pan');
    if (!pan) return;
    const photo = pan.closest('.photo');
    if (!photo || !photo.classList.contains('has-image')) return;
    e.preventDefault();
    e.stopPropagation();
    startReposition(photo, e);
  });

  function startReposition(photo, startEvent) {
    const img = photo.querySelector('img');
    if (!img) return;
    const key = photo.dataset.photo;
    const rect = photo.getBoundingClientRect();
    const current = (state.photoOffsets && state.photoOffsets[key]) || { x: 50, y: 50 };
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    const startPos = { x: current.x, y: current.y };
    let moved = false;

    photo.classList.add('repositioning');
    // pointer capture sorgt dafür, dass alle Folge-Events ans Pan-Button gehen
    const btn = startEvent.target;
    if (btn.setPointerCapture && startEvent.pointerId !== undefined) {
      try { btn.setPointerCapture(startEvent.pointerId); } catch (_) {}
    }

    function onMove(ev) {
      moved = true;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // Motiv folgt dem Finger (wie Google Maps / Pan-Tool):
      // Wenn der User das Bild nach rechts zieht, zeigen wir mehr vom
      // linken Teil des Originals -> object-position x sinkt.
      const xPct = clamp(startPos.x - (dx / Math.max(1, rect.width))  * 100, 0, 100);
      const yPct = clamp(startPos.y - (dy / Math.max(1, rect.height)) * 100, 0, 100);
      img.style.objectPosition = xPct + '% ' + yPct + '%';
      photo._tempOffset = { x: xPct, y: yPct };
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      photo.classList.remove('repositioning');
      if (moved && photo._tempOffset) {
        if (!state.photoOffsets) state.photoOffsets = {};
        state.photoOffsets[key] = photo._tempOffset;
        delete photo._tempOffset;
        saveState();
        // Druck-Layout-Spiegel aktualisieren (neue inline styles)
        schedulePrintMirror();
        // Folge-Click auf das Foto unterdrücken, damit nicht der Datei-
        // Picker aufploppt
        photo.dataset.suppressClick = '1';
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }

  function clamp(n, lo, hi) { return n < lo ? lo : (n > hi ? hi : n); }

  // Datei-Input change
  workspace.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
    const file = input.files && input.files[0];
    if (!file) return;
    const photo = input.closest('.photo');
    if (!file.type.startsWith('image/')) {
      toast('Nur Bild-Dateien (JPG, PNG, WebP).');
      input.value = '';
      return;
    }
    readFileAsResizedDataURL(file, 1600, 0.85).then(dataUrl => {
      setPhoto(photo.dataset.photo, dataUrl);
      render();
    }).catch(err => {
      toast('Bild konnte nicht geladen werden.');
      console.warn('Upload-Fehler:', err);
    });
    input.value = '';
  });

  // Globaler Schutz: Datei-Drops AUSSERHALB von .photo dürfen den
  // Browser nicht dazu bringen, das Bild im Tab zu öffnen (was die App
  // killen würde). Wir verhindern den Default und werfen einen Toast.
  window.addEventListener('dragover', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.indexOf('Files') !== -1) {
      e.preventDefault();
    }
  });
  window.addEventListener('drop', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    if (!e.target.closest('.photo')) {
      e.preventDefault();
      toast('Bitte direkt auf einen Foto-Platzhalter ziehen.');
    }
  });

  // Drag & Drop auf Fotos
  workspace.addEventListener('dragover', (e) => {
    const photo = e.target.closest('.photo');
    if (!photo) return;
    e.preventDefault();
    photo.classList.add('drop-hover');
  });
  workspace.addEventListener('dragleave', (e) => {
    const photo = e.target.closest('.photo');
    if (photo) photo.classList.remove('drop-hover');
  });
  workspace.addEventListener('drop', (e) => {
    const photo = e.target.closest('.photo');
    if (!photo) return;
    e.preventDefault();
    photo.classList.remove('drop-hover');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Nur Bild-Dateien (JPG, PNG, WebP).');
      return;
    }
    readFileAsResizedDataURL(file, 1600, 0.85).then(dataUrl => {
      setPhoto(photo.dataset.photo, dataUrl);
      render();
    }).catch(err => {
      toast('Bild konnte nicht geladen werden.');
      console.warn('Drop-Fehler:', err);
    });
  });

  // Remove-Item (Karte entfernen)
  workspace.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-item');
    if (!btn) return;
    const card = btn.closest('[data-student-id], [data-memory-id], [data-shower-id]');
    if (!card) return;
    if (!confirm('Wirklich entfernen?')) return;
    if (card.dataset.studentId) {
      const id = card.dataset.studentId;
      state.students = state.students.filter(s => s.id !== id);
      // Photo-Offset-Leak vermeiden
      if (state.photoOffsets) delete state.photoOffsets['student:' + id];
    } else if (card.dataset.memoryId) {
      const id = card.dataset.memoryId;
      state.memories = state.memories.filter(s => s.id !== id);
      if (state.photoOffsets) delete state.photoOffsets['memory:' + id];
    } else if (card.dataset.showerId) {
      state.showers = state.showers.filter(s => s.id !== card.dataset.showerId);
    }
    saveState();
    render();
  });

  function setPhoto(photoKey, dataUrl) {
    if (!photoKey) return;
    if (photoKey === 'hero') {
      state.photos.hero = dataUrl;
    } else if (photoKey === 'intro') {
      state.photos.intro = dataUrl;
    } else if (photoKey.startsWith('student:')) {
      const id = photoKey.slice('student:'.length);
      const item = state.students.find(s => s.id === id);
      if (item) item.photo = dataUrl;
    } else if (photoKey.startsWith('memory:')) {
      const id = photoKey.slice('memory:'.length);
      const item = state.memories.find(s => s.id === id);
      if (item) item.photo = dataUrl;
    }
    // Bei NEUEM Foto: alten Pan-Offset zurücksetzen, damit nicht ein
    // vorher gewählter Ausschnitt das neue Motiv beschneidet.
    // Beim Entfernen (dataUrl=null) ist Aufräumen sowieso sinnvoll.
    if (state.photoOffsets && photoKey in state.photoOffsets) {
      delete state.photoOffsets[photoKey];
    }
    saveState();
  }

  // Bilder beim Laden resizen (fuer localStorage-Groesse)
  function readFileAsResizedDataURL(file, maxEdge, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxEdge / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- UI: Toast, Modals, Menü, Sidebar ----------

  function toast(msg, ms) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, ms || 2200);
  }

  function on(id, evt, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, handler);
  }

  // ---------- View-Umschalter ----------

  // View-Switch wird sowohl von der Toolbar-Mitte (.view-toggle) als auch
  // vom Mobile-Overflow-Menü (.menu-view-item) ausgelöst. Wir greifen alle
  // Buttons mit data-view ab und syncen ihren active-State.
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view;
      document.querySelectorAll('[data-view]').forEach(b => {
        const isActive = b.dataset.view === target;
        b.classList.toggle('active', isActive);
        if (b.classList.contains('view-toggle')) {
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }
      });
      workspace.dataset.view = target;
      if (target === 'print-layout') mirrorPrintLayout();
    });
  });

  // ---------- Drucken ----------

  on('btn-print', 'click', () => {
    // Aktiven Editor-Fokus lösen, damit contenteditable-Inhalt ins DOM
    // committed ist, bevor wir klonen.
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    // Pending debounced saves sofort ausführen, damit nichts verloren geht
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    }
    // Druck-Mirror frisch aus dem DOM (der sich gerade im Edit-Modus befindet)
    mirrorPrintLayout();
    // Dem Browser kurz Zeit fürs Layout geben, dann drucken
    setTimeout(() => window.print(), 100);
  });

  // Auch der globale beforeprint-Event aktualisiert den Spiegel,
  // falls der User aus dem Browser-Menü druckt.
  window.addEventListener('beforeprint', () => {
    mirrorPrintLayout();
  });

  // ---------- Overflow-Menü (Kebab) ----------

  const moreBtn = document.getElementById('btn-more');
  const moreMenu = document.getElementById('more-menu');
  function setMenuOpen(open) {
    if (!moreMenu || !moreBtn) return;
    moreMenu.hidden = !open;
    moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMenuOpen(moreMenu.hidden);
    });
    document.addEventListener('click', (e) => {
      if (!moreMenu.hidden && !moreMenu.contains(e.target) && e.target !== moreBtn) {
        setMenuOpen(false);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    });
    // Klick auf Menü-Eintrag schließt das Menü
    moreMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') setMenuOpen(false);
    });
  }

  // ---------- Theme-Modal ----------

  const themeModal = document.getElementById('theme-modal');
  const themeGrid = document.getElementById('theme-grid');
  let pendingTheme = null;

  function buildThemeGrid() {
    if (!themeGrid) return;
    themeGrid.innerHTML = '';
    THEMES.forEach(t => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'theme-card' + (t.id === (pendingTheme || state.theme) ? ' selected' : '');
      card.dataset.theme = t.id;
      card.style.setProperty('--tc-accent', t.accent);
      card.style.setProperty('--tc-paper', t.paper);
      card.innerHTML =
        '<div class="theme-card-preview" aria-hidden="true"></div>' +
        '<div class="theme-card-name"></div>' +
        '<div class="theme-card-desc"></div>';
      card.querySelector('.theme-card-name').textContent = t.name;
      card.querySelector('.theme-card-desc').textContent = t.desc;
      card.addEventListener('click', () => {
        pendingTheme = t.id;
        // Live-Vorschau
        document.documentElement.setAttribute('data-theme', t.id);
        themeGrid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
      themeGrid.appendChild(card);
    });
  }

  on('btn-theme', 'click', () => {
    if (!themeModal) return;
    pendingTheme = state.theme;
    buildThemeGrid();
    if (typeof themeModal.showModal === 'function') {
      themeModal.showModal();
    } else {
      themeModal.setAttribute('open', '');
    }
  });

  if (themeModal) {
    themeModal.addEventListener('close', () => {
      if (themeModal.returnValue === 'apply' && pendingTheme) {
        state.theme = pendingTheme;
        saveState();
        toast('Farbschema übernommen');
      } else {
        // Zurück auf gespeichertes Theme
        document.documentElement.setAttribute('data-theme', state.theme || 'default');
      }
      pendingTheme = null;
      render();
    });
  }

  // ---------- Hilfe-Dialog ----------

  const helpModal = document.getElementById('help-modal');
  on('btn-help', 'click', () => {
    if (helpModal && typeof helpModal.showModal === 'function') helpModal.showModal();
  });

  // ---------- Export / Import / Reset ----------

  on('btn-export', 'click', () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'abschiedszeitung-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Projekt als JSON gespeichert');
    } catch (e) {
      alert('Export fehlgeschlagen: ' + e.message);
    }
  });

  on('btn-import', 'click', () => {
    const input = document.getElementById('file-import');
    if (input) input.click();
  });
  on('file-import', 'change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => alert('Datei konnte nicht gelesen werden.');
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('Ungültiges Format');
        if (!Array.isArray(parsed.students)) throw new Error('Liste der Mitschüler fehlt');
        // Durch dieselbe Migration laufen lassen wie beim normalen Laden,
        // damit alte Exporte (vor 8-Seiten-Umbau, vor photoOffsets etc.)
        // automatisch aufs aktuelle Schema gehoben werden.
        const normalized = normalizeState(parsed);
        if (!normalized) throw new Error('Zustand konnte nicht migriert werden');
        state = normalized;
        saveState();
        render();
        toast('Projekt geladen');
      } catch (err) {
        alert('Diese Datei konnte nicht geladen werden:\n' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  on('btn-reset', 'click', () => {
    if (!confirm('Wirklich alle Inhalte und Bilder löschen und mit Beispiel-Zeitung neu starten?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    saveState();
    render();
    toast('Zurückgesetzt');
  });

  // ---------- Hinzufügen ----------

  /**
   * Fügt ein Item hinzu und setzt nach dem Re-Render Cursor + Scroll
   * auf das entsprechende Feld, damit der User sofort tippen kann.
   */
  function addAndFocus(item, listKey, focusField, insertAt) {
    const list = state[listKey];
    const pos = typeof insertAt === 'number' ? insertAt : list.length;
    list.splice(pos, 0, item);
    saveState();
    render();

    // Neues Element suchen und fokussieren
    const dataKey =
      listKey === 'students' ? 'studentId' :
      listKey === 'memories' ? 'memoryId'  :
      listKey === 'showers'  ? 'showerId'  : null;
    if (!dataKey) return;
    // requestAnimationFrame um sicher nach dem Paint zu sein
    requestAnimationFrame(() => {
      const card = document.querySelector('[data-' + dataKey.replace(/([A-Z])/g, '-$1').toLowerCase() + '="' + item.id + '"]');
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusEl = card.querySelector('[data-field="' + focusField + '"]');
      if (focusEl && focusEl.isContentEditable !== false) {
        setTimeout(() => {
          focusEl.focus();
          // Gesamten Text markieren, damit man sofort überschreiben kann
          const range = document.createRange();
          range.selectNodeContents(focusEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }, 250);
      }
    });
  }

  on('add-student', 'click', () => {
    if (state.students.length >= 30) {
      toast('Maximal 30 Mitschüler:innen (Platz auf dem Spread)');
      return;
    }
    addAndFocus({
      id: uid(),
      name: 'Name eingeben',
      fach: '', hobby: '', essen: '', buch: '', beruf: '', motto: '', memory: '',
      photo: null
    }, 'students', 'name');
  });

  /**
   * addMemory(half): 'first' fügt am Ende der 1. Hälfte (= Chronik I) ein,
   * 'second' ans Ende der Liste (= Chronik II). Der Split in renderMemories
   * ist ceil(n/2) — deshalb für 'first' an Position ceil(n/2) einfügen, damit
   * es noch in die erste Hälfte fällt.
   */
  function addMemory(half) {
    const item = {
      id: uid(),
      title: 'Neue Erinnerung',
      meta: 'Ort · Jahr',
      text: '',
      photo: null
    };
    const total = state.memories.length;
    if (half === 'first') {
      // Einfügen an Position, die nach dem erneuten Split noch auf Seite 1 landet.
      // Split: half = ceil((n+1)/2). Wir fügen an half-1 ein, nachdem sich die
      // Liste um 1 verlängert — an Position ceil((total+1)/2)-1.
      const pos = Math.ceil((total + 1) / 2) - 1;
      addAndFocus(item, 'memories', 'title', Math.max(0, pos));
    } else {
      addAndFocus(item, 'memories', 'title'); // ans Ende
    }
  }

  on('add-memory-1', 'click', () => addMemory('first'));
  on('add-memory-2', 'click', () => addMemory('second'));

  on('add-shower', 'click', () => {
    addAndFocus({
      id: uid(),
      text: 'Kurzes, liebes Zitat …',
      from: '— von'
    }, 'showers', 'text');
  });

  // ---------- Sidebar Toggle (Desktop + Mobile) ----------
  //
  // Desktop: Sidebar standardmäßig AUSGEKLAPPT beim Seitenlauf. Der
  // Hamburger-Button setzt body.sidebar-collapsed → Workspace rückt
  // nach links, man sieht mehr von der Zeitung.
  //
  // Mobile (<900px): Sidebar standardmäßig EINGEKLAPPT. Hamburger
  // öffnet sie als Off-Canvas-Drawer mit Backdrop.

  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const mobileMQ = window.matchMedia('(max-width: 900px)');

  function isMobile() { return mobileMQ.matches; }

  function setMobileOpen(open) {
    if (!sidebar || !backdrop) return;
    sidebar.classList.toggle('open', open);
    backdrop.hidden = !open;
  }

  function toggleSidebar() {
    if (isMobile()) {
      setMobileOpen(!sidebar.classList.contains('open'));
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
    updateSidebarButtonLabel();
  }

  function updateSidebarButtonLabel() {
    const btn = document.getElementById('btn-sidebar');
    if (!btn) return;
    const hidden = isMobile()
      ? !sidebar.classList.contains('open')
      : document.body.classList.contains('sidebar-collapsed');
    btn.setAttribute('aria-label', hidden ? 'Seitenleiste öffnen' : 'Seitenleiste schließen');
    btn.setAttribute('title',      hidden ? 'Seitenleiste öffnen' : 'Seitenleiste schließen');
  }

  /** Esc / Nav-Link / Backdrop schließt die jeweils aktive Variante. */
  function closeSidebar() {
    if (isMobile()) setMobileOpen(false);
    else document.body.classList.add('sidebar-collapsed');
  }

  on('btn-sidebar', 'click', toggleSidebar);
  if (backdrop) backdrop.addEventListener('click', () => setMobileOpen(false));
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      if (e.target.matches('.sidebar-close')) setMobileOpen(false);
      // Klick auf Nav-Link schließt die mobile Overlay-Sidebar,
      // lässt die Desktop-Sidebar aber stehen (User will navigieren,
      // nicht den Editor-Chrome einklappen).
      if (e.target.matches('nav a') && isMobile()) setMobileOpen(false);
    });
  }

  // Bei Viewport-Wechsel sauber aufräumen: wenn wir von Desktop auf
  // Mobile wechseln, .sidebar.open zurücksetzen etc.
  mobileMQ.addEventListener('change', (e) => {
    if (e.matches) {
      // Mobile: Overlay-Drawer geschlossen, sidebar-collapsed irrelevant
      setMobileOpen(false);
    } else {
      // Desktop: Overlay-Klasse aus, Backdrop weg
      sidebar.classList.remove('open');
      if (backdrop) backdrop.hidden = true;
    }
  });

  // Initial: immer ausgeklappt starten. sidebar-collapsed NICHT setzen.
  document.body.classList.remove('sidebar-collapsed');
  updateSidebarButtonLabel();

  // ---------- Tastatur-Shortcuts ----------

  document.addEventListener('keydown', (e) => {
    // Strg/Cmd + S exportiert IMMER (auch im Editor) — sonst öffnet der
    // Browser den nutzlosen "Seite speichern"-Dialog.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      document.getElementById('btn-export')?.click();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      document.getElementById('btn-print')?.click();
      return;
    }
    if (e.key === 'Escape') {
      setMenuOpen(false);
      // Esc schließt nur die mobile Overlay-Sidebar — die Desktop-
      // Sidebar bleibt, wo der User sie hat.
      if (isMobile()) setMobileOpen(false);
    }
  });

  // Print-Mirror debouncen
  let mirrorTimer = null;
  function schedulePrintMirror() {
    clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(mirrorPrintLayout, 200);
  }

  // Initial-Render
  render();

  // Bei erstem Laden: State sichern (Default)
  if (!loadState()) saveState();
})();

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
        kicker: 'Abschlussjahrgang',
        year: new Date().getFullYear().toString(),
        titleLine1: 'Unsere Zeit',
        titleLine2: 'Klasse 4X',
        subtitle: 'Grundschule — Eine Zeitung zum Abschied',
        schoolName: 'Grundschule',
        schoolYears: 'Schuljahre 2022 – 2026',

        // Seite 2 Grußwort
        introTitle: 'Liebe Viertklässler:innen',
        introKicker: 'Ein Wort vorweg — von allen, die euch begleitet haben.',
        introLead: 'Vier Jahre sind vergangen, seit ihr das erste Mal mit leuchtenden Augen und einer riesigen Schultüte die Schule betreten habt. Aus kleinen Schulanfänger:innen sind neugierige, mutige Persönlichkeiten geworden.',
        introText: 'Diese Zeitung ist ein Geschenk von uns allen an euch: Eltern, Mitschüler:innen und Lehrkräften. Sie soll euch daran erinnern, wie bunt, turbulent und wertvoll eure Grundschulzeit war. Jedes Foto, jede Anekdote, jede warme Dusche erzählt ein Stück von euch.\n\nBehaltet die Neugier, den Mut und die Freundschaften, die ihr hier gefunden habt. Und wenn es mal schwierig wird: Ihr habt schon so vieles gemeistert — ihr werdet auch das schaffen.',
        introSign: 'Eure Eltern und Lehrkräfte',
        footerLeft2: 'Abschiedszeitung — Klasse 4X',

        // Seite 3 Chronik I
        chronicle1Title: 'Die ersten Jahre',
        chronicle1Kicker: 'Erinnerungen aus Klasse 1 und 2',
        footerLeft3: 'Chronik — Teil 1',

        // Seiten 4+5 Yearbook-Spread
        spreadTitle: 'Unsere Klasse',
        spreadKicker: 'Alle Mitschülerinnen und Mitschüler auf einen Blick',
        spreadFooterLeft: 'Klasse 4X — Yearbook',
        spreadTitleRight: '… und das sind wir.',
        spreadKickerRight: 'Jede:r ein eigener Kosmos.',
        spreadFooterRight: 'Grundschule — Jahrgang 2026',

        // Seite 6 Chronik II
        chronicle2Title: 'Und dann die Großen',
        chronicle2Kicker: 'Erinnerungen aus Klasse 3 und 4',
        footerLeft6: 'Chronik — Teil 2',

        // Seite 7 Warme Duschen
        showersPageTitle: 'Warme Duschen',
        showersPageKicker: 'Das, was ihr aneinander schätzt — in einem Satz.',
        footerLeft7: 'Schöne Worte für den Weg',

        // Seite 8 Rückseite
        page8Title: 'Zum Abschied',
        page8Kicker: 'Ein letzter Gruß — und alles Gute.',
        teacherTitle: 'Ein Gruß vom Klassenteam',
        teacherText: 'Liebe Kinder, vier Jahre lang haben wir gemeinsam gelernt, gelacht, gestritten und uns wieder vertragen. Ihr seid zu einer starken Gemeinschaft zusammengewachsen. Wir wünschen euch für die Zukunft Mut, Neugier und echte Freundinnen und Freunde. Bleibt so, wie ihr seid — und traut euch, mehr zu werden.',
        teacherSign: 'Euer Klassenteam',
        imprintRedaktion: 'Eltern der Klasse',
        imprintDate: 'Juli — einmalig',
        imprintNote: 'Nicht für den öffentlichen Vertrieb. Bilder mit Einwilligung der Erziehungsberechtigten.'
      },
      photos: {
        hero: null,   // Seite 1 Klassenfoto
        intro: null   // Seite 2 Grußwort-Foto
      },
      students: seedStudents(),
      memories: seedMemories(),
      showers: seedShowers()
    };
  }

  function seedStudents() {
    const names = ['Mitschüler/in 1', 'Mitschüler/in 2', 'Mitschüler/in 3', 'Mitschüler/in 4'];
    return names.map((n, i) => ({
      id: uid(),
      name: n,
      fach: '',
      hobby: '',
      beruf: '',
      memory: 'Meine schönste Erinnerung: …',
      photo: null
    }));
  }

  function seedMemories() {
    return [
      // Chronik I (Klasse 1+2)
      { id: uid(), title: 'Einschulung',       meta: '1. Klasse',         text: 'Der erste Schultag — aufgeregte Gesichter, volle Schultüten und ein neues Kapitel beginnt.', photo: null },
      { id: uid(), title: 'Laternenfest',      meta: '1. Klasse · Herbst',text: 'Selbst gebastelte Laternen, kalte Nasen und laute Gesänge im Schulhof.',                photo: null },
      { id: uid(), title: 'Waldtage',          meta: '2. Klasse · Herbst',text: 'Bunte Blätter, matschige Stiefel und gemeinsame Lagerfeuerlieder.',                    photo: null },
      // Chronik II (Klasse 3+4)
      { id: uid(), title: 'Klassenfahrt',      meta: '3. Klasse · Frühling', text: 'Drei Tage, drei Nächte — und Geschichten, die wir nie vergessen.',                  photo: null },
      { id: uid(), title: 'Sportfest',         meta: '3. Klasse',         text: 'Wettrennen, Zielwerfen, Staffeln — und das Eis am Ende für alle.',                    photo: null },
      { id: uid(), title: 'Projektwoche',      meta: '4. Klasse',         text: 'Forschen, basteln, präsentieren — alles durcheinander, alles wunderbar.',             photo: null }
    ];
  }

  function seedShowers() {
    return [
      { id: uid(), text: '„Du bringst uns immer zum Lachen.“', from: '— die Klasse' },
      { id: uid(), text: '„Du hilfst, wenn jemand Hilfe braucht.“', from: '— die Klasse' },
      { id: uid(), text: '„Du hast die besten Ideen beim Basteln.“', from: '— die Klasse' },
      { id: uid(), text: '„Du bist mutig und ehrlich.“', from: '— die Klasse' }
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
    if (!Array.isArray(loaded.memories)) loaded.memories = d.memories;
    if (!Array.isArray(loaded.showers))  loaded.showers  = d.showers;
    if (!loaded.photos || typeof loaded.photos !== 'object') loaded.photos = { hero: null, intro: null };
    if (loaded.photos.intro === undefined) loaded.photos.intro = null;
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
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        alert('Speichern fehlgeschlagen — vermutlich ist der lokale Speicher voll. Bitte große Bilder entfernen oder als JSON exportieren.');
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

    const total = state.students.length;

    // Empty-State
    if (total === 0) {
      const msg = '<div class="empty-state">Noch keine Steckbriefe. Links in der Sidebar auf <strong>+ Steckbrief</strong> klicken.</div>';
      leftEl.innerHTML  = msg;
      rightEl.innerHTML = '';
      leftEl.style.removeProperty('--cols');
      leftEl.style.removeProperty('--rows');
      ['tier-xl','tier-l','tier-m','tier-s','tier-xs','tier-xxs'].forEach(c => {
        document.getElementById('page-2').classList.remove(c);
        document.getElementById('page-3').classList.remove(c);
      });
      return;
    }

    const layout = computeSpreadLayout(total);

    // Tier-Klassen am SEITEN-Container (damit Tier-Selektoren greifen)
    const page2 = document.getElementById('page-2');
    const page3 = document.getElementById('page-3');
    ['tier-xl', 'tier-l', 'tier-m', 'tier-s', 'tier-xs', 'tier-xxs'].forEach(c => {
      page2.classList.remove(c);
      page3.classList.remove(c);
    });
    page2.classList.add(layout.tier);
    page3.classList.add(layout.tier);

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
      setField(clone, 'name', item.name);
      setField(clone, 'fach', item.fach);
      setField(clone, 'hobby', item.hobby);
      setField(clone, 'beruf', item.beruf);
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
      photoEl.insertBefore(img, photoEl.firstChild);
      photoEl.classList.add('has-image');
    } else {
      photoEl.classList.remove('has-image');
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
      // Content nicht erneut editierbar machen
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      clone.querySelectorAll('button, input[type="file"]').forEach(el => el.remove());
      slot.appendChild(clone);
    });
  }

  // ---------- Event-Handling (Delegation) ----------

  const workspace = document.getElementById('workspace');

  // Inline-Editing - contenteditable
  workspace.addEventListener('input', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.isContentEditable === false) return;

    // globales Feld?
    const field = el.getAttribute('data-field');
    if (!field) return;

    const studentCard = el.closest('[data-student-id]');
    const memoryCard = el.closest('[data-memory-id]');
    const showerCard = el.closest('[data-shower-id]');

    if (studentCard) {
      const item = state.students.find(s => s.id === studentCard.dataset.studentId);
      if (item) item[field] = el.textContent;
    } else if (memoryCard) {
      const item = state.memories.find(s => s.id === memoryCard.dataset.memoryId);
      if (item) item[field] = el.textContent;
    } else if (showerCard) {
      const item = state.showers.find(s => s.id === showerCard.dataset.showerId);
      if (item) item[field] = el.textContent;
    } else {
      state.fields[field] = el.textContent;
    }
    saveState();
    // Druck-Layout-Spiegelung mit leichter Verzoegerung
    schedulePrintMirror();
  });

  // Foto-Klick -> Dateiauswahl
  workspace.addEventListener('click', (e) => {
    const photo = e.target.closest('.photo');
    if (!photo || e.target.closest('.photo-remove')) return;
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
    render();
  });

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
      state.students = state.students.filter(s => s.id !== card.dataset.studentId);
    } else if (card.dataset.memoryId) {
      state.memories = state.memories.filter(s => s.id !== card.dataset.memoryId);
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

  document.querySelectorAll('.view-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      workspace.dataset.view = btn.dataset.view;
      if (btn.dataset.view === 'print-layout') mirrorPrintLayout();
    });
  });

  // ---------- Drucken ----------

  on('btn-print', 'click', () => {
    mirrorPrintLayout();
    setTimeout(() => window.print(), 50);
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
        const loaded = JSON.parse(reader.result);
        if (!loaded || typeof loaded !== 'object') throw new Error('Ungültiges Format');
        if (!Array.isArray(loaded.students)) throw new Error('Liste der Mitschüler fehlt');
        if (!Array.isArray(loaded.memories)) loaded.memories = [];
        if (!Array.isArray(loaded.showers))  loaded.showers  = [];
        if (!loaded.fields || typeof loaded.fields !== 'object') loaded.fields = {};
        if (!loaded.photos || typeof loaded.photos !== 'object') loaded.photos = { hero: null, intro: null };
    if (loaded.photos.intro === undefined) loaded.photos.intro = null;
        state = loaded;
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

  on('add-student', 'click', () => {
    if (state.students.length >= 30) {
      toast('Maximal 30 Mitschüler:innen (Platz auf dem Spread)');
      return;
    }
    state.students.push({
      id: uid(),
      name: 'Neuer Steckbrief',
      fach: '',
      hobby: '',
      beruf: '',
      memory: 'Meine schönste Erinnerung: …',
      photo: null
    });
    saveState();
    render();
  });

  on('add-memory', 'click', () => {
    state.memories.push({
      id: uid(),
      title: 'Neue Erinnerung',
      meta: 'Ort · Jahr',
      text: 'Kurzer Text …',
      photo: null
    });
    saveState();
    render();
  });

  on('add-shower', 'click', () => {
    state.showers.push({
      id: uid(),
      text: '„Neues Zitat …"',
      from: '— von'
    });
    saveState();
    render();
  });

  // ---------- Mobile-Sidebar ----------

  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  function setSidebarOpen(open) {
    if (!sidebar || !backdrop) return;
    sidebar.classList.toggle('open', open);
    backdrop.hidden = !open;
  }
  on('btn-sidebar', 'click', () => setSidebarOpen(!sidebar.classList.contains('open')));
  if (backdrop) backdrop.addEventListener('click', () => setSidebarOpen(false));
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      if (e.target.matches('.sidebar-close')) setSidebarOpen(false);
      if (e.target.matches('nav a')) setSidebarOpen(false);
    });
  }

  // ---------- Tastatur-Shortcuts ----------

  document.addEventListener('keydown', (e) => {
    // Editor-Inputs nicht stören
    const inEditable = e.target && e.target.isContentEditable;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !inEditable) {
      e.preventDefault();
      document.getElementById('btn-export')?.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      document.getElementById('btn-print')?.click();
    }
    if (e.key === 'Escape') {
      setMenuOpen(false);
      setSidebarOpen(false);
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

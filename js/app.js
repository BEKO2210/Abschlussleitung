/* =========================================================
   Abschiedszeitung - Editor Logic (reiner Client)
   Alle Daten bleiben im Browser (localStorage).
   ========================================================= */

(function () {
  'use strict';

  // ---------- State / Storage ----------

  const STORAGE_KEY = 'abschiedszeitung:v1';
  const THEMES = ['default', 'warm', 'forest', 'sunset', 'mono'];

  /** @type {any} */
  let state = loadState() || defaultState();

  function defaultState() {
    return {
      theme: 'default',
      fields: {
        kicker: 'Abschlussjahrgang',
        year: new Date().getFullYear().toString(),
        titleLine1: 'Unsere Zeit',
        titleLine2: 'Klasse 4X',
        subtitle: 'Grundschule — Eine Zeitung zum Abschied',
        schoolName: 'Grundschule',
        schoolYears: 'Schuljahre 2022 – 2026',
        page2Title: 'Wer wir sind',
        page2Kicker: 'Steckbriefe unserer Klasse',
        page2Footer: 'Abschiedszeitung — Klasse 4X',
        page3Title: 'Unsere Erinnerungen',
        page3Kicker: 'Vier Jahre in Bildern und Worten',
        page3Footer: 'Klassenfahrten, Waldtage & Projekte',
        page4Title: 'Warme Duschen & Abschied',
        page4Kicker: 'Worte zum Mitnehmen',
        teacherTitle: 'Ein Gruß vom Klassenteam',
        teacherText: 'Liebe Kinder, vier Jahre lang haben wir gemeinsam gelernt, gelacht, gestritten und uns wieder vertragen. Ihr seid zu einer starken Gemeinschaft zusammengewachsen. Wir wünschen euch für die Zukunft Mut, Neugier und echte Freundinnen und Freunde. Bleibt so, wie ihr seid — und traut euch, mehr zu werden.',
        teacherSign: 'Euer Klassenteam',
        imprintRedaktion: 'Eltern der Klasse',
        imprintDate: 'Juli — einmalig',
        imprintNote: 'Nicht für den öffentlichen Vertrieb. Bilder mit Einwilligung der Erziehungsberechtigten.'
      },
      photos: {
        hero: null // dataURL
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
      { id: uid(), title: 'Einschulung', meta: '1. Klasse', text: 'Der erste Schultag — aufgeregte Gesichter, volle Schultüten und ein neues Kapitel beginnt.', photo: null },
      { id: uid(), title: 'Waldtage', meta: '2. Klasse · Herbst', text: 'Bunte Blätter, matschige Stiefel und gemeinsame Lagerfeuerlieder.', photo: null },
      { id: uid(), title: 'Klassenfahrt', meta: '3. Klasse · Frühling', text: 'Drei Tage, drei Nächte — und Geschichten, die wir nie vergessen.', photo: null },
      { id: uid(), title: 'Projektwoche', meta: '4. Klasse', text: 'Forschen, basteln, präsentieren — alles durcheinander, alles wunderbar.', photo: null }
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

    // Hero photo
    applyPhoto(document.querySelector('.photo[data-photo="hero"]'), state.photos.hero);

    // Students
    renderList('student-grid', 'tpl-student', state.students, (root, item) => {
      root.dataset.studentId = item.id;
      setField(root, 'name', item.name);
      setField(root, 'fach', item.fach);
      setField(root, 'hobby', item.hobby);
      setField(root, 'beruf', item.beruf);
      setField(root, 'memory', item.memory);
      const photoEl = root.querySelector('.photo');
      photoEl.dataset.photo = 'student:' + item.id;
      applyPhoto(photoEl, item.photo);
    });

    // Memories
    renderList('memory-bento', 'tpl-memory', state.memories, (root, item) => {
      root.dataset.memoryId = item.id;
      setField(root, 'title', item.title);
      setField(root, 'meta', item.meta);
      setField(root, 'text', item.text);
      const photoEl = root.querySelector('.photo');
      photoEl.dataset.photo = 'memory:' + item.id;
      applyPhoto(photoEl, item.photo);
    });

    // Showers
    renderList('shower-grid', 'tpl-shower', state.showers, (root, item) => {
      root.dataset.showerId = item.id;
      setField(root, 'text', item.text);
      setField(root, 'from', item.from);
    });

    // Print-Mirror aktualisieren
    mirrorPrintLayout();
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
    readFileAsResizedDataURL(file, 1600, 0.85).then(dataUrl => {
      setPhoto(photo.dataset.photo, dataUrl);
      render();
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
    if (!file || !file.type.startsWith('image/')) return;
    readFileAsResizedDataURL(file, 1600, 0.85).then(dataUrl => {
      setPhoto(photo.dataset.photo, dataUrl);
      render();
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

  // ---------- Toolbar / Sidebar-Aktionen ----------

  document.querySelectorAll('.view-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      workspace.dataset.view = btn.dataset.view;
      if (btn.dataset.view === 'print-layout') mirrorPrintLayout();
    });
  });

  document.getElementById('btn-print').addEventListener('click', () => {
    // Immer das Druck-Layout drucken - Mirror aktualisieren
    mirrorPrintLayout();
    setTimeout(() => window.print(), 50);
  });

  document.getElementById('btn-theme').addEventListener('click', () => {
    const i = THEMES.indexOf(state.theme || 'default');
    state.theme = THEMES[(i + 1) % THEMES.length];
    saveState();
    render();
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abschiedszeitung-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-import').click();
  });
  document.getElementById('file-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const loaded = JSON.parse(reader.result);
        if (!loaded || typeof loaded !== 'object') throw new Error('invalid');
        state = loaded;
        saveState();
        render();
      } catch (err) {
        alert('Diese Datei konnte nicht geladen werden.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Alle Inhalte und Bilder wirklich loeschen und mit Beispiel neu starten?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    saveState();
    render();
  });

  document.getElementById('add-student').addEventListener('click', () => {
    state.students.push({
      id: uid(),
      name: 'Neuer Steckbrief',
      fach: '',
      hobby: '',
      beruf: '',
      memory: 'Meine schoenste Erinnerung: ...',
      photo: null
    });
    saveState();
    render();
  });

  document.getElementById('add-memory').addEventListener('click', () => {
    state.memories.push({
      id: uid(),
      title: 'Neue Erinnerung',
      meta: 'Ort / Jahr',
      text: 'Kurzer Text ...',
      photo: null
    });
    saveState();
    render();
  });

  document.getElementById('add-shower').addEventListener('click', () => {
    state.showers.push({
      id: uid(),
      text: '„Neues Zitat ...“',
      from: '— von'
    });
    saveState();
    render();
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

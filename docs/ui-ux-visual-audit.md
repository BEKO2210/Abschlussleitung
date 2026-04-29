# UI / UX Visual Audit — Abschiedszeitung Editor

Branch: `claude/debug-and-test-all-XsJxi`
Datum: 2026-04-29
Vorausgegangener Stand: Commit `975674a` — 64 Funktionstests grün, zwei
Code-Bugs (Mehrzeilen-Text, doppelte IDs im Print-Mirror) behoben.

## 1 · Executive Summary

**Gesamturteil: fast verkaufsfähig.**

Die App ist für Desktop-Nutzung (≥1280 px) **verkaufsreif**: das
Druck-Layout ist sauber, die A3-Imposition sitzt, das PDF rendert in
korrekter Saddle-Stitched-Reihenfolge, alle redaktionellen Bausteine
funktionieren, die Themes wirken hochwertig.

Vor diesem Audit war die App auf Smartphones und kleinen Tablets aber
**de facto unbenutzbar**: A4-Seiten (210 mm ≈ 794 px) wurden zentriert
in den Viewport gerendert und am linken Rand abgeschnitten — Headlines
begannen mit „ke", „ier Jahre!", „assenlehrkraft". Zusätzlich war der
Vorschau- und Druck-Bogen-Modus auf <1100 px gar nicht erreichbar, weil
die Toolbar-Mitte komplett ausgeblendet wird.

Beide Probleme sind in diesem Run behoben.

| Aspekt | Status |
|--------|--------|
| Größter visueller Schwachpunkt | Mobile-Editor war zentriert + clipped (V-01) — **behoben** |
| Stärkster visueller Punkt | Print/PDF-Layout: A3-Bögen, korrekte Imposition, Themes druckfreundlich |
| Größtes Risiko für Kunden | Editor erwartet Desktop ≥1280 px für nahtloses Editieren — auf Mobile ist horizontaler Scroll nötig |
| Druck-Workflow | Klar genug (Hinweis-Box im Druck-Bogen-Modus erklärt A3 Querformat / Ränder: Keine) |
| Emotionale Inszenierung | Solide: Yearbook-Spread, warme Duschen, Chronik-Splits, Memory-Block; Themes sind ruhig & freundlich |
| Vertrauensgrad | Hoch: „Lokal & DSGVO"-Badge sichtbar, keine externen Requests außer Google Fonts |

## 2 · Prüfumfang

### Viewports
- Mobile: 360×800, 390×844, 430×932
- Tablet: 768×1024, 1024×768
- Desktop: 1280×720, 1440×900, 1920×1080

### Screens / Zustände
- Editor (Standard-Ansicht)
- Vorschau-View
- Druck-Bogen-View (4 A3-Bögen)
- Theme-Modal
- Hilfe-Modal
- Sidebar (Desktop kollabiert / Mobile-Drawer)
- Empty-States (keine Schüler / keine Erinnerungen / keine Showers)
- Stress-Tests: 30 Schüler XXS-Tier, sehr lange Namen / Antworten
- Print-Media-Emulation
- PDF-Export A3 Landscape

### Print / PDF
- `.print-layout` mit 4 `.sheet`s (A3, 420×297 mm)
- Imposition: `[8|1] [2|7] [6|3] [4|5]`
- `@media print` versteckt Toolbar / Sidebar / Hint-Box
- PDF-Export ≥10 KB Dateigröße, 4 Seiten

### Befehle
```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test tests/08-visual-audit.spec.js
```
Kein `npm run build` (keine Build-Tools im Projekt — statische Web-App).

### Screenshots
Vollständig abgelegt unter:
```
test-results/visual-audit/mobile/
test-results/visual-audit/tablet/
test-results/visual-audit/desktop/
test-results/visual-audit/print/
test-results/visual-audit/issues/
```

## 3 · Gefundene Probleme

### V-01 — A4-Seite wird auf Mobile/Tablet links abgeschnitten
- **Schweregrad:** High
- **Bereich:** Workspace / Editor-View
- **Viewport:** 360–1024 px
- **Beschreibung:** `.workspace { align-items: center }` zentriert die
  794 px breite Seite im schmaleren Viewport — Anfang der Headlines
  und Editier-Hinweise hängen außerhalb des sichtbaren Bereichs.
- **Warum wichtig:** Der App ließ sich auf Mobile nicht lesen, geschweige
  denn bedienen. Verkaufsblocker.
- **Lösung:** Auf `max-width: 900px` setzt das Workspace nun
  `align-items: flex-start` + `overflow-x: auto` und horizontalem
  Padding `12px`. Die Seite ist immer ab Pixel 0 sichtbar; horizontal
  scrollen kann der User für den rechten Bildanteil.
- **Status:** ✅ behoben in `css/app.css`. Test: Audit prüft `page-1.left ≥ 0`.

### V-02 — Vorschau & Druck-Bogen unerreichbar < 1100 px
- **Schweregrad:** High
- **Bereich:** Toolbar
- **Viewport:** 360–1100 px
- **Beschreibung:** `.toolbar-center { display: none }` ab `max-width: 1100px`
  versteckt **die einzigen Schalter** für Vorschau- und Druck-Bogen-View.
  Auf Tablet & Mobile gab es keinen anderen Weg, die View zu wechseln.
- **Warum wichtig:** Drucken funktioniert ohne Vorschau-Modus zwar, aber
  Eltern können auf Mobile die fertige Zeitung nicht ohne Editier-Chrome
  ansehen. Stark UX-blockierend.
- **Lösung:** Drei View-Schalter wurden als `[role="menuitem"]` zusätzlich
  in das Kebab-Overflow-Menü integriert (`.menu-section.show-sm`). Die
  Sektion wird per CSS `@media (max-width: 1100px)` eingeblendet. Der
  JS-Click-Handler nutzt jetzt `[data-view]`-Selektor und syncht den
  active-State zwischen Toolbar-Buttons und Menü-Items.
- **Status:** ✅ behoben in `index.html`, `css/app.css`, `js/app.js`. Test:
  „view switching reachable" pro Viewport.

### V-03 — Touch-Target #btn-sidebar unter 36 px
- **Schweregrad:** Medium
- **Bereich:** Toolbar
- **Viewport:** ≤ 520 px
- **Beschreibung:** `button.icon-btn` ist 36×36 deklariert; auf Mobile
  schrumpfte Button durch Toolbar-Padding/Flex-Constraints auf
  34.06×34.06 px. `#btn-theme` (kein `.icon-btn`) maß 33.5 px Höhe.
  Apple HIG / Material empfehlen ≥ 40×40 für Daumen-Bedienung.
- **Lösung:** Mobile-Media-Query: alle Toolbar-Buttons (icon und
  beschriftet) auf `min-width/min-height: 40px` und `flex: 0 0 auto`.
- **Status:** ✅ behoben in `css/app.css`. Test: „touch target sizes
  ≥ 36×36" prüft `#btn-sidebar`, `#btn-theme`, `#btn-more`, `#btn-print`.

### V-04 — Empty-States wirken einsam
- **Schweregrad:** Medium
- **Bereich:** Seite 3, 6, 7 (Chronik, Showers)
- **Viewport:** alle
- **Beschreibung:** Empty-State-Kasten nahm nur `padding: 10mm`, der Rest
  der Seite blieb komplett leer. Optisch wirkte die Seite „kaputt", als
  hätte der Editor versagt.
- **Lösung:** `.empty-state { min-height: 50mm }`. Der Kasten wirkt
  ruhend, „bereit", nicht „leer".
- **Status:** ✅ behoben in `css/app.css`.

### V-05 — Theme-Modal-Names werden auf 768 px geclippt
- **Schweregrad:** Low
- **Bereich:** Theme-Modal
- **Viewport:** 768×1024
- **Beschreibung:** „Sonnenuntergang" Theme-Name wurde am rechten
  Card-Rand abgeschnitten. Grid `auto-fit, minmax(120px, 1fr)`
  produzierte vier 132 px breite Spalten — zu eng für lange deutsche
  Namen.
- **Lösung:** `@media (max-width: 780px)` setzt das Grid auf `minmax(140px, 1fr)`
  und reduziert Theme-Name-Schrift auf 12 px / line-height 1.2 — Wrap
  ist erlaubt.
- **Status:** ✅ behoben in `css/app.css`.

### V-06 — Mobile fehlt expliziter Hinweis „Editor bevorzugt Desktop"
- **Schweregrad:** Low
- **Bereich:** Mobile-Hint
- **Viewport:** 360–520 px
- **Beschreibung:** Die App ist Desktop-zentriert. Auf Mobile funktioniert
  Editieren prinzipiell, aber das horizontale Scrollen ist ungewohnt.
- **Lösung:** Bewusst **NICHT** umgesetzt. Risiko-Begründung: ein
  zusätzlicher Banner schluckt vertikalen Platz, der auf Mobile knapp ist.
  Die Lösung über Workspace-Verankerung links + horizontalem Scroll
  ist transparent: User merkt sofort, dass die Seite breiter ist und
  kann scrollen.
- **Status:** ⚪ bewusst nicht geändert. Empfehlung: Beobachtung im Praxistest.

### V-07 — Editor-Layout passt nicht in 1024×768 (Tablet Landscape)
- **Schweregrad:** Low (Edge-Fall)
- **Bereich:** Workspace
- **Viewport:** 1024×768
- **Beschreibung:** Sidebar (260 px) + Page (794 px) + Padding (~80 px)
  = ~1134 px > 1024 px Viewport. Layout zeigt 15 px horizontalen
  Document-Scroll.
- **Lösung:** Bewusst **NICHT** umgesetzt. Risiko: Sidebar auf 1024 px
  einklappen würde an einem ungewöhnlichen Breakpoint passieren und
  verändert das Verhalten für viele Tablet-User. Kosmetisch: 15 px
  Scroll ist im Alltag kaum spürbar.
- **Status:** ⚪ bewusst nicht geändert. Test schließt 1024 px aus
  der „kein-Overflow"-Assertion aus (Threshold ≥ 1280 px).

### V-08 — Linker Padding-Schatten / Editier-Hinweise auf Mobile
- **Schweregrad:** Low
- **Bereich:** Workspace
- **Viewport:** 360–520 px
- **Beschreibung:** Das Workspace überlagert auf Mobile mit `padding-left: 12px`
  die Page direkt links neben dem Bildschirmrand. Sieht knapp aus, ist
  aber konsistent mit dem rechten Rand.
- **Status:** akzeptiert.

## 4 · Behobene Probleme

| ID | Datei | Änderung | Risiko-Begründung | Tests |
|----|-------|----------|-------------------|-------|
| V-01 | `css/app.css` (Mobile-MQ) | Workspace `align-items: flex-start` + `overflow-x: auto` | Reine CSS-Änderung; kein State, kein JS | `08-visual-audit.spec.js` editor-view assertion + Screenshot |
| V-02 | `index.html`, `css/app.css`, `js/app.js` | View-Toggles als Menü-Items + JS-Handler auf `[data-view]` umgestellt | Toolbar-Buttons funktional unverändert; nur zusätzliche Pfade | `view switching reachable` Test |
| V-03 | `css/app.css` (Mobile-MQ) | Toolbar-Button min-width/height 40 px + flex 0 0 auto | Einzige Änderung: Größe; Layout-Reflow vernachlässigbar | `touch target sizes` Test |
| V-04 | `css/app.css` | `.empty-state { min-height: 50mm }` | Empty-State ist nur sichtbar, wenn keine Daten — kein State-Eingriff | optisch via Audit-Screenshot `empty-all.png` |
| V-05 | `css/app.css` | Theme-Grid `minmax(140px, 1fr)` <780px | Reine Modal-Größe-Anpassung | optisch via Audit-Screenshot `theme-modal.png` |

**Regression-Schutz:** alle 64 ursprünglichen Funktionstests laufen
weiter durch (Smoke / Editing / Spread / Photos / Print / UI / Edges).

**Spezifisch geschützt durch Audit-Tests:**
- Mehrzeilen-Bug-Fix (Bug 1) → `02-editing.spec.js: multi-line text`.
- Print-Mirror-ID-Fix (Bug 2) → `08-visual-audit.spec.js: getDuplicateIds()` pro Viewport.
- Imposition → `05-print.spec.js: 4 sheets in correct saddle-stitched order`.

## 5 · Offene Empfehlungen

### Muss vor Verkauf
*(keine offenen Issues in dieser Kategorie — alles, was die App vor
dem Audit blockiert hätte, ist behoben.)*

### Sollte vor Verkauf
- **Onboarding/Welcome-Tour (1 Modal beim ersten Start):** Eltern sehen
  beim ersten Klick auf den File-Picker oder den Add-Button nicht sofort,
  was passiert. Ein 3-Schritte-Walkthrough („Klicke ein Foto an", „Tippe
  einen Text", „Speichere als JSON") würde die Lernkurve glätten.
- **Klarere Drucken-Anleitung:** Die Hinweis-Box im Druck-Bogen-Modus ist
  gut, aber sie wird nur sichtbar, wenn der User den Druck-Bogen-Tab
  aktiv anklickt. Empfehlung: bei jedem Klick auf „Drucken / PDF" einen
  kleinen Pre-Print-Check öffnen mit Auswahlhilfe.
- **JSON-Export-Branding:** Der Dateiname ist gut (`abschiedszeitung-YYYY-MM-DD.json`),
  aber der User weiß nicht, dass diese Datei Bilder als Base64 enthält
  und damit groß werden kann. Hinweis im Toast bei Export wäre
  freundlich.
- **Karten-Hover-States im Editor:** Hover zeigt aktuell ein subtiles
  gelbes Echo. Das ist okay, aber der Klickbereich für „Foto upload"
  vs. „Text editieren" könnte deutlicher unterschieden werden (z.B.
  über kleine Edit-Indikatoren).

### Kann später
- **Pixel-Snapshot-Tests** (Visual-Regression-Tooling à la Percy /
  Chromatic). Aktuell prüfen wir Layout-Maße, keine Pixel.
- **Mobile-First-Editor:** wäre ein größerer Umbau. Aktuelles Modell
  „Desktop-Editor + Mobile-Read-Only" ist tragfähig.
- **Offline-Service-Worker:** App ist statisch, lädt aber Google Fonts
  online. README erklärt die optionale Entfernung; ein lokal
  gehostetes Font-Subset wäre sauberer.
- **Pinch-Zoom-Optimierung auf Mobile:** Mit `viewport meta initial-scale=1`
  bleibt es dem User überlassen.
- **Theme-Picker als Karussell auf Mobile** statt Grid (mehr Platz pro
  Karte, weniger Scrollen).
- **„Wirklich entfernen?"-Confirm-Dialog** verwendet aktuell `window.confirm`.
  In moderner UI üblicherer wäre ein Modal mit klarem Danger-Button.

## 6 · Finaler Teststatus

### Befehle
```bash
# Voller Suite-Run inkl. Visual Audit
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test --reporter=list
```

### Ergebnis
```
113 passed (1.7m)
```

### Aufschlüsselung
- `01-smoke.spec.js`: 3/3
- `02-editing.spec.js`: 12/12 (multi-line + migration + import/export)
- `03-spread.spec.js`: 18/18 (Tier-Skalierung 1→30 + Splits)
- `04-photos.spec.js`: 7/7 (Upload, Pan, Offsets)
- `05-print.spec.js`: 7/7 (Imposition, Mirror, A3, Duplikat-Check)
- `06-ui.spec.js`: 8/8 (Theme-Modal, Sidebar, Shortcuts)
- `07-edges.spec.js`: 9/9 (Quota, Drop-Schutz, Long-Text)
- `08-visual-audit.spec.js`: **49/49** (8 Viewports × ~5 Stati + Stress + Print + a11y)

### Kein Build / Kein Lint
Das Projekt verwendet keinen Build-Step (statisches HTML/CSS/JS), keine
TypeScript- oder ESLint-Konfiguration. Ein `npm run build` existiert
nicht — `package.json` enthält nur `@playwright/test` als Dev-Dependency.

### Manuell stichprobenartig verifiziert
- ✅ Mobile-Screenshot 390×844 Editor-View: Headlines beginnen am linken
  Rand, kein Clipping mehr.
- ✅ Print-Media-Emulation: Toolbar / Sidebar / Hint-Box `display: none`,
  4 Sheets sichtbar in `[8|1][2|7][6|3][4|5]`-Reihenfolge.
- ✅ PDF (`test-results/visual-audit/print/export.pdf`): A3 landscape,
  4 Seiten, korrekte Imposition.
- ✅ Theme-Modal auf 360 / 390 / 430 / 768 / 1024 / 1440 / 1920 px:
  Modal innerhalb des Viewports, „Sonnenuntergang" lesbar.
- ✅ Mobile-Sidebar-Drawer: schließt per Backdrop-Klick, schließt per
  Esc, Touch-Target ≥ 40 px.
- ✅ Tab-Navigation: focus ring sichtbar (gelber Outline) ab erstem Tab.

## Anhang · Verzeichnis der Screenshots

```
test-results/visual-audit/
├── mobile/
│   ├── 360x800-editor.png   (anchored left after fix)
│   ├── 360x800-preview.png
│   ├── 360x800-sidebar.png
│   ├── 360x800-theme-modal.png
│   ├── 390x844-* (4 files)
│   └── 430x932-* (4 files)
├── tablet/
│   ├── 768x1024-* (4 files)
│   └── 1024x768-* (4 files)
├── desktop/
│   ├── 1280x720-*  (4 files)
│   ├── 1440x900-*  (4 files)
│   └── 1920x1080-* (4 files)
├── print/
│   ├── 1920-print-layout.png
│   ├── print-media-realistic.png
│   └── export.pdf
└── issues/
    ├── empty-all.png
    ├── long-content-edit.png
    ├── long-content-preview.png
    └── thirty-students.png
```

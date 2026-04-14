# CLAUDE.md — Abschiedszeitung Editor

## Projekt-Zweck

Eine rein clientseitige Web-App, mit der Eltern einer 4. Klasse eine
Abschiedszeitung im A3-Format (gefaltet auf A4, 4 Seiten) gestalten und als
PDF drucken können. Die App ist **vollständig offline nutzbar**, speichert
Inhalte nur im `localStorage` des Browsers und enthält keine Namen oder
klassenspezifischen Daten — jede Klasse kann sie frei anpassen.

## Architektur

- Statisches HTML/CSS/Vanilla-JS, keine Build-Tools, kein Backend.
- `index.html` enthält UI-Chrome + vier A4-Seiten + Druck-Layout.
- `js/app.js` — Editor-Logik, Rendering, localStorage, Import/Export.
- `css/app.css` — UI-Chrome (Toolbar, Sidebar, Dialoge) — nur Bildschirm.
- `css/newspaper.css` — Seitenlayout (Benno-/Yearbook-Stil).
- `css/print.css` — `@page { size: A3 landscape; }` + Druck-Imposition.

### Seiten-Layout (Saddle-Stitched Booklet, 8 Seiten)

Zwei A3-Bögen werden jeweils beidseitig bedruckt, ineinandergelegt und in
der Mitte gefaltet. Das ergibt ein 8-seitiges Heft:

```
Bogen 1 Vorderseite:   [ 8 | 1 ]   ← Rückseite + Titel
Bogen 1 Rückseite:     [ 2 | 7 ]
Bogen 2 Vorderseite:   [ 6 | 3 ]
Bogen 2 Rückseite:     [ 4 | 5 ]   ← Jahrbuch-Spread (Heftmitte)
```

**Wichtig:** Seiten 4 + 5 bilden aufgeklappt den **Jahrbuch-Spread** — dort
sehen Leser:innen alle Kinder gleichzeitig wie in einem US-amerikanischen
Yearbook. Das ist die natürliche Heftmitte.

**Redaktionelle Zuordnung:**

| Seite | Inhalt                                  |
|-------|-----------------------------------------|
| 1     | Cover (Titel + Klassenfoto)             |
| 2     | Grußwort / Brief an die Kinder          |
| 3     | Chronik I (Klasse 1 + 2)                |
| 4     | Jahrbuch-Spread links (Kinder 1. Hälfte)|
| 5     | Jahrbuch-Spread rechts (Kinder 2. Hälfte)|
| 6     | Chronik II (Klasse 3 + 4)               |
| 7     | Warme Duschen                           |
| 8     | Abschieds-Grußwort + Impressum          |

### Inhalts-Model (state)

```js
{
  theme: 'default' | 'warm' | 'forest' | 'rose' | 'ocean' | 'plum' | 'sunset' | 'mono',
  fields: { /* flat key → string, für Titel, Kicker, Footer, Grußwort, … */ },
  photos: {
    hero:  dataUrl | null,  // Cover, Seite 1
    intro: dataUrl | null   // Grußwort, Seite 2
  },
  photoOffsets: {
    // key: 'hero' | 'intro' | 'student:ID' | 'memory:ID'
    //   -> { x: 0..100, y: 0..100 }  (object-position in Prozent)
  },
  students:  [{ id, name, fach, hobby, beruf, memory, photo }],   // Seiten 4+5
  memories:  [{ id, title, meta, text, photo }],                  // Seiten 3+6
  showers:   [{ id, text, from }]                                 // Seite 7
}
```

### Grid-Logik Yearbook-Spread (Seiten 2 + 3)

Alle `students` werden in zwei etwa gleich große Hälften geteilt und auf
Seite 2/3 gerendert. Die Spaltenzahl und Kartengröße werden dynamisch
abhängig von der Gesamtzahl gewählt, um **keine halb-leeren Seiten** zu
erzeugen:

| Gesamt  | pro Seite | Spalten × Reihen | Karten-Stil |
|---------|-----------|------------------|-------------|
| 1–4     | 2         | 1 × 2            | XL          |
| 5–8     | 4         | 2 × 2            | L           |
| 9–12    | 6         | 2 × 3            | M           |
| 13–18   | 9         | 3 × 3            | S           |
| 19–24   | 12        | 3 × 4            | XS          |
| 25–30   | 15        | 3 × 5            | XXS         |

Das Grid nutzt `grid-template-rows: repeat(rows, 1fr)` auf einem
flex-1-Container, damit Karten die Seite immer vollständig ausfüllen.

## Run-Plan

- [x] **Run 1** — CLAUDE.md, Yearbook-Spread-Struktur.
- [x] **Run 2** — Dynamische Grid-Skalierung bis 30 Kinder, Tiers XL → XXS.
- [x] **Run 3** — Menü-Debug: responsive Toolbar, Farbschema-Modal,
      Mobile-Sidebar, Tastatur-Shortcuts.
- [x] **Run 4** — State-Migration, Empty-States, Druck-QA, Upload-Fehler.
- [x] **Run 5** — 8-Seiten-Booklet mit korrekter Saddle-Stitched-
      Imposition (2 A3-Bögen beidseitig), Seiten 1–8 redaktionell
      zugeordnet, Erinnerungen auf Chronik I+II gesplittet.
- [x] **Run 6** — Bildausschnitt per Drag verschiebbar (Pan-Button),
      `object-position` wird pro Foto gespeichert und im Druck
      mitgeliefert.
- [x] **Run 7** — Desktop-first UI-Polish: Workspace-Ränder, Editier-
      Hinweise dezenter, Print-Layout mit Sheet-Labels.
- [x] **Run 8** — Erstellen-Flows: zwei Add-Buttons für Erinnerungen
      (Chronik I/II), Autofocus auf neues Item, Pan-Button bei zu
      kleinen Karten ausgeblendet.

## Entwickler-Notizen

- Alle Texte sind `contenteditable`. Input-Events werden an den Root per
  Delegation gelauscht; das `data-field`-Attribut am Element steuert,
  welches State-Feld aktualisiert wird.
- Bilder werden beim Upload via `<canvas>` auf max. 1600 px lange Kante
  skaliert und als JPEG (Q=0.85) in `state` abgelegt — sonst sprengt man
  mit 30 Fotos schnell das localStorage-Limit (~5 MB).
- Seiten 2 + 3 teilen sich genau eine Student-Liste; das Rendering splittet
  bei jedem `render()` neu — kein separater Zustand nötig.
- Druck-Layout (Klasse `.print-layout`) spiegelt die A4-Seiten in A3-Bögen.
  Die `mirrorPrintLayout()`-Funktion klont DOM-Knoten, entfernt
  `contenteditable` und Upload-Buttons.

## Datenschutz-Richtlinien

- Kein Tracking, keine Cookies, kein Backend.
- Einzige externe Ressource: Google-Fonts-CSS (optional — siehe README).
- JSON-Export enthält Bilder als Base64 → nur in vertrauenswürdigen Kanälen
  teilen.

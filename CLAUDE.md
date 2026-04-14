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

### Seiten-Layout (gefaltetes A3)

```
A3-Bogen flach:          Nach Falten (A4):
┌─────────┬─────────┐    ┌─────────┐
│ Seite 4 │ Seite 1 │    │ Seite 1 │  ← Titel
│ außen L │ außen R │    └─────────┘
└─────────┴─────────┘    ┌─────────┐
┌─────────┬─────────┐    │ Seite 2 │
│ Seite 2 │ Seite 3 │    │ Seite 3 │  ← Spread (Jahrbuch-Mitte)
│ innen L │ innen R │    └─────────┘
└─────────┴─────────┘    ┌─────────┐
                         │ Seite 4 │  ← Rückseite
                         └─────────┘
```

**Wichtig:** Seiten 2 + 3 bilden aufgeklappt den **Jahrbuch-Spread** — dort
sehen Leser:innen alle Kinder der Klasse gleichzeitig wie in einem
US-amerikanischen Yearbook.

### Inhalts-Model (state)

```js
{
  theme: 'default' | 'warm' | 'forest' | 'rose' | 'ocean' | 'plum' | 'sunset' | 'mono',
  fields: { /* flat key → string, für Titel, Kicker, Footer, Grußwort, … */ },
  photos: { hero: dataUrl | null },
  students:  [{ id, name, fach, hobby, beruf, memory, photo }],   // Seiten 2+3
  memories:  [{ id, title, meta, text, photo }],                  // Seite 4
  showers:   [{ id, text, from }]                                 // Seite 4
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

- [x] **Run 1** — CLAUDE.md, Yearbook-Spread-Struktur (Seiten 2+3 =
      Steckbriefe; Seite 4 bekommt Erinnerungen + Warme Duschen + Grußwort).
- [x] **Run 2** — Dynamische Grid-Skalierung bis 30 Kindern, responsive
      Karten-Stile (XL → XXS), deutsche Umlaute überall.
- [x] **Run 3** — Menü-Debug: responsive Toolbar mit Overflow-Menü, echtes
      Farbschema-Modal mit Vorschau, Mobile-Hamburger-Sidebar, Tastatur-
      Shortcuts, Fehlerbehandlung beim Import.
- [x] **Run 4** — Druck-QA, Edge-Cases (leere Listen, sehr lange Namen,
      große Bilder), Accessibility-Pass, finaler UI-Polish.

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

# Abschiedszeitung — Editor

Eine minimalistische, **100 % lokal** laufende Web-App, um für eine 4. Klasse
der Grundschule eine Abschiedszeitung zu gestalten – im A3-Format, gefaltet auf
A4 (4 Seiten). Der innere Doppelspread (Seiten 2 + 3) ist als US-Yearbook
angelegt: alle Kinder auf einen Blick, wenn die Zeitung aufgeklappt wird.

- **Bis 30 Kinder** — das Grid skaliert automatisch (2, 4, 6, 9, 12, 15
  pro Seite) und erzeugt nie halb-leere Seiten.
- Live bearbeiten (alle Texte direkt anklicken und schreiben).
- Bilder per Klick oder Drag & Drop hochladen (automatisch auf max.
  1600 px verkleinert, damit der lokale Speicher reicht).
- 8 sorgfältig kuratierte Farbschemata mit Vorschau-Dialog.
- Steckbriefe, Erinnerungen und „Warme Duschen" beliebig hinzufügen /
  entfernen.
- Responsive Menü (Desktop + Mobile mit Overlay-Sidebar).
- Druck / PDF-Export über den Browser (A3 Querformat, Imposition
  automatisch).
- Projekt als JSON speichern & wieder laden.

## Datenschutz

Die App ist **DSGVO-konform** aufgebaut:

- Keinerlei Backend, keine Analyse, keine Cookies.
- Alle Inhalte (Texte & Bilder) werden ausschließlich im `localStorage`
  des Browsers gespeichert.
- Einzige externe Ressource: Google Fonts (CSS-Request beim Öffnen).
  Wer ganz ohne externe Requests arbeiten möchte, kann die
  `<link>`-Zeile auf Google Fonts in `index.html` entfernen — die App
  greift dann auf System-Schriften zurück.
- Der JSON-Export enthält Bilder als Base64 → nur in vertrauenswürdigen
  Kanälen teilen.

Für die Einwilligung der Erziehungsberechtigten vor dem Druck sollten
alle abgebildeten Kinder vorher eine schriftliche Zustimmung gegeben
haben.

## Nutzung

1. `index.html` im Browser öffnen (Doppelklick reicht — kein Server nötig).
2. Texte direkt anklicken und bearbeiten.
3. Bild-Platzhalter anklicken oder Bild darauf ziehen.
4. In der Sidebar weitere Steckbriefe / Erinnerungen / Zitate anlegen.
5. `Strg+S` (oder Menü ⋮ → „Als JSON speichern") regelmäßig sichern.
6. Oben rechts „Drucken / PDF" → im Druckdialog **A3 Querformat** und
   **Ränder: Keine** wählen.

### Tastatur-Kürzel

| Taste          | Wirkung                                  |
|----------------|------------------------------------------|
| `Strg + S`     | JSON exportieren                         |
| `Strg + P`     | Drucken / PDF                            |
| `Strg + Z`     | Letzte Texteingabe rückgängig (Browser)  |
| `Esc`          | Dialog / Menü / Sidebar schließen        |

## Seiten-Layout (8-seitiges Heft)

Zwei A3-Bögen, jeweils **beidseitig** bedruckt, ineinander gelegt, in
der Mitte gefaltet — ein klassisches Saddle-Stitched-Booklet mit 8
Seiten.

```
Bogen 1 Vorderseite:   [ 8 | 1 ]   ← Rückseite + Titel
Bogen 1 Rückseite:     [ 2 | 7 ]
Bogen 2 Vorderseite:   [ 6 | 3 ]
Bogen 2 Rückseite:     [ 4 | 5 ]   ← Jahrbuch-Spread (Heftmitte)
```

| Seite | Inhalt                                  |
|-------|-----------------------------------------|
| 1     | Cover (Titel + Klassenfoto)             |
| 2     | Grußwort / Brief an die Kinder          |
| 3     | Chronik I (Klasse 1 + 2)                |
| 4     | Jahrbuch-Spread links                   |
| 5     | Jahrbuch-Spread rechts                  |
| 6     | Chronik II (Klasse 3 + 4)               |
| 7     | Warme Duschen                           |
| 8     | Abschieds-Grußwort + Impressum          |

Seiten 4 + 5 sind gemeinsam der Jahrbuch-Spread. Alle Kinder werden
gleichmäßig auf beide Seiten verteilt — wenn man die Zeitung aufklappt,
sieht man sie alle nebeneinander.

### Automatische Grid-Skalierung

| Gesamt  | pro Seite | Spalten × Reihen | Karten-Stil |
|---------|-----------|------------------|-------------|
| 1–4     | 2         | 1 × 2            | XL          |
| 5–8     | 4         | 2 × 2            | L           |
| 9–12    | 6         | 2 × 3            | M           |
| 13–18   | 9         | 3 × 3            | S           |
| 19–24   | 12        | 3 × 4            | XS          |
| 25–30   | 15        | 3 × 5            | XXS         |

Bei dichteren Tiers werden automatisch sekundäre Felder
(Erinnerung / Beruf / Hobby) ausgeblendet, damit die Karten trotz
30 Kindern lesbar bleiben.

## Technik

- Statische Seite (HTML/CSS/Vanilla JS), keine Build-Tools.
- CSS Paged Media (`@page { size: A3 landscape; }`) für den exakten Druck.
- Bilder werden beim Upload auf max. 1600 px skaliert (JPEG Q=0.85).
- Native `<dialog>` für Farbwähler und Hilfe.

## Datei-Struktur

```
index.html         # UI + Seiten-Templates
CLAUDE.md          # Architektur-Notiz für Weiterentwickler
css/app.css        # Toolbar, Sidebar, Modal, Toast (nur Bildschirm)
css/newspaper.css  # Seitenlayout, Karten-Tiers, Themes
css/print.css      # @page + Druck-spezifische Regeln
js/app.js          # Editor-Logik, State, localStorage, Druck-Mirror
```

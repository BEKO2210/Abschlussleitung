# Abschiedszeitung — Editor

Eine minimalistische, **100 % lokal** laufende Web-App, um fuer eine 4. Klasse
der Grundschule eine Abschiedszeitung zu gestalten – im A3-Format, gefaltet auf
A4 (4 Seiten).

- Live bearbeiten (alle Texte direkt anklicken und schreiben)
- Bilder per Klick oder Drag & Drop hochladen (werden automatisch verkleinert)
- Steckbriefe, Erinnerungen und „Warme Duschen" beliebig hinzufuegen/entfernen
- 5 Farbschemata (Default / Warm / Forest / Sunset / Mono)
- Druck / PDF-Export ueber den Browser (A3 Querformat, gefaltet auf A4)
- Projekt als JSON speichern & wieder laden

## Datenschutz

Die App ist **DSGVO-konform** aufgebaut:

- Keinerlei Backend, keine Analyse, keine Cookies.
- Alle Inhalte (Texte & Bilder) werden ausschliesslich im `localStorage` des
  Browsers gespeichert.
- Einzige externe Ressource: Google Fonts (CSS-Request beim Oeffnen). Wer ganz
  ohne externe Requests arbeiten moechte, kann die `<link>`-Zeile auf
  Google Fonts in `index.html` entfernen — die App greift dann automatisch auf
  System-Schriften zurueck.
- Zum Weitergeben eines Entwurfs empfiehlt sich der JSON-Export (Button
  „Speichern (JSON)"). Die Datei enthaelt die Bilder als Base64 — daher nur in
  vertrauenswuerdigen Kanaelen teilen.

Fuer das Einholen der Einwilligung der Erziehungsberechtigten vor dem Druck
sollten alle abgebildeten Kinder/Personen vorher eine schriftliche Zustimmung
gegeben haben.

## Nutzung

1. `index.html` im Browser oeffnen (Doppelklick reicht — kein Server noetig).
2. Texte direkt anklicken und bearbeiten.
3. Bild-Platzhalter anklicken oder Bild darauf ziehen.
4. Ueber die Seitenleiste weitere Steckbriefe/Erinnerungen/Zitate hinzufuegen.
5. Mit „Speichern (JSON)" regelmaessig sichern.
6. Oben rechts „Drucken / PDF" - im Druckdialog A3 Querformat, Raender: Keine.

## Druck / Imposition

Die Zeitung besteht aus zwei A3-Boegen:

- **Bogen 1 (aussen):** links Seite 4 (Rueckseite), rechts Seite 1 (Titel)
- **Bogen 2 (innen):** links Seite 2, rechts Seite 3

Nach dem Falten in der Mitte ergibt sich die korrekte Lesereihenfolge.

## Technik

- Statische Seite (HTML/CSS/Vanilla JS), keine Build-Tools.
- CSS Paged Media (`@page { size: A3 landscape; }`) fuer den exakten Druck.
- Bilder werden beim Upload auf max. 1600 px skaliert (JPEG Q=0.85), um den
  Browser-Speicher nicht zu sprengen.

## Datei-Struktur

```
index.html         # UI + Seiten-Templates
css/app.css        # Toolbar, Sidebar, Editor-Chrome
css/newspaper.css  # Seitenlayout (Benno-Style / Bento-Grid)
css/print.css      # @page-Regeln fuer den Druck
js/app.js          # Editor-Logik + localStorage
```

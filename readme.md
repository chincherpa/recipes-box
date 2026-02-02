# Recipes Box

Eine Web-Anwendung zur Verwaltung und Darstellung von Rezepten mit TypeScript/React.

## Projektstruktur

```
recipes-box/
├── .claude/              # Claude AI Konfiguration
├── website/              # Web-Anwendung (TypeScript/React)
├── rezepte.csv          # Rezeptdaten
├── categories.json      # Kategoriendefinitionen
└── .gitignore
```

## Features

- Rezeptverwaltung mit kategorischer Organisation
- TypeScript-basierte Web-Anwendung
- Datenimport aus CSV-Dateien
- Kategorisierung von Rezepten

## Installation

```bash
# Repository klonen
git clone https://github.com/chincherpa/recipes-box.git
cd recipes-box

# In das website-Verzeichnis wechseln
cd website

# Dependencies installieren
npm install
```

## Entwicklung

```bash
# Entwicklungsserver starten
npm run dev

# Projekt bauen
npm run build

# Tests ausführen
npm test
```

## Datenstruktur

### rezepte.csv
Die CSV-Datei enthält die Rezeptdaten mit folgenden Informationen:
- Rezeptname
- Zutaten
- Zubereitung
- Kategoriezuordnung
- Weitere Metadaten

### categories.json
JSON-Datei mit der Definition der Rezeptkategorien und deren Eigenschaften.

## Technologie-Stack

- **Frontend**: TypeScript, React
- **Datenformat**: CSV, JSON
- **Build-Tool**: (basierend auf package.json im website-Ordner)

## Lizenz

Nicht angegeben

## Autor

[chincherpa](https://github.com/chincherpa)
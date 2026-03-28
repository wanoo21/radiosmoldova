# Radio Moldova, Romania si Ucraina

Extensie Google Chrome (Manifest V3) pentru ascultarea online a posturilor radio din:

- Moldova (`md`)
- Romania (`ro`)
- Ucraina (`ua`)

Aplicatia ofera player rapid in popup, cautare live, favorite, control de volum si persistenta setarilor.

## Ce este nou

- Migrare completa la **Manifest V3**
- Arhitectura noua:
  - `service worker` (`src/sw/background.js`)
  - `offscreen document` pentru playback (`src/offscreen/*`)
  - popup modern (`src/popup/*`)
- Suport i18n prin `_locales`:
  - engleza (`en`)
  - romana (`ro`)
  - ucraineana (`uk`)
- Surse de statii gestionate in:
  - `data/radiolist-md.json`
  - `data/radiolist-ro.json`
  - `data/radiolist-ua.json`

## Development

### Build pentru load unpacked (Chrome)

```bash
npm run build:dist
```

Rezultatul este in folderul `dist/`.

### Build pentru Edge / Opera

```bash
npm run build:dist:edge
npm run build:dist:opera
```

Rezultatele sunt in:

- `dist-edge/`
- `dist-opera/`

### Build toate target-urile

```bash
npm run build:all
```

Genereaza toate folderele de distributie: `dist/`, `dist-edge/`, `dist-opera/`.

### Build ZIP pentru publish

```bash
npm run build:zip
npm run build:zip:edge
npm run build:zip:opera
```

Sau totul dintr-o comanda:

```bash
npm run build:zip:all
```

Arhive generate:

- `radio-mru-v<versiune>.zip`
- `radio-mru-edge-v<versiune>.zip`
- `radio-mru-opera-v<versiune>.zip`

## Management statii

### Refresh statii dezactivate (dry-run)

```bash
npm run stations:refresh
```

### Aplicare refresh statii dezactivate

```bash
npm run stations:refresh:apply
```

### Adaugare statii noi (dry-run)

```bash
npm run stations:add
```

### Adaugare statii noi (apply)

```bash
npm run stations:add:apply
```

Poti limita pe tara cu `--only=md`, `--only=ro`, `--only=ua` si numarul de propuneri cu `--max-new=10`.

## Instalare locala

1. Ruleaza `npm run build:dist`
2. Deschide `chrome://extensions`
3. Activeaza **Developer mode**
4. Click pe **Load unpacked**
5. Selecteaza folderul `dist/`

### Instalare locala Edge / Opera

- Edge: `edge://extensions` + load din `dist-edge/`
- Opera: `opera://extensions` + load din `dist-opera/`

## Feedback

Propuneri si bug-uri: [GitHub Issues](https://github.com/wanoo21/radiosmoldova/issues)

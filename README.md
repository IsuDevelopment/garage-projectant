This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
npm run dev      # dev server → http://localhost:3000
npm run build    # production build
npm run start    # serve production build

npm run db:push   # sync schema to DB
npm run db:seed   # seed admin user + master features
npm run db:studio # Prisma Studio GUI → http://localhost:5555
```

---

## System kolorów

Kolory w konfiguratorze pochodzą z globalnej palety definiowanej w `src/config/default-settings.json` (lub przez API dla klientów). Każdy element (ściany, dach, brama, rynny) czyta tę samą paletę z `SettingsContext`.

### Struktura konfiguracji

```json
"colors": {
  "allowCustomColor": true,
  "set": [
    {
      "name": "Galwanizowana",
      "color": "#c0c8d0"
    },
    {
      "name": "Tylko dla trapezu",
      "color": "#8b7355",
      "textures": ["trapez"]
    }
  ]
}
```

### Pola

| Pole | Typ | Opis |
|---|---|---|
| `colors.set` | `ColorPreset[]` | Lista presetów kolorów dostępnych w konfiguratorze |
| `colors.set[].name` | `string` | Wyświetlana nazwa (tooltip) |
| `colors.set[].color` | `string` | Kolor w formacie hex |
| `colors.set[].textures` | `MaterialType[]` | Opcjonalna lista materiałów — kolor pojawia się tylko gdy aktywny materiał pasuje. Pominięcie lub `[]` = widoczny dla wszystkich |
| `colors.allowCustomColor` | `boolean` | Czy użytkownik może wybrać dowolny kolor poza paletą (kółko z kreskowaną obwódką) |

### Przepływ danych

```
default-settings.json (lub GET /api/settings?apiKey=xxx)
  └─ SettingsContext (React context)
       └─ ColorPicker (src/shared/components/ColorPicker.tsx)
            ├─ MaterialPicker (ściany, dach)
            ├─ GatesPanel (kolor per brama)
            └─ GutterPanel (kolor rynien)
```

### Filtrowanie po materiale

Preset z `"textures": ["trapez", "blachodachowka"]` pojawi się w pickerze tylko wtedy gdy aktywny typ materiału to `trapez` lub `blachodachowka`. Pozwala to na konfigurację palet per linia produktowa — np. inne kolory dla blachodachówki dachowej niż dla rąbka.

### Konfiguracja per klient (super admin)

W przyszłości paleta będzie edytowalna przez super admina w panelu `/admin/clients/[id]` jako feature `colors_custom_palette`. Na razie wszyscy klienci dziedziczą `default-settings.json` lub paletę przypisaną przez API.

---

## System materiałów (feature-based)

Materiały są pełnymi feature'ami konfiguracyjnymi i są definiowane w `src/config/default-settings.json` pod kluczem `materials`.

### Struktura materiału

```json
{
  "slug": "trapez",
  "name": "Blacha trapezowa",
  "texture": "/textures/trapez.png",
  "defaultColor": "#c0c8d0",
  "appliesTo": ["walls", "roof", "gates"],
  "allowedSlopes": ["double", "right"],
  "isPremium": false,
  "allowColors": true,
  "colorSet": [{ "name": "Antracyt", "color": "#4a4a4a" }],
  "subFeatures": [
    {
      "slug": "orientation",
      "name": "Kierunek przetłoczeń",
      "type": "select",
      "options": [
        { "value": "vertical", "label": "Pion" },
        { "value": "horizontal", "label": "Poziom" }
      ],
      "default": "vertical"
    }
  ],
  "price": 0
}
```

### Zasady

| Pole | Opis |
|---|---|
| `appliesTo` | Określa, dla jakiego elementu materiał jest dostępny (`walls`, `roof`, `gates`) |
| `allowedSlopes` | Ogranicza materiał dachowy do konkretnych typów spadku |
| `colorSet` | Nadpisuje globalną paletę kolorów dla danego materiału |
| `allowColors` | `false` wymusza `defaultColor` |
| `isPremium` | UI pokazuje badge Premium |
| `subFeatures` | Rozszerzalne sub-opcje materiału (select/slider) |

### Filtrowanie per klient

W `buildClientSettings` lista `materials` jest filtrowana na podstawie feature key `material_{slug}` (np. `material_trapez`).

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Prisma](https://www.prisma.io/docs)


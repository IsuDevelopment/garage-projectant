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

## Ustawienia otoczenia sceny 3D

Wygląd nieba, kolor tła, pozycje chmur i rozkład drzew są definiowane w `src/config/default-settings.json` pod kluczem `visual`.

### Struktura konfiguracji

```json
"visual": {
  "backgroundColor": "#8fd8ff",
  "sky": {
    "radius": 280,
    "topColor": "#2f8fe8",
    "midColor": "#6fc4ff",
    "horizonColor": "#bfe8ff"
  },
  "clouds": [
    {
      "seed": 1,
      "bounds": [8, 2, 4],
      "volume": 14,
      "color": "#f0f0f0",
      "opacity": 0.6,
      "speed": 0.08,
      "position": [15, 12, -45]
    }
  ],
  "trees": [
    { "type": "conifer", "position": [-10, 0, -9], "scale": 1 },
    { "type": "deciduous", "position": [13, 0, 10], "crownColor": "#55B040" }
  ]
}
```

### Pola

| Pole | Typ | Opis |
|---|---|---|
| `visual.backgroundColor` | `string` | Kolor czyszczenia canvasa i fallback za kopułą nieba |
| `visual.sky.radius` | `number` | Rozmiar kopuły gradientowego nieba |
| `visual.sky.topColor` | `string` | Kolor zenitu |
| `visual.sky.midColor` | `string` | Kolor przejściowy w środkowej strefie |
| `visual.sky.horizonColor` | `string` | Kolor przy horyzoncie |
| `visual.clouds[]` | `CloudVisualConfig[]` | Lista sztucznych chmur w tle |
| `visual.trees[]` | `TreeVisualConfig[]` | Lista drzew do renderowania wokół garażu |

### Zasada działania

`GarageScene` czyta `settings.visual` z aktualnych ustawień klienta. Jeśli API nie zwróci jeszcze sekcji `visual`, scena użyje fallbacku z `DEFAULT_SETTINGS`, więc starsze payloady dalej działają bez zmian.

---

## Uslugi dodatkowe

Dodatkowe uslugi sa konfigurowane przez JSON pod kluczem `additionalFeatures`.

Sekcja `Uslugi dodatkowe` w sidebarze wyswietla sie tylko wtedy, gdy tablica zawiera co najmniej jeden feature z `enabled: true`.

### Struktura konfiguracji

```json
"additionalFeatures": [
  {
    "slug": "anchoring",
    "name": "Kotwiczenie",
    "enabled": true,
    "price": 0,
    "description": "Krotki opis pod opcja.",
    "details": "Dlugi opis wyswietlany w popupie po kliknieciu 'Poznaj szczegoly'.",
    "options": [
      {
        "slug": "concrete-slab",
        "name": "Wylewka betonowa",
        "price": 0,
        "info": "Tekst pod selectem po wyborze opcji.",
        "allowColor": false,
        "defaultColor": "#9ca3af"
      },
      {
        "slug": "concrete-foundation",
        "name": "Beton fundamentowy",
        "price": 0,
        "info": "Wizualizacja pogladowa...",
        "allowColor": false,
        "defaultColor": "#7b838e"
      },
      {
        "slug": "footings",
        "name": "Stopy betonowe",
        "price": 0,
        "info": "Wizualizacja pogladowa...",
        "allowColor": false,
        "defaultColor": "#8f969f",
        "spacingMin": 1.5,
        "spacingMax": 2.0
      }
    ]
  }
]
```

### Zachowanie 3D dla opcji `anchoring`

| Opcja | Render 3D |
|---|---|
| `concrete-slab` | Plyta pod garazem: szerokosc i glebokosc + 10 cm, wysokosc 10 cm |
| `concrete-foundation` | Jak wyzej, ale zwykle ciemniejszy kolor |
| `footings` | Plyty 40x40x10 cm wokol obrysu: rogi + rowny rozstaw co ok. 1.5-2.0 m (konfigurowalne przez `spacingMin`/`spacingMax`) |

Wszystkie elementy korzystaja z lekkiej, proceduralnej tekstury chropowatego betonu.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Prisma](https://www.prisma.io/docs)


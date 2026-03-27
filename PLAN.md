# 3D Garage Configurator — Plan Architektoniczny

## 1. Przegląd Projektu

Aplikacja webowa pozwalająca użytkownikowi skonfigurować garaż blaszany w 3D:
- podgląd modelu 3D z interaktywną kamerą (orbita, zoom, ograniczenia kolizji)
- konfiguracja dachu, wymiarów, bram, materiałów i konstrukcji
- system sprite'ów (tekstur) nakładanych na elementy modelu
- architektura przygotowana na panel admina, panel firmy (multi-tenant), subskrypcje

---

## 2. Rekomendacja Technologii

### Frontend (Konfigurator)

| Warstwa | Technologia | Dlaczego |
|---|---|---|
| **Framework** | **React 19 + Next.js 15 (App Router)** | SSR/SSG dla SEO landing pages, API routes dla przyszłego backendu, doskonały ekosystem |
| **3D Engine** | **React Three Fiber (R3F)** + **Three.js** | Deklaratywne 3D w React — komponenty zamiast imperatywnego kodu. Największy ekosystem: `@react-three/drei` (kontrolki kamery, helpers), `@react-three/postprocessing` |
| **Kontrola kamery** | **drei `<OrbitControls>`** z `minDistance`, `maxDistance`, `minPolarAngle`, `maxPolarAngle` | Natywne zabezpieczenie przed wpadaniem kamery w budynek |
| **Stan globalny** | **Zustand** | Lekki, idealny do stanu konfiguracji. Łatwy do serializacji (zapis/odczyt konfiguracji) |
| **UI Panelu** | **Tailwind CSS 4** + **shadcn/ui** | Modułowe, dostępne komponenty. Slidery, radio groups, color pickers out-of-the-box |
| **Formularze/Walidacja** | **React Hook Form** + **Zod** | Walidacja min/max wymiarów, walidacja czy brama się mieści |
| **Ikony** | **Lucide React** | Lekkie, spójne |
| **Bundler** | **Turbopack** (via Next.js) | Szybki dev, HMR |

### Przyszły Backend (faza 2+)

| Warstwa | Technologia | Dlaczego |
|---|---|---|
| **API** | **Next.js API Routes** lub **tRPC** | Type-safe API, współdzielone typy z frontem |
| **Baza danych** | **PostgreSQL** + **Prisma ORM** | Relacyjne dane (firmy, plany, konfiguracje, sprite'y) |
| **Auth** | **NextAuth.js / Auth.js** lub **Clerk** | Multi-tenant auth, role (admin/firma/user) |
| **Storage (sprite'y)** | **S3-compatible** (AWS S3 / Cloudflare R2) | Upload custom sprite'ów per firma |
| **Payments** | **Stripe** | Subskrypcje per firma |

### Alternatywy rozważone

| Opcja | Verdict |
|---|---|
| **Babylon.js** | Potężny, ale cięższy. R3F lepiej integruje się z React i ma większą społeczność w segmencie konfiguratorów |
| **Vue + TresJS** | TresJS dojrzewa, ale ekosystem mniejszy niż R3F. React ma więcej gotowych komponentów UI |
| **Pure Three.js** (bez R3F) | Więcej boilerplate'u, trudniejsze utrzymanie. R3F daje deklaratywność React |
| **Svelte + Threlte** | Dobry DX, ale mniejszy ekosystem gotowych komponentów 3D |

---

## 3. Architektura Aplikacji

```
src/
├── app/                          # Next.js App Router
│   ├── (configurator)/           # Grupa tras konfiguratora
│   │   ├── page.tsx              # Strona główna konfiguratora
│   │   └── layout.tsx
│   ├── (admin)/                  # [Faza 2] Panel admina
│   ├── (company)/                # [Faza 2] Panel firmy
│   └── api/                      # [Faza 2] API routes
│
├── features/                     # Feature-based modules
│   ├── garage/                   # Główny moduł garażu
│   │   ├── components/
│   │   │   ├── GarageScene.tsx       # Główna scena 3D (Canvas + kamera + światła)
│   │   │   ├── GarageModel.tsx       # Komponent modelu garażu (mesh + geometria)
│   │   │   ├── WallSegment.tsx       # Segment ściany z sprite material
│   │   │   ├── RoofSegment.tsx       # Segment dachu (zmiana geometrii wg typu spadku)
│   │   │   └── FloorPlane.tsx        # Podłoże/cień
│   │   ├── hooks/
│   │   │   ├── useGarageGeometry.ts  # Oblicza geometrię na podstawie wymiarów + typu dachu
│   │   │   └── useGarageMaterials.ts # Zarządza materiałami/sprite'ami
│   │   └── utils/
│   │       └── geometry.ts           # Funkcje pomocnicze geometrii
│   │
│   ├── roof/                     # Moduł dachu
│   │   ├── components/
│   │   │   └── RoofConfigurator.tsx  # Panel UI konfiguracji dachu
│   │   ├── types.ts                  # RoofSlopeType, RoofMaterialType
│   │   └── constants.ts             # Dostępne opcje spadów
│   │
│   ├── dimensions/               # Moduł wymiarów
│   │   ├── components/
│   │   │   └── DimensionsPanel.tsx   # Slidery wymiarów
│   │   └── types.ts                  # DimensionConfig (min/max/step/default)
│   │
│   ├── gate/                     # Moduł bramy
│   │   ├── components/
│   │   │   ├── GateConfigurator.tsx  # Panel dodawania/edycji bram
│   │   │   ├── GateModel.tsx         # Model 3D bramy
│   │   │   └── GateEditor.tsx        # Edytor pojedynczej bramy (po kliknięciu)
│   │   ├── hooks/
│   │   │   └── useGateValidation.ts  # Sprawdza czy brama się mieści
│   │   └── types.ts                  # GateType, GateConfig
│   │
│   ├── construction/             # Moduł konstrukcji
│   │   ├── components/
│   │   │   └── ConstructionPanel.tsx # Panel profili, ocynku
│   │   └── types.ts
│   │
│   └── materials/                # Moduł materiałów (sprite system)
│       ├── components/
│       │   ├── MaterialPicker.tsx    # Reusable picker materiału (trapez/blachodachówka/rąbek)
│       │   └── ColorPicker.tsx       # Picker koloru (tintuje sprite)
│       ├── hooks/
│       │   └── useMaterialTexture.ts # Ładuje i cache'uje tekstury sprite'ów
│       ├── textures/                 # Pliki sprite'ów (statyczne, default)
│       │   ├── trapez.png
│       │   ├── blachodachowka.png
│       │   └── rabek.png
│       ├── types.ts                  # MaterialType, MaterialConfig
│       └── constants.ts             # DEFAULT_MATERIAL, dostępne materiały
│
├── store/                        # Zustand stores
│   ├── useConfigStore.ts         # Główny store konfiguracji garażu
│   ├── useUIStore.ts             # Stan UI (aktywny panel, selected gate, etc.)
│   └── types.ts                  # GarageConfig (pełny typ konfiguracji)
│
├── shared/                       # Współdzielone moduły
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── Slider.tsx            # Wrapper slider z min/max/label
│   │   └── RadioGroup.tsx        # Wrapper radio z ikonami
│   ├── hooks/
│   │   └── useConfigLimits.ts    # [Faza 2] Pobiera limity z API (per konfigurator/firma)
│   └── types/
│       └── config-schema.ts      # Zod schema całej konfiguracji
│
└── config/                       # Ustawienia konfiguratora
    ├── defaults.ts               # Domyślne wartości
    └── limits.ts                 # Min/max/opcje (w przyszłości z API)
```

---

## 4. Model Danych — Stan Konfiguracji (Zustand)

```typescript
// store/types.ts

type MaterialType = 'trapez' | 'blachodachowka' | 'rabek';

type RoofSlopeType = 'right' | 'left' | 'back' | 'front' | 'double';

type GateType = 'tilt' | 'double-wing'; // rozszerzalne: | 'single-wing' | ...

type ProfileType = '30x30' | '30x40';

type OpenDirection = 'left' | 'right';

interface MaterialConfig {
  type: MaterialType;
  color: string;           // hex, nakładany jako tint na sprite
  customSpriteUrl?: string; // [Faza 2] custom sprite per firma
}

interface DimensionLimits {
  min: number;
  max: number;
  step: number;
  default: number;
}

interface GateConfig {
  id: string;
  type: GateType;
  width: number;
  height: number;
  positionX: number;       // pozycja na froncie (od lewej)
  wall: 'front' | 'back' | 'left' | 'right'; // domyślnie 'front'
  material: MaterialConfig | null;  // null = użyj globalnego
  openDirection: OpenDirection;
}

interface RoofConfig {
  slopeType: RoofSlopeType;
  material: MaterialConfig | null;  // null = użyj globalnego
}

interface ConstructionConfig {
  material: MaterialConfig;          // Globalny materiał — domyślnie stosowany wszędzie
  profileType: ProfileType;
  galvanized: boolean;               // ocynk
}

interface GarageConfig {
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  roof: RoofConfig;
  gates: GateConfig[];
  construction: ConstructionConfig;
}
```

### Logika dziedziczenia materiału

```
Skuteczny materiał elementu = element.material ?? construction.material (globalny)
```

Każdy element (dach, brama, ściana) może mieć `material: null` — wtedy używa `construction.material`. Gdy user jawnie wybierze materiał per element, nadpisuje globalny.

---

## 5. Scena 3D — Szczegóły Implementacji

### 5.1 Kamera (OrbitControls)

```tsx
<OrbitControls
  minDistance={5}          // nie bliżej niż 5 jednostek
  maxDistance={30}         // nie dalej niż 30
  minPolarAngle={0.2}     // nie patrz z dołu
  maxPolarAngle={Math.PI / 2 - 0.05}  // nie niżej niż horyzont
  enablePan={true}
  panSpeed={0.5}
  target={[0, garageHeight / 2, 0]}  // środek garażu
  maxTargetRadius={5}     // ogranicza pan żeby nie oddalić się od garażu
/>
```

**Zabezpieczenia kamery:**
- `minDistance` — kamera nie wpadnie w budynek
- `maxPolarAngle` < π/2 — kamera nie zejdzie pod podłogę
- `maxTargetRadius` — ogranicza pan, kamera zawsze "patrzy" na garaż
- Opcjonalnie: clipping plane na near=0.1 żeby nie renderować wnętrza

### 5.2 Model Garażu (Geometria Proceduralna)

Model garażu **NIE będzie importowanym .glb/.obj** — będzie generowany proceduralnie z parametrów:

```
Garaż = Podłoga + Ściany (4) + Dach (zależny od slopeType) + Bramy (N)
```

Każdy element to `<mesh>` z `BufferGeometry` obliczoną na podstawie wymiarów.

**Dlaczego proceduralnie?**
- Wymiary zmieniają się dynamicznie (slidery)
- Typ dachu zmienia geometrię
- Bramy tworzą otwory w ścianach
- Tekstury muszą się powtarzać (tile) proporcjonalnie do rozmiaru

### 5.3 System Sprite'ów / Tekstur

```tsx
// Sprite = powtarzalna tekstura materiału (trapez, blachodachówka, rąbek)

function useSpriteMaterial(config: MaterialConfig) {
  const texture = useTexture(`/textures/${config.type}.png`);
  
  // Repeat proporcjonalny do rozmiaru elementu
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  
  return (
    <meshStandardMaterial
      map={texture}
      color={config.color}  // tint — nakłada kolor na teksturę
    />
  );
}
```

**Kolor** — działanie: `MeshStandardMaterial.color` mnoży się z teksturą. Biała tekstura + kolor = pełny kolor. Szara tekstura + kolor = przyciemniony kolor z zachowaniem wzoru sprite'a.

### 5.4 Typy Dachu (Geometria)

```
Prawy (right):     Spadek w prawo (cała powierzchnia, jedno nachylenie → prawy bok niżej)
Lewy (left):       Spadek w lewo
Tylni (back):      Spadek do tyłu
Przedni (front):   Spadek do przodu
Podwójny (double): Klasyczny dwuspadowy (kalenica na środku, jak na załączonym zdjęciu)
```

Każdy typ to inna funkcja generująca wierzchołki dachu na podstawie `width`, `depth`, `height`, `roofPitch`.

### 5.5 System Bram

```
1. User kliknie "Dodaj bramę" → nowa GateConfig z default width/height
2. Brama pojawia się na froncie garażu
3. User klika na bramę w 3D (raycasting) → otwiera się edytor tej bramy
4. Walidacja: suma szerokości bram + marginesy ≤ szerokość garażu
5. Bramy tworzą "otwory" w ścianie frontowej (CSG subtract lub osobne segmenty ściany)
```

**Wizualnie:**
- Brama to osobny mesh nałożony na ścianę
- Typ bramy zmienia geometrię (uchylna = jeden panel, dwuskrzydłowa = dwa panele z podziałem)
- Materiał bramy = `gate.material ?? construction.material`

---

## 6. Layout UI

```
┌─────────────────────────────────────────────────────┐
│  Logo / Nazwa Konfiguratora                   [CTA] │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   PANEL              │     WIDOK 3D                 │
│   KONFIGURACJI       │     (React Three Fiber)      │
│                      │                              │
│   ┌──────────────┐   │     ┌──────────────────┐     │
│   │ 📐 Wymiary   │   │     │                  │     │
│   │ Szer: ═══●══ │   │     │    [Garaż 3D]    │     │
│   │ Wys:  ══●═══ │   │     │                  │     │
│   │ Głęb: ═══●══ │   │     │                  │     │
│   └──────────────┘   │     └──────────────────┘     │
│                      │                              │
│   ┌──────────────┐   │     Orbita: drag             │
│   │ 🏠 Dach      │   │     Zoom: scroll             │
│   │ ○ Prawy      │   │                              │
│   │ ○ Lewy       │   │                              │
│   │ ● Podwójny   │   │                              │
│   │              │   │                              │
│   │ Materiał:    │   │                              │
│   │ [Trapez ▾]   │   │                              │
│   └──────────────┘   │                              │
│                      │                              │
│   ┌──────────────┐   │                              │
│   │ 🚪 Bramy     │   │                              │
│   │ + Dodaj      │   │                              │
│   │ [Brama 1] ✏️  │   │                              │
│   │ [Brama 2] ✏️  │   │                              │
│   └──────────────┘   │                              │
│                      │                              │
│   ┌──────────────┐   │                              │
│   │ 🔧 Konstrukcja│  │                              │
│   │ Materiał:    │   │                              │
│   │ [Trapez ▾]   │   │                              │
│   │ Profil:      │   │                              │
│   │ ○ 30x30      │   │                              │
│   │ ● 30x40      │   │                              │
│   │ □ Ocynk      │   │                              │
│   └──────────────┘   │                              │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│  [Podsumowanie konfiguracji]         [Zapytaj o ▶]  │
└─────────────────────────────────────────────────────┘
```

- Lewy panel: scrollowalny, sekcje zwijane (accordion)
- Prawy panel: Canvas 3D, zajmuje resztę ekranu
- Na mobile: panel przesuwa się jako bottom sheet / drawer
- Kliknięcie bramy w 3D → podświetlenie + otwarcie edytora bramy w panelu

---

## 7. System Konfiguracji (przyszłościowy)

Cały konfigurator jest sterowany obiektem `ConfiguratorSettings`:

```typescript
// config/limits.ts — teraz hardcode, w Fazie 2 z API

interface ConfiguratorSettings {
  id: string;
  companyId?: string;            // [Faza 2] per firma
  
  dimensions: {
    width:  DimensionLimits;     // { min: 3, max: 12, step: 0.1, default: 6 }
    height: DimensionLimits;     // { min: 2, max: 4.5, step: 0.1, default: 2.5 }
    depth:  DimensionLimits;     // { min: 3, max: 15, step: 0.1, default: 6 }
  };
  
  availableMaterials: MaterialType[];    // ['trapez', 'blachodachowka', 'rabek']
  availableRoofSlopes: RoofSlopeType[];  // ['right','left','back','front','double']
  availableGateTypes: GateType[];        // ['tilt', 'double-wing']
  availableProfiles: ProfileType[];      // ['30x30', '30x40']
  
  gate: {
    width:  DimensionLimits;
    height: DimensionLimits;
    maxCount: number;
  };
  
  customSprites?: {              // [Faza 2] custom sprite'y per firma
    [key: string]: {
      name: string;
      url: string;
    };
  };
}
```

W Fazie 1: `ConfiguratorSettings` jest plikiem statycznym.  
W Fazie 2: pobierany z API na podstawie `companyId` → firmy mogą mieć różne limity.

---

## 8. Fazy Realizacji

### Faza 1 — MVP Konfiguratora (Frontend)

| Krok | Opis | Priorytet |
|------|------|-----------|
| 1.1 | Setup: Next.js + R3F + Zustand + Tailwind + shadcn/ui | 🔴 |
| 1.2 | Scena 3D: prostopadłościan garażu + OrbitControls z limitami | 🔴 |
| 1.3 | Wymiary: slidery zmieniające geometrię w real-time | 🔴 |
| 1.4 | Materiały: system sprite'ów, ładowanie tekstur, tintowanie kolorem | 🔴 |
| 1.5 | Dach: 5 typów spadku, zmiana geometrii | 🔴 |
| 1.6 | Bramy: dodawanie/usuwanie, walidacja szerokości, typy (uchylna/dwuskrzydłowa) | 🔴 |
| 1.7 | Konstrukcja: globalny materiał, profile, ocynk | 🔴 |
| 1.8 | Interakcja z bramami: kliknięcie → edycja, highlight | 🟡 |
| 1.9 | Mobile layout (bottom sheet) | 🟡 |
| 1.10 | Oświetlenie + cienie + environment (HDRI) | 🟡 |
| 1.11 | Export/Zapis konfiguracji (JSON / URL params) | 🟢 |

### Faza 2 — Backend + Multi-tenant

| Krok | Opis |
|------|------|
| 2.1 | PostgreSQL + Prisma — modele: Company, User, Configuration, Sprite |
| 2.2 | Auth (NextAuth/Clerk) — role: admin, company, user |
| 2.3 | API: CRUD konfiguracji, upload sprite'ów |
| 2.4 | Panel firmy: zarządzanie ustawieniami konfiguratora, custom sprite'y |
| 2.5 | Subskrypcje (Stripe) — feature flags per plan |

### Faza 3 — Rozszerzenia

| Krok | Opis |
|------|------|
| 3.1 | Nadpisywanie materiału per element (dach, brama, ściana osobno) |
| 3.2 | Więcej typów bram (1-skrzydłowa, roletowa, ...) |
| 3.3 | Dodatkowe elementy: okna, rynny, drzwi serwisowe |
| 3.4 | Generator PDF z ofertą |
| 3.5 | Panel admina (super-admin: zarządzanie firmami, planami) |

---

## 9. Kluczowe Decyzje Architektoniczne

### Proceduralny model vs importowany .glb

**Decyzja: Proceduralny (BufferGeometry)**

✅ Wymiary zmieniają się płynnie (slider → natychmiastowa zmiana geometrii)  
✅ Typ dachu zmienia kształt — łatwo warunkowo generować wierzchołki  
✅ Bramy = otwory w ścianie — łatwiej wycinać segmenty niż modyfikować .glb  
✅ Sprite tile'uje się proporcjonalnie do rozmiaru elementu  
❌ Trudniej osiągnąć fotorealistyczny wygląd (ale to nie cel — cel to konfiguracja)

### Zustand vs Redux vs Context

**Decyzja: Zustand**

✅ Minimalny boilerplate  
✅ `subscribe` — R3F może reagować bez re-renderów React  
✅ Łatwa serializacja stanu (JSON export)  
✅ Middleware: `persist` (localStorage), `devtools`

### Walidacja bram — podejście

```typescript
function canAddGate(garage: GarageConfig, newGate: GateConfig): boolean {
  const wallWidth = garage.dimensions.width; // lub depth, zależnie od gate.wall
  const existingGatesOnWall = garage.gates.filter(g => g.wall === newGate.wall);
  const totalGateWidth = existingGatesOnWall.reduce((sum, g) => sum + g.width, 0);
  const margin = 0.3; // minimalny margines między bramami i krawędziami
  const requiredSpace = newGate.width + margin * (existingGatesOnWall.length + 2);
  
  return (totalGateWidth + requiredSpace) <= wallWidth;
}
```

---

## 10. Przykładowy Przepływ Użytkownika

```
1. User otwiera konfigurator → widzi garaż 3D (domyślny: 6x2.5x6m, dach podwójny, trapez)
2. Obraca kamerą (drag), przybliża (scroll)
3. W panelu "Wymiary" przesuwa slider szerokości z 6m na 8m → garaż się rozciąga w real-time
4. W panelu "Dach" wybiera "Prawy" → dach zmienia geometrię na jednospadowy w prawo
5. W panelu "Konstrukcja" zmienia materiał na "Blachodachówka" → cały garaż zmienia teksturę
6. W panelu "Bramy" kliknie "+ Dodaj bramę" → pojawia się brama na froncie
7. Klika na bramę w 3D → podświetla się, otwiera edytor
8. Zmienia typ na "Dwuskrzydłowa", rozmiar 3x2.2m, kolor RAL 8017
9. Dodaje drugą bramę → system sprawdza czy się mieści (8m front - 3m brama1 - marginesy)
10. W panelu "Dach" wybiera inny materiał niż globalny → dach ma inną teksturę niż ściany
11. Klika "Zapytaj o cenę" → konfiguracja serializowana (JSON/URL) → formularz kontaktowy
```

---

## 11. Zależności (package.json orientacyjny)

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@react-three/fiber": "^9.x",
    "@react-three/drei": "^10.x",
    "three": "^0.172.x",
    "zustand": "^5.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "tailwindcss": "^4.x",
    "lucide-react": "^0.x",
    "uuid": "^11.x"
  },
  "devDependencies": {
    "@types/three": "^0.172.x",
    "typescript": "^5.x",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

---

## 12. Podsumowanie

| Aspekt | Rozwiązanie |
|--------|------------|
| 3D Engine | React Three Fiber + Three.js |
| Model garażu | Proceduralna geometria (nie .glb) |
| Tekstury | Sprite system z tile + color tint |
| Kamera | OrbitControls z min/max distance/angle |
| Stan | Zustand z typami TypeScript |
| UI | Tailwind + shadcn/ui (accordion, slider, radio) |
| Walidacja | Zod schema + custom hooks (bramy, wymiary) |
| Konfigurowalność | `ConfiguratorSettings` — static → API (Faza 2) |
| Multi-tenant | Przygotowana architektura (companyId, customSprites) |
| Responsywność | Desktop: side panel + 3D | Mobile: bottom sheet + 3D |

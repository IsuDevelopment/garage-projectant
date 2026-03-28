---
name: wall-objects
description: >
  Adding, editing, or debugging objects placed on garage walls
  (gates, windows, doors, etc.) in the 3D garage configurator.
  Use this skill for any task that touches wall-object positioning,
  collision detection, wall selectors, or dimension-change validation.
applyTo: >
  **/gate/**,
  **/GatesPanel*,
  **/GateModel*,
  **/wallCollision*,
  **/CollisionDialog*,
  **/DimensionsPanel*
---

# Skill: Wall-Placed Objects (gates, windows, doors …)

Use this skill whenever you are:
- Adding a new type of object that sits on a garage wall (window, door, vent, …)
- Editing gate/position/wall logic
- Debugging collision or boundary issues between wall objects
- Connecting dimension changes to object validation

---

## Architecture Overview

```
src/store/wallCollision.ts      ← single source of truth for all collision math (pure functions)
src/store/useConfigStore.ts     ← consumes wallCollision; dimension setters trigger collision check
src/store/useUIStore.ts         ← collisionDialog state (open, pendingDimensions, conflicts[])
src/shared/components/
  CollisionDialog.tsx           ← modal shown on dimension collision
src/features/gate/
  components/GateModel.tsx      ← reads gate.positionX + gate.wall → 3D world position
  components/GatesPanel.tsx     ← wall selector + position slider + width/height sliders
```

---

## Core Data Contract: `WallObjectBounds`

Every object on a wall must be representable as:

```ts
interface WallObjectBounds {
  id:        string;
  positionX: number;  // metres from the LEFT edge of that wall (0 = wall start)
  width:     number;  // metres along the wall
  height:    number;  // metres vertical (from floor)
  wall:      WallSide; // 'front' | 'back' | 'left' | 'right'
}
```

`positionX` is always measured from the **left edge** of the wall when viewed from outside, regardless of which wall it is. The `wallTransform` function in `GateModel.tsx` converts this to correct 3D world coordinates + rotation per wall side.

---

## Coordinate System

- Garage is **centred at the world origin** (0, 0, 0).
- `width` is the X axis (front/back wall span).
- `depth` is the Z axis (left/right wall span).
- `height` is the Y axis (wall height, not including roof peak).
- Objects sit at `y = object.height / 2` (vertical centre from floor).

Wall reference positions:
| wall   | fixed axis | value          | span axis |
|--------|-----------|----------------|-----------|
| front  | Z         | `+depth / 2`   | X (width) |
| back   | Z         | `−depth / 2`   | X (width) |
| left   | X         | `−width / 2`   | Z (depth) |
| right  | X         | `+width / 2`   | Z (depth) |

`wallWidthForSide(dimensions, wall)` returns the correct span for any wall:
```ts
// front | back → config.dimensions.width
// left  | right → config.dimensions.depth
```

---

## Collision Constants

Defined in `src/store/wallCollision.ts` — **never repeat these inline**:

```ts
SIDE_MARGIN = 0.3  // min gap from wall edge to first/last object
GAP_BETWEEN = 0.2  // min gap between adjacent objects on the same wall
```

---

## Collision Utility API (`src/store/wallCollision.ts`)

All functions are **pure** — no store reads, no side effects.

### `computePositionBounds(wallWidth, objectWidth, sameWallObjects, objectId)`
Returns `{ min, max, blockedRanges }` for driving a position slider.
- `min = SIDE_MARGIN`
- `max = wallWidth − SIDE_MARGIN − objectWidth`
- `blockedRanges` are `[bStart, bEnd]` pairs — any `positionX` inside a range is forbidden.
- Pass all objects on the same wall (including the object itself; it is filtered out by `id`).

### `snapToNearestValid(desiredX, blockedRanges, min, max)`
Snaps a raw slider value to the nearest valid position, moving toward whichever edge of the blocked range is closer. Iterates up to 10 times to resolve cascading overlaps.

### `findDimensionCollisions(objects, newDimensions)`
Returns `WallObjectBounds[]` that would be clipped or out-of-bounds after a dimension change.
Check conditions per object:
1. `positionX + width > wallWidth(newDim, wall) − SIDE_MARGIN` → right overflow
2. `positionX < SIDE_MARGIN` → left overflow (shouldn't happen normally but protects against data corruption)
3. `height > newDimensions.height − 0.2` → gate taller than new wall height

### `gatesFitOnWall(dimensions, wall, existingWidths[], extraWidth)`
Quick boolean check — is there room for one more object? Used before adding a new gate.

---

## Dimension Change Flow

Dimension setters in `useConfigStore` follow this pattern — **always mirror this when adding new dimension fields**:

```
setWidth(v) {
  1. Build newDims = { ...current, width: v }
  2. conflicts = findDimensionCollisions(toWallObjects(gates), newDims)
  3. If conflicts.length > 0
       → useUIStore.getState().showCollisionDialog(newDims, conflicts)
       → RETURN without applying
  4. Else → apply normally
}
```

`applyPendingDimensions(dims)` applies raw dimensions **without** re-checking collisions — it is only called from the `CollisionDialog` confirm handler after objects are removed.

---

## Collision Dialog Flow

```
useUIStore.collisionDialog = {
  open: boolean
  pendingDimensions: GarageDimensions | null
  conflicts: { id: string; name: string }[]
}
```

- `showCollisionDialog(pending, conflicts)` → opens dialog, stores pending dims + named conflicts
- `closeCollisionDialog()` → closes dialog, clears state (= natural rollback — dims were never applied)
- Rendered at root level in `ConfiguratorPage.tsx` (above all other content)
- "Usuń obiekty" handler: `conflicts.forEach(c => removeGate(c.id))` → `applyPendingDimensions(pending)` → `closeCollisionDialog()`

---

## Position Slider Rules

- Slider only shown when `posMax > posMin` (i.e. there is actually room to move).
- On every `onChange`: call `snapToNearestValid(rawValue, blockedRanges, min, max)` before calling `updateGate`.
- When **width** changes: recalculate bounds for the new width and snap `positionX` to stay valid. Always patch both `{ width, positionX }` in one `updateGate` call to avoid transient invalid states.
- When **wall** changes: validate fit on new wall first (`gatesFitOnWall`). If it fits, find `snapToNearestValid(SIDE_MARGIN, br, min, max)` as the initial position on the new wall, then patch `{ wall, positionX }` together.

---

## Adding a New Wall-Object Type (e.g. Window)

Checklist:

1. **Type** — extend `WallSide` if needed (already covers all 4 sides). Add the object's config interface to `src/store/types.ts` with at minimum: `id`, `wall`, `positionX`, `width`, `height`.
2. **Store** — add the array (e.g. `windows: WindowConfig[]`) to `GarageConfig`. Add add/update/remove actions.
3. **Collision extraction** — in `useConfigStore.ts`, extend `toWallObjects()` to include windows alongside gates. `findDimensionCollisions` and `computePositionBounds` will work automatically.
4. **Collision naming** — extend the conflict-name helper (currently `gateName()`) so the dialog shows meaningful names for each object type.
5. **UI Panel** — add wall selector + position slider using the same pattern as `GatesPanel.tsx > GateEditor`. Import from `wallCollision.ts`, not inline logic.
6. **3D Model** — use or mirror `wallTransform()` from `GateModel.tsx`; it converts `positionX + wall` to world `[x, y, z] + rotationY`.
7. **Validator** — add to `sanitizeConfigToSettings` in `ConfiguratorPage.tsx` to clean up invalid states on settings load.

---

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Reading dimensions from `useConfigStore.getState()` inside render | Subscribe via `useConfigStore(s => s.config.dimensions)` so the component re-renders on change |
| Mutating `positionX` and `width` in two separate `updateGate` calls | Patch both in one call to avoid brief invalid intermediate state |
| Forgetting to filter by `id` when building `sameWallObjects` | `computePositionBounds` filters by `id` internally, but `gatesFitOnWall` needs `excludeId` passed explicitly |
| Adding inline wall width math (`width === 'front' ? ...`) outside `wallCollision.ts` | Always use `wallWidthForSide()` — one source of truth |
| Calling `applyPendingDimensions` instead of `setWidth/setHeight/setDepth` for normal dimension edits | `applyPendingDimensions` skips collision check — only call it from dialog confirm handler |
| Rendering `CollisionDialog` inside the panel component | Always render it at the root `ConfiguratorPage` level so it overlays the full viewport |
| Position slider `max` going negative (gate wider than wall) | Guard: only show slider when `posMax > posMin` |

---

## Key Files Reference

| File | Purpose |
|---|---|
| [src/store/wallCollision.ts](../../../src/store/wallCollision.ts) | All collision math — pure functions, extend first |
| [src/store/types.ts](../../../src/store/types.ts) | `GateConfig`, `WallSide`, `GarageDimensions` |
| [src/store/useConfigStore.ts](../../../src/store/useConfigStore.ts) | Store actions; dimension setters; `applyPendingDimensions` |
| [src/store/useUIStore.ts](../../../src/store/useUIStore.ts) | `collisionDialog` state |
| [src/shared/components/CollisionDialog.tsx](../../../src/shared/components/CollisionDialog.tsx) | Collision modal component |
| [src/features/gate/components/GatesPanel.tsx](../../../src/features/gate/components/GatesPanel.tsx) | Reference implementation of wall selector + position slider |
| [src/features/gate/components/GateModel.tsx](../../../src/features/gate/components/GateModel.tsx) | `wallTransform()` — positionX → 3D world coordinates |
| [src/app/(configurator)/ConfiguratorPage.tsx](../../../src/app/(configurator)/ConfiguratorPage.tsx) | CollisionDialog mounting point + confirm handler |

---

## Quality Gate

Before finishing any task touching wall objects:
1. `npx tsc --noEmit` — zero errors.
2. `npm run lint` — no new warnings.
3. Manual check: add two gates to the same wall → slide one until it stops before the other.
4. Manual check: shrink garage width below the combined gate span → collision dialog appears.
5. Manual check: "Usuń obiekty" removes the gate and applies the new width. "Anuluj" keeps original width.
6. Mobile: collision dialog and position sliders are usable on screen < 768px.

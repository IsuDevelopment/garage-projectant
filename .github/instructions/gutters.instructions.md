---
description: "Gutter system geometry rules and proven constants for the 3D garage configurator"
applyTo: "**/gutters/**,**/GarageGutters*,**/GutterPanel*"
---

# Gutters — Agent Reference

## Files
- 3D model: `src/features/gutters/components/GarageGutters.tsx`
- UI panel: `src/features/gutters/components/GutterPanel.tsx`
- Types: `src/store/types.ts` → `GutterConfig`, `GutterDrainSide`, `GutterDownspout`

## Geometry Constants (proven values — do not change without visual verification)
| Constant | Value | Purpose |
|---|---|---|
| `OUTER_R` | 0.065 | Trough outer radius (Ø 13 cm) |
| `WALL_T` | 0.002 | Trough wall thickness |
| `PIPE_R` | 0.03 | Downspout radius (Ø 6 cm) |
| `PIPE_INSET` | 0.05 | Downspout inset from trough end |
| `PIPE_OVERLAP` | 0.02 | Downspout overlaps into trough body |
| `GUTTER_DROP` | 0.07 | Trough sits 7 cm below eave line |
| `END_CAP_DEPTH` | 0.008 | Solid end-cap thickness |

## Critical Rules
1. **Trough position**: Always `eave.yEave - GUTTER_DROP`. Never place at eave line — it clips the roof.
2. **Downspout alignment**: Centered on trough axis (no lateral offset). Pipe top overlaps into trough bottom by `PIPE_OVERLAP`.
3. **End caps**: Use `END_CAP_PROFILE` (solid semicircle), not `GUTTER_PROFILE` (hollow ring). Hollow profile leaves the opening unclosed.
4. **End caps must be extruded** with `END_CAP_DEPTH` thickness — flat `ShapeGeometry` disappears at glancing angles.
5. **Downspout inset**: Pipe center is `PIPE_INSET` from trough end, not flush with the edge.
6. **Eave calculation** depends on `slopeType` — handled by `getEaves()`. Single slopes use `pitchToHeight`; double slopes use wall height `H` directly.

## Common Pitfalls (learned from iteration)
- Elbow/knee connectors between trough and pipe look bad at this scale — avoid.
- `ShapeGeometry` end caps are invisible from certain camera angles — always extrude.
- Lateral pipe offset (`PIPE_GAP`) made pipe float beside the trough — removed; keep pipe centered.
- `GUTTER_PROFILE` as end cap closes only the wall ring, not the opening — use solid `END_CAP_PROFILE`.

## Coordinate System
- Trough extrusion axis: local Z, then rotated for `axis === 'x'` eaves.
- `axis === 'z'`: trough runs along Z (left/right eaves, e.g. `double` slope).
- `axis === 'x'`: trough runs along X (front/back eaves, e.g. `double-front-back` slope).
- Pipe is a vertical `cylinderGeometry` centered at `pipeHeight / 2`.

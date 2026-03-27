---
description: "Project context and implementation pipeline for 3D garage configurator tasks"
applyTo: "**"
---

# Project Context

## Goal
Build and evolve a web-based 3D garage configurator where UI controls and 3D preview stay in sync in real time.

## Current Feature Domains
- Dimensions: width, height, depth controls
- Roof: slope type and pitch controls
- Gates: add/remove/edit gates with per-type visuals
- Construction: material/profile settings
- Materials: sprite-based textures + tinting
- Ground: configurable sprite plane (instance-ready)

## Core Data Flow
1. User updates a panel control.
2. Zustand store (`src/store/useConfigStore.ts`) updates config.
3. Scene/model components read store state.
4. R3F re-renders geometry/materials based on new config.

## Implementation Pipeline (Typical Task)
1. Update domain types in `src/store/types.ts`.
2. Update available options/labels/defaults in `src/config/settings.ts`.
3. Update UI panels under `src/features/*/components`.
4. Update 3D rendering logic in related model components.
5. Validate with diagnostics and lint.

## Architecture Notes
- Use feature-first organization under `src/features`.
- Keep domain logic close to feature modules.
- Shared UI primitives belong in `src/shared/components`.
- Treat `settings.ts` as the central source for available configurator options.
- ech feature should be responsible for its own state updates and rendering logic, but all should read from the central Zustand store for config state and ask if should have setting option in client panel

## What To Avoid
- Adding options only in UI without updating settings/types.
- Diverging gate behavior between panel and 3D model.
- Large style rewrites when only feature fixes are requested.
- Over-commenting obvious code.

## Definition of Done
- UI + store + 3D model remain consistent.
- Mobile layout remains usable.
- No new diagnostics in touched files.

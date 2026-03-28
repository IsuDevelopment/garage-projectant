---
description: "Future idea: podniesienie realizmu renderingu przez materialy PBR i lepsze oswietlenie"
applyTo: "**"
---

# Idea: Realistyczniejsze Materialy 3D (PBR Upgrade)

Status: idea-only
Priority: medium-high
Execution policy: do not implement unless user explicitly asks for implementation

## Goal
Podniesc jakosc wizualna konfiguratora 3D bez utraty plynnosci na mobile.
Docelowo materialy maja wygladac bardziej realistycznie (blacha, beton, detale), przy zachowaniu obecnej architektury feature-based.

## Why This Matters
1. Lepszy odbior produktu przez klienta koncowego.
2. Mniejsze ryzyko rozjazdu "wizualizacja vs rzeczywisty produkt".
3. Wyzsza wartosc premium dla platnych materialow i opcji dodatkowych.

## Current Constraint
- Obecnie materialy bazuja glownie na mapie koloru + tint i parametrach roughness/metalness.
- Brakuje pelnych zestawow map PBR (normal, roughness, ao, height/displacement).
- Geometrie (plane/box) ograniczaja sens ciezkiego displacementu.

## Target Rendering Shape
1. Materialy scian/dachu/bram wykorzystuja mapy:
- baseColor/albedo
- normal
- roughness
- ao
- opcjonalnie height (tam gdzie uzasadnione)

2. Grunt korzysta z pelnego zestawu PBR dla lepszej glebi i kontaktu ze swiatlem.

3. Oswietlenie i HDRI sa dostrojone do metalu i polmatowych powierzchni:
- stabilny tone mapping
- realistyczniejsze odbicia
- brak przepalen i "plastiku"

## Scope (Phase-ready)
- In scope:
1. Rozszerzenie konfiguracji materialow o mapy PBR.
2. Aktualizacja hookow materialowych i mapowania UV/repeat.
3. Drobny tuning swiatla/sceny pod nowe mapy.
4. Test wydajnosci desktop + mobile.

- Out of scope:
1. Pelny path tracing.
2. Ciezkie, wysokopoligonowe displacementy dla calej sceny.
3. Duze przebudowy geometrii modelu.

## Plan Wdrozenia

### Phase 1: Data Model + Settings
1. Rozszerzyc typy materialow o pola map PBR.
2. Ujednolicic format definicji materialu w ustawieniach.
3. Dodac fallbacki, aby stare konfiguracje dzialaly bez zmian.

Definition of done:
- Konfiguracja materialu moze opcjonalnie zawierac normal/roughness/ao/height.
- Brak regresji dla materialow bez nowych map.

### Phase 2: Material Pipeline
1. Rozbudowac hook materialu o ladowanie wielu map.
2. Dobrac domyslne parametry intensywnosci:
- normalScale
- roughness intensity
- ao intensity
- displacementScale (jesli wlaczone)
3. Zachowac obecną logike tint i orientacji przetloczen.

Definition of done:
- Sciany i dach renderuja sie poprawnie z mapami PBR.
- Brak artefaktow UV i migotania.

### Phase 3: Ground + Gate Detale
1. Dodac mapy PBR dla podloza.
2. Dla bram i detali zastosowac normal/roughness/ao, bez ciezkiego displacementu.
3. Utrzymac czytelnosc elementow interaktywnych (selection outlines itp.).

Definition of done:
- Widoczna poprawa jakosci powierzchni pod kazdym katem kamery.
- Brak pogorszenia UX panelu i interakcji 3D.

### Phase 4: Lighting & Environment Tuning
1. Dostraic environment/HDRI i directional lights.
2. Skorygowac toneMappingExposure pod nowe materialy.
3. Sprawdzic kontrast i czytelnosc sceny dla wszystkich glownych presetow kolorow.

Definition of done:
- Materialy nie wygladaja ani zbyt matowo, ani zbyt "plastikowo".
- Spojny wyglad miedzy desktop i mobile.

### Phase 5: Performance Guardrails
1. Dodac ograniczenia rozdzielczosci tekstur (LOD/varianty).
2. Uzyc skompresowanych formatow (np. KTX2/Basis) tam, gdzie mozliwe.
3. Weryfikacja FPS i czasu ladowania.

Definition of done:
- Brak krytycznego spadku FPS na urzadzeniach mobilnych.
- Czas ladowania tekstur pozostaje akceptowalny.

## Risks
1. Zbyt ciezkie tekstury pogorsza wydajnosc.
2. Niespojne mapy od roznych dostawcow assetow.
3. Przetuningowane oswietlenie moze pogorszyc czytelnosc sceny.

## Mitigations
1. Budzet rozmiaru tekstur per material.
2. Jednolite standardy authoringu map (skala, gamma, konwencja normal map).
3. Checklist QA: desktop/mobile + rozne warunki oswietlenia.

## MVP Definition of Done
1. Co najmniej 1 material scian i 1 material dachu korzystaja z PBR (normal+roughness+ao).
2. Grunt ma mapy PBR i daje odczuwalna poprawe realizmu.
3. Brak regresji funkcjonalnej konfiguratora.
4. Wydajnosc mobilna pozostaje uzywalna.

## Execution Checklist (Technical)
1. Rozszerzyc modele typow materialow o opcjonalne pola map PBR (albedo, normal, roughness, ao, height).
2. Zaktualizowac schemat ustawien materialow tak, aby poprawnie walidowal nowe pola i fallbacki.
3. Dodac pola PBR do definicji materialow w default settings dla co najmniej 2 materialow testowych.
4. Rozbudowac hook materialu o ladowanie zestawu tekstur i bezpieczne fallbacki dla brakujacych map.
5. Ujednolicic konfiguracje texture repeat/rotation dla wszystkich map, nie tylko albedo.
6. Dodac parametry kontroli intensywnosci map (normalScale, aoIntensity, roughnessBias, displacementScale).
7. Podlaczyc PBR pipeline do scian i dachu, zachowujac obecne kolorowanie (tint) i orientacje przetloczen.
8. Podlaczyc PBR pipeline do gruntu i potwierdzic brak artefaktow na granicach tilingu.
9. Dla bram zastosowac normal+roughness+ao bez ciezkiego displacementu.
10. Dostraic scene (environment, directional lights, exposure) pod nowe mapy i metaliczne powierzchnie.
11. Wprowadzic limity rozdzielczosci tekstur oraz strategie ladowania wariantow pod mobile.
12. Dodac checklist QA: porownanie before/after, testy katow kamery, testy presetow kolorow, testy mobile FPS.
13. Uruchomic lint + typecheck po zmianach oraz zapisac wyniki wydajnosci (desktop/mobile) do notatki wdrozeniowej.
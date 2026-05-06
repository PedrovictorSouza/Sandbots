# Design: Finalize Act 3 Sky/Final Biome

## Scope

This promotion freezes the Skyforge Spires content contract without changing
runtime gameplay behavior. It must not touch camera, stage, render frame, input,
scene flow, platform physics or traversal runtime.

Any future platform, glide, lift or camera implementation must be split into a
separate high-risk spec with focused runtime tests.

## Region Entry

Skyforge Spires opens only after both intermediate macro-biome signals are
earned:

- `tide-signal`
- `forge-signal`

The region grants `sky-signal` when its staged beacon repair is complete.

## Characters

Aero is the final traversal mentor. Aero owns route planning, elevated movement
and the safe introduction of late traversal requirements.

Tova is the final builder. Tova owns staged Skyforge repair, beacon readiness and
the conversion of all previous regional signals into final completion.

Chopper remains part of the final interaction and missing-goal feedback, because
the ending should still connect back to the opening mentor contract.

## Platform And Traversal

The platform/lift interaction is content-owned by the first Skyforge repair
stage, `foundation-lift`. Completing that stage unlocks
`platform-lift-access`.

Glide is the planned late traversal ability. It is currently represented by the
`glide` move with `sky-helper` as the learned-from source and
`glide-from-high-places` as its gameplay effect. This slice does not implement
new runtime traversal.

## Important Request

The Act 3 important request is staged large-building repair of the Skyforge
Beacon:

1. `foundation-lift`: restore the lift footing with lift/platform and concrete
   processing work.
2. `spire-frame`: rebuild the spire frame with advanced utility, large-building
   and final-region decor work.
3. `beacon-core`: complete the beacon core with rare machine parts and
   final-token materials.

The final stage grants `sky-signal` and the final rank
`skyforge-beacon-restorer`.

## General Requests

The Act 3 general request pack covers:

- Late traversal follow-up request.
- Material processing.
- Cave or elevated exploration request.
- Furniture, bookcase or decor request.
- Helper support for the final beacon repair.

## Recipes And Materials

The recipe pack is `skyforge-spires-final-recipes`.

Allowed Act 3 recipe families are lift/platform pieces, concrete processing,
advanced utility/electronic items, large-building parts and final-region decor.

The material tier is `sky-concrete-advanced`. Allowed material families are
concrete, advanced metals, glass, rare machine parts and final-token materials.

## Habitats

Final-region habitats should fit elevated and repaired-beacon spaces: perch,
sky-garden, spire workshop and high-platform rest spaces. This slice only
finalizes the content contract; it does not add runtime habitat placement.

## Helper Dependencies

Aero is required for `foundation-lift` and returns for `beacon-core`.
Tova is required for `spire-frame` and `beacon-core`. Chopper remains linked to
the final interaction and final missing-goal presenter copy.

## Completion And Return Gate

Completing `beacon-core` unlocks `skyforge-return-gate`. The return gate belongs
to the Scenario System, requires `sky-signal` and sends the player to the
post-story sandbox state.

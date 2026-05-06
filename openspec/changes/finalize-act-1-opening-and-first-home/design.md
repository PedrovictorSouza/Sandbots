# Act 1 Opening And First Home Decisions

## Scope

These decisions finalize the Act 1 opening slice without changing runtime,
camera, stage, render frame, input ownership, scene flow, asset loading or 3D
model orientation. Existing source-facing IDs remain provisional where the
naming migration spec owns a later rename.

## Opening Identity

- Starting avatar/customization: the opening uses the current fixed awakened
  caretaker avatar. Avatar customization is deferred until after the first
  movement, mentor and restoration loop is stable.
- Mentor intro: Chopper remains the opening mentor. The intro keeps the current
  "late by 2,000 years" framing, explains Bill's absence, then points the player
  toward the first restoration proof instead of a broad island tour.

## First Ability And Habitat

- First ability: Water Gun is the first required ability.
- Ability source: the first Water Gun grant is the `open-the-water-route`
  quest completion path.
- Controls hint: the first controls hint remains the quest guidance for dry
  grass and dry ground restoration: stand near the target and use the field
  action.
- First habitat ingredients: the first restored habitat uses Water Gun on
  `revived-grass`; it does not require crafted items or non-natural materials.
- Discovery source: completing `water-dry-grass` resolves the first habitat
  discovery into `inspect-rustling-grass`.
- First companion spawn/unlock: the first companion is the current
  `leaf-helper`/Bulbasaur entry surfaced by the restored grass discovery.

## First Companion Request

- First companion request objective: Bulbasaur asks for dry tall grass
  restoration, represented by `water-dry-grass` and `revived-grass`.
- First request-log entry: the request log entry is
  `bulbasaur-dry-grass-request`, followed by `bulbasaur-leafage-reward` and
  the non-blocking `bulbasaur-green-corner-play-seed`.
- First reward guard: the required ability reward is `water-restoration`, and
  quest-state guards prevent duplicate unlocks and duplicate completion records.

## Act 1 Request Pack

- First restore request: restore dry tall grass for Bulbasaur.
- First delivery request: give Leppa Berry to Bulbasaur.
- First follow request: bring Charmander to Professor Tangrowth during the
  celebration chain.
- First home/habitat request: build and furnish the Leaf Den after the opening
  proof-of-home loop.

## Starter Crafting Pack

- Workbench item/source: the Workbench remains the first crafting station.
- Workbench interaction: `workbench-diy-recipes` teaches the simple wooden DIY
  recipes before the first required craft.
- Simple recipe: `campfire` at the `workbench`, using 3 Wood.
- First seat/table: Chopper's Log Chair.
- First outdoor fire/rest item: Campfire.
- First bed/home item: Straw Bed, then Leaf Den for the larger home chain.
- First personal marker: Ditto Flag from the celebration reward.
- Starter material tier: Act 1 starter crafting stays in the
  `starter-natural` tier. Wood, leaves, sticks and berries are valid; ore,
  glass, concrete, advanced parts and rare post-story materials are out of
  scope for this opening slice.

## First Home Completion

- First quest-state home proof: placing `leafy-home-patch` completes
  `grow-a-home-patch` and unlocks `first-helper-home`.
- First full den completion: the Leaf Den chain completes after the den is
  built and furnished for Timburr's approval.
- Celebration beat: after the first home/den arc, Charmander starts the
  celebration path and the Ditto Flag marks the first home brought back to life.

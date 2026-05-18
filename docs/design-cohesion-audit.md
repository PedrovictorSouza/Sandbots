# Sandbots Design Cohesion Audit + Backlog

This document tracks design cohesion issues found by reading the current game content and code with a player-facing lens. It is not a rewrite plan. Each item should become a small, testable implementation task before code changes are made.

## Lens

- **MDA:** every mechanic should create a clear dynamic and aesthetic payoff.
- **Jesse Schell:** every element should answer why it exists for the player, what promise it makes, and how it changes the experience.
- **Mechanics integration:** every mechanic should connect input, feedback, world object, narrative role, progression consequence, and repeat use.
- **Sandbots lighthouse:** bots restore a damaged tiny planet for future humans through viability, repair, construction, and practical helper roles.

Current material base:

- `material/Jesse Schell - The Art of Game Design A Book of Lenses  (1).pdf`
- `material/Man-Play-and-Games-by-Roger-Caillois.pdf`
- `material/minecraft.pdf`
- `material/Game Programming Patterns.pdf`
- `material/Turakhia-Integrating_game mechanics.pdf` (pending readable text extraction; use as a mechanics-integration reference, not a quoted source yet)
- Recommended addition: `MDA: A Formal Approach to Game Design and Game Research`, Hunicke, LeBlanc, Zubek.

## Mechanics Integration Checklist

Use this checklist before adding or changing a major mechanic. It keeps implementation grounded in the player's experience instead of only adding systems because the code supports them.

- **World object:** what visible object, bot, machine, terrain state, or UI device introduces this mechanic?
- **Player action:** what input or choice activates it?
- **Immediate feedback:** what animation, sound, prompt, highlight, dialogue, or state change confirms it worked?
- **System consequence:** what actually changes in inventory, terrain, quest state, unlocks, placement rules, or bot behavior?
- **Narrative meaning:** what does it say about planetary viability, repair, colony preparation, or bot work?
- **Future dependency:** what later action depends on this mechanic, so it feels like part of a chain instead of a one-off tutorial?

Priority mechanics for the next pass: Builder callsign, Hydro Jet, Bio-Grow, Workbench, Colony Terminal, Solar Station, House Kit.

## Findings

### P0 - Player Name Has System Support But Almost No Game Payoff

- **Observed piece:** the onboarding asks the player to enter a name through a custom keyboard.
- **Evidence:** `app/player/playerProfile.js` stores `playerName`; `app/story/createStoryBeatSystem.js` supports `{{playerName}}`; tests cover interpolation, but current story content does not appear to use the token in real beats.
- **Player inference:** entering a name means the game will recognize me, identify my Builder frame, or personalize colony logs.
- **Cohesion problem:** the mechanic creates an authorship promise, but the world does not visibly acknowledge it.
- **MDA/Jesse lens:** mechanic is input/identity; expected dynamic is recognition; expected aesthetic is authorship and belonging. Current payoff is mostly save metadata.
- **Minimum correction:** use the confirmed name in 2-3 early moments: Chopper acknowledgement, Builder frame registration, and Colony Terminal viability log.
- **Acceptance test:** after confirming `Ada`, at least one early dialogue and one Terminal/notice line display `Ada`; fallback still displays `Operator`.
- **Implementation note:** name-entry copy, Chopper acknowledgement, Terminal registration notice, and House Kit issue feedback now use the Builder callsign.

### P0 - Builder Frame Identity Is Implied, Not Paid Off At The Moment Of Naming

- **Observed piece:** the narrative bible says the player is a Builder frame, but the name-entry moment looks like generic player naming.
- **Evidence:** `SANDBOTS_PREMISE.playerRole` defines "Builder frame"; `playerProfile` still carries legacy fields such as `trainer`, `humanClaim`, and `pokedexChoice`.
- **Player inference:** if I name myself, I may be naming a human, a robot, or a game profile.
- **Cohesion problem:** the identity choice is ambiguous at the exact moment where the game should make the player role clear.
- **MDA/Jesse lens:** the mechanic should teach role and fantasy. Current framing risks UI ritual instead of world fiction.
- **Minimum correction:** rename the prompt copy to "Register Builder frame callsign" or equivalent, and confirm it with a Terminal-style line.
- **Acceptance test:** name entry screen and post-confirmation copy clearly state the name belongs to the Builder frame/callsign, not a trainer/person profile.

### P0 - Hydro/Grow Loop Exists, But It Needs To Stay The Spine Of Early Progress

- **Observed piece:** Hydro Jet restores dry ground; Bio-Grow uses restored ground; Grow Bot unlocks plant/habitat progression.
- **Evidence:** `companionAbilities.js` states Hydro creates restored ground and Bio-Grow uses it; `questData.js` chains `Wake up Hydro Bot -> water-dry-grass -> Grow Bot -> Bio-Grow`.
- **Player inference:** water makes dead soil usable, then growth creates habitat value.
- **Cohesion problem:** this is the strongest early loop, so any quest copy or objective that does not reinforce it will feel like noise.
- **MDA/Jesse lens:** mechanic sequence should produce a restoration dynamic and the aesthetic of care/work becoming visible.
- **Minimum correction:** audit all early Hydro/Grow text so every step says either "restore moisture", "prove viable soil", "grow habitat", or "unlock next colony need".
- **Acceptance test:** no visible early Hydro/Grow quest uses unrelated phrasing such as scanning, warm wood, generic collecting, or unexplained ability unlocks.

### P1 - Workbench And Terminal Roles Are Close But Must Remain Distinct

- **Observed piece:** the Workbench issues/crafts buildables; the Colony Terminal logs viability and authorizes House Kit progression.
- **Evidence:** `workbenchContainerContract.js` now uses "Prepare Solar Station" and "Prepare House Kit"; story beats say the Terminal can issue a House Kit after viability passes; current design principles say machines diagnose, validate, authorize and issue protocols.
- **Player inference:** Terminal is mission/authorization; Workbench is fabrication/placement prep.
- **Cohesion problem:** if both screens "issue" things, players may not understand why they should use one machine over the other.
- **MDA/Jesse lens:** interfaces are narrative objects. The action verbs should teach the world rules.
- **Minimum correction:** reserve "authorize/log protocol" for Terminal and "fabricate/build/prepare kit" for Workbench when copy is touched.
- **Acceptance test:** Terminal copy explains why a protocol is allowed; Workbench copy explains what physical object/kit will be prepared.

### P1 - Solar Station Is A Power Rule, Not Just A Placeable Object

- **Observed piece:** House placement depends on Solar Station power radius.
- **Evidence:** `progressionContracts.js` blocks House Kit without Solar Station power; `colonyFeedbackContracts.js` has prompts for "Needs Solar Station power radius"; recent placement work highlights radius cells.
- **Player inference:** Solar Station defines where human-safe habitat can exist.
- **Cohesion problem:** if Solar Station appears as just another crafted object, its systemic purpose is under-sold.
- **MDA/Jesse lens:** mechanic is placement constraint; dynamic is planning a powered habitat; aesthetic is "the colony is becoming viable".
- **Minimum correction:** make the first Solar Station moment explicitly say that blue radius means "human habitat support zone".
- **Acceptance test:** after Solar Station placement, the HUD or notice names the radius as the valid support area for House placement.

### P1 - House Kit Has Good Viability Framing But Needs Strong Ownership Payoff

- **Observed piece:** House Kit is authorized after viability and placed in a powered area.
- **Evidence:** story beats use "House Kit authorized" and "House Kit issued"; later task says "The House is now marked as your house."
- **Player inference:** this is the first concrete human-colony shelter and possibly the player's anchor in the world.
- **Cohesion problem:** if the player name/callsign is not tied to the house or frame registry, the first house feels generic.
- **MDA/Jesse lens:** construction mechanic should produce belonging and visible colony progress.
- **Minimum correction:** when House Kit is issued or placed, include a short "registered to [Builder callsign]" or "first human habitat shell logged" beat.
- **Acceptance test:** House completion produces one visible outcome beyond object placement: registry line, bot reaction, or terminal log tied to colony readiness.
- **Implementation note:** House Kit issue and House placement now surface the Builder callsign in Terminal/placement feedback.

### P1 - Farm-Like Systems Should Serve Viability, Not Become Generic Farming

- **Observed piece:** Bio-Grow, tall grass, trees, leaves, berries, and restored soil resemble farming/life-sim patterns.
- **Evidence:** `resourcePurposeCatalog.js` ties resources to Hydro Jet, bot relationship, thermal loops, nutrients and Solar Station protocol; story tasks include watering grass, watering trees, and planting Bio-Grow.
- **Player inference:** plants are not just crops; they are proof that the planet can support habitat.
- **Cohesion problem:** adding Stardew/Harvest Moon style loops without this framing would drift the game away from restoration.
- **MDA/Jesse lens:** resource loops should create care, recovery, and planning, not only accumulation.
- **Minimum correction:** every plant/resource loop should state a viability purpose: soil stability, shade, nutrients, bot calibration, power support, or habitat comfort.
- **Acceptance test:** any new plantable/harvestable item has a player-facing purpose entry before it becomes quest-required.

### P2 - Quest Subtitle/Guidance Needs A "New Information" Rule

- **Observed piece:** duplicate or redundant HUD text has been reported before; current systems contain title, description, guidance and errand `hudText`.
- **Evidence:** `questData.js` has separate `title`, `description`, `guidance`, and errand fields; content contracts already detect duplicate objective copy in some catalogs.
- **Player inference:** a subtitle should explain how/why, not repeat what the title already says.
- **Cohesion problem:** repeated copy makes the HUD feel bureaucratic and weakens important guidance.
- **MDA/Jesse lens:** UI text is part of narrative economy; every line should add world, character, relationship, plot, or instruction.
- **Minimum correction:** add a quest-copy rule: HUD subtitle appears only when it adds a route, condition, consequence, or input hint.
- **Acceptance test:** automated content validation warns when subtitle/guidance normalizes to the same text as the quest title.

### P2 - Legacy Internal Names Are Safe Technically But Risk Agent Confusion

- **Observed piece:** user-facing text is mostly Sandbots, but internal ids still include `bulbasaur`, `squirtle`, `pokedex`, and similar legacy terms.
- **Evidence:** `sandbotsNarrativeBible.js` intentionally defers internal renames; story flags like `bulbasaurDryGrassRequest` still exist.
- **Player inference:** not visible if UI is clean.
- **Cohesion problem:** future implementation agents may follow old symbol names and reintroduce external-IP logic or creature framing.
- **MDA/Jesse lens:** production vocabulary affects future design choices.
- **Minimum correction:** maintain a short "legacy alias warning" at top of touched files or central docs until safe renames happen.
- **Acceptance test:** visible content remains clean; new code touching legacy ids includes Sandbots-facing comments or uses terminology normalizers.

## Backlog

1. **Player Name Payoff v1**
   - Add Builder callsign usage to Chopper onboarding completion, one Terminal log, and one early notice.
   - Test `{{playerName}}` appears in real story content after confirmation.
   - Implemented partial payoff: name-entry copy, Chopper acknowledgement, Terminal registration notice, and House Kit issue dialogue/notice use the callsign.

2. **Builder Frame Name Entry Copy**
   - Change name-entry prompt from generic naming to Builder frame/callsign registration.
   - Test name-entry modal still supports keyboard/controller navigation and escapes player input.

3. **Hydro/Grow Spine Copy Audit**
   - Remove early visible text that implies scanning/warm wood or unrelated collection for Hydro wake.
   - Test current quest subtitle does not duplicate title and Wake Up Hydro completes when Hydro Jet unlocks.

4. **Terminal vs Workbench Verb Pass**
   - Terminal: log, diagnose, authorize, register.
   - Workbench: fabricate, assemble, prepare, place.
   - Implemented for Workbench protocol action labels: `Prepare Solar Station`, `Prepare House Kit`, `Prepare Thermal Cabin`.

5. **Solar Station Support Zone Payoff**
   - Add first-placement notice explaining blue radius as habitat support.
   - Test House Kit preview blocks outside radius and prompt names the support zone.

6. **Plant Purpose Contract**
   - Require new plant/resource loops to define viability purpose before quest use.
   - Test resource purpose catalog includes purpose for required plant items.

7. **Quest Copy Validation**
   - Extend content validation to warn on duplicated title/subtitle/guidance.
   - Test duplicate "Wake up Hydro Bot" style subtitle is flagged.

8. **Mechanic Promise/Payoff Matrix**
   - Create a small matrix for Builder callsign, Hydro Jet, Bio-Grow, Workbench, Colony Terminal, Solar Station, and House Kit.
   - Each row must define player action, feedback, system consequence, narrative meaning, and future dependency.
   - Test/acceptance: no early mechanic is introduced unless at least one later visible beat pays it off.
   - Implemented as `app/story/mechanicPromisePayoffData.js` with validation tests in `tests/mechanicPromisePayoffData.test.js`.

## Validation Notes

- This pass was grounded in code/content inspection, not a full runtime playthrough.
- `material/Turakhia-Integrating_game mechanics.pdf` was found locally, but the current environment could not extract readable text from it with available tools. Do not cite specific claims from it until extraction succeeds.
- A later manual pass should verify visual timing, prompts, and whether the player actually sees these beats in order.
- Do not implement all backlog items together. Each item should be a small vertical slice with focused tests.

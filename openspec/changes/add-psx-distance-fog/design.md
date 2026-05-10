# PSX Distance Fog Design Notes

## Scope

This design defines the contract for a simple world-rendering distance fog. The
first implementation should own configuration and renderer application only. It
must not change gameplay rules, quest logic, camera choreography or UI layout.

## Fog Presets

Fog should be data-driven. A preset should include at least:

```js
{
  id: "gameplay-default",
  enabled: true,
  color: [0.78, 0.82, 0.86],
  near: 18,
  far: 54,
  intensity: 0.85
}
```

Values above are examples only. Final values should live in named constants or
data objects under the fog/preset ownership area. Scene setup should reference a
preset id or provide an explicit preset override.

## Render Ownership

Fog applies to the world render output. UI, HUD, dialogue, quest tracker,
menus, prompts and DOM overlays should remain outside the fog pass. If world
prompts are rendered inside the 3D/world layer, they need an explicit readability
exception or separate overlay treatment.

## Readability Rules

Fog should be distance-based and should not alter collision, interaction range,
quest completion or ability validity. At interaction distance, critical objects
must remain readable:

- player character;
- active NPCs and companion actors;
- objective markers;
- interaction prompts;
- valid Water Gun, Leafage or placement targets.

## Visual Direction

The effect should read as PSX-era distance fog: simple, dense and stylized. It
should support low-poly silhouettes and distant fade rather than modern
volumetric lighting. Default gameplay fog should feel mysterious and cold while
still preserving the island's playful reconstruction tone.

## Testing And Verification

Implementation should add focused tests for:

- preset fallback and scene override resolution;
- named fog values existing in data/config ownership;
- UI/HUD render paths not receiving fog state;
- valid target readability metadata or distance threshold behavior.

Visual verification should include gameplay screenshots with fog active, at
least one active NPC, one objective marker, one interaction prompt and one valid
ability target.

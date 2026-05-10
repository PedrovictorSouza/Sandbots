# Motion Readability Design Notes

## Scope

This design defines a small motion impact layer for short, readable reactions.
The first implementation owns only preset data and frame calculation. It does
not decide when gameplay events happen.

## Motion Impact Presets

Each preset is data:

```js
{
  id: "water-gun-hit",
  durationMs: 220,
  freezeMs: 40,
  anticipationMs: 30,
  recoverMs: 120,
  positionJolt: { x: 0, y: 0.03, z: -0.04 },
  rotationJolt: { x: -0.08, y: 0.12, z: 0.04 },
  scalePulse: 1.04,
  blend: "sharp",
  silhouetteBias: "camera-readable"
}
```

The first impact frame is intentionally strong. The controller holds that pose
briefly during `freezeMs`, then returns toward idle by delta time. `anticipationMs`
is part of the preset contract for future events that can schedule pre-impact
motion, but immediate hits still start on the extreme pose.

## Controller Contract

The controller stores short reactions by target id and returns frame data:

- phase: `impact-freeze`, `recover` or `idle`
- position offset
- rotation offset
- scale pulse
- blend and silhouette metadata

Targets may provide `applyMotionImpact(frame)`. The motion layer does not mutate
gameplay object positions, rotations or scale directly. This keeps ownership with
actors/render adapters and avoids circular coupling.

## Runtime Integration

Future slices should add one hook at a time. A good first runtime hook is Water
Gun hit feedback because the game already has ground action feedback and sound
events. Each hook should:

- trigger one preset from the existing event point;
- apply offsets in the owning render/session adapter;
- use delta time from the existing runtime;
- add a focused test or presenter/controller test.

## Constraints

- No FPS-based timing.
- No broad animation graph.
- No combat-state vocabulary.
- No new tutorial screen.
- Constants must stay named and local to preset/controller ownership.

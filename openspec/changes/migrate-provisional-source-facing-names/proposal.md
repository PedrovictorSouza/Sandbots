# Change: Migrate provisional source-facing names

## Why

The story bible defines original target names for the final game, but current
source, tests and player-facing labels still include provisional names. Those names
should not be replaced casually because ids, save assumptions, quest text, codex
labels and tests can depend on them.

This change scopes future renames as a migration with behavior-preserving tests.

## What Changes

- Define a migration process for provisional source-facing names.
- Require an inventory of every id, label, dialogue line, quest title, item name and
  asset-facing reference before renaming.
- Require focused tests before any rename reaches runtime content.
- Separate player-facing copy migrations from stable source id migrations.
- Keep high-risk systems out of naming-only work.

## Non-Goals

- Do not rename existing source ids in this change.
- Do not change dialogue, quest data, item data, assets or runtime behavior yet.
- Do not modify camera, input, render frame, stage, scene flow or broad game loop
  code.
- Do not combine naming migration with final quest, biome, recipe or NPC
  implementation.

## Preflight

- Objective: create the migration spec required by `define-story-bible`.
- Existing context: story bible target names exist, current source names are still
  provisional and tests already protect many player-facing strings.
- Smallest safe change: OpenSpec documentation only.
- Files not to touch: gameplay source, runtime, UI presenters, quest catalogs,
  asset catalogs, camera, input, renderer and scene flow.
- Risk: renaming ids without migration rules can break saved progress, tests,
  links, codex entries and future scripted progression.
- Size: small.

## Migration Principle

Prefer copy-only migrations first. Stable ids should remain unchanged unless the
owning spec proves that the id itself is harmful and provides a compatibility plan.

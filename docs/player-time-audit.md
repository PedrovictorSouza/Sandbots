# Player Time Audit

This audit classifies early-game waits, fades, holds, repeated prompts, and
forced returns. Do not shorten a timing until its current purpose is clear.

## Keeps

| Moment | Current Timing | Classification | Why It Earns Time |
| --- | ---: | --- | --- |
| Crash opening camera hold | `6.4s` | sells impact | Shows ship fall, impact, player exit, and then releases to normal follow. |
| Ship fall start | `0.45s` | sells impact | Gives the camera a beat before motion begins. |
| Ship impact | `2.2s` | sells impact | Clear cause/effect moment for crash, shake, smoke, and sound. |
| Player exit start | `3.2s` | teaches | Shows where the player appears before input returns. |
| Cinematic hold-to-skip | `0.65s` | respects control | Lets players skip without accidental taps. |
| Dialogue camera transition | `0.45s` | teaches | Reframes who or what matters before dialogue or object focus. |
| Gameplay HUD reveal after opening | `600ms` | rewards | Gives the crash beat space before objective/UI appears. |
| Grow Bot repair box reveal | `4.35s` | rewards | Major bot-awakening moment with authored camera, shake, flash, and follow-up dialogue. |
| Quest completion pop | `2400ms` | rewards | Confirms progress and gives the next objective room to land. |
| Field move switch prompt | `1500ms` | teaches | Short confirmation that the selected bot function changed. |
| Invalid target prompt | `1600ms` | teaches | Gives enough time to read why the action did not work. |

## Watchlist

| Moment | Current Timing | Classification | Risk |
| --- | ---: | --- | --- |
| Leppa tree camera orbit | `4200ms` | teaches / risk of waste | Useful only if it points to the next actionable target. Recheck with HUD visible. |
| Repair box intro chained delays | `480ms + 1550ms + 480ms` | sells impact / risk of waste | Multiple nested waits can feel sluggish if the player already saw the box. |
| Companion lost hint initial delay | `5200ms` | teaches | Long delay is fine if it avoids spam, but may arrive after the player already recovered. |
| Companion lost hint duration | `3400ms` | teaches | Check if it blocks or overlaps more important prompts. |
| Water stamina recharge | `3.2s` | balances action | Acceptable if recharge communicates tool cadence; wasteful if it only stalls restoration. |
| Object music resume cooldown | `30s` | ambience | Good for mood, but verify it does not hide important music transitions. |

## Already Avoids Empty Return

- The first Hydro errand uses radio completion.
- Errand quest validation requires fast resolution and micro-events.
- The current task chain should keep using radio, shortcut, fade, or immediate
  next beat when the objective completes away from base.

## Future Timing Rule

Before shortening a delay, label it as one of:

- `teaches`
- `rewards`
- `sells impact`
- `loads`
- `waste`

Only shorten `waste` in runtime code, and test the affected timing.

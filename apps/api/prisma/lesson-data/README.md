# Lesson Data

This directory is the source of truth for curriculum content imported by
`../import-data.ts`.

## Layout

```text
lesson-data/
  subjects.json
  english/
    courses.json
    grade-1/
      units.json
      01-basics/
        lessons.json
        01-greetings.json
```

- `subjects.json` lists subject metadata and subject directories.
- Each subject `courses.json` lists course metadata and course directories.
- Course directories are named by grade, such as `grade-1` or `grade-2-volume-2`.
- Each course `units.json` lists unit metadata and unit directories.
- Each unit `lessons.json` lists lesson metadata and lesson files.
- Lesson files contain only exercises.

Running `pnpm db:import` clears curriculum content and related learning state,
then reimports this tree. User accounts, wallets, quests, achievements, and XP
ledger entries are preserved.

## Unit Map Rive Decorations

Course-map Rive animations are configured on units in each course `units.json`.
They are visual decorations for the lesson path, not lesson content, so keep
them at the unit level instead of inside individual lesson files.

Example:

```json
{
  "units": [
    {
      "dir": "01-division",
      "orderIndex": 0,
      "title": "第一单元・除法",
      "themeColor": "#F59E0B",
      "mapDecorations": [
        {
          "id": "division-duo-clock",
          "src": "/assets/rive/math/duo-clock.riv",
          "stateMachine": "Mega_Path_StateMachine",
          "anchorLessonOrder": 0,
          "side": "left",
          "size": 148,
          "offsetY": 34
        },
        {
          "id": "division-zari-protractor",
          "src": "/assets/rive/math/zari-protractor.riv",
          "stateMachine": "Mega_Path_StateMachine",
          "anchorLessonOrder": 2,
          "side": "right",
          "size": 142,
          "offsetY": -18
        }
      ]
    }
  ]
}
```

Fields:

| Field               | Required | Description                                                                                  |
| ------------------- | -------: | -------------------------------------------------------------------------------------------- |
| `id`                |      yes | Stable unique id within the unit. Used as the React key and debug marker.                    |
| `src`               |      yes | Public Rive asset path, usually `/assets/rive/...`. Web serves these from `apps/web/public`. |
| `anchorLessonOrder` |      yes | Lesson `orderIndex` beside which the decoration should appear.                               |
| `side`              |      yes | Preferred side of the lesson node: `left` or `right`. Clients may flip it near screen edges. |
| `stateMachine`      |       no | Rive state machine to autoplay, for example `Mega_Path_StateMachine`.                        |
| `animation`         |       no | Rive animation name to autoplay when not using a state machine.                              |
| `size`              |       no | Desired Web size in px. Mobile scales this down automatically.                               |
| `offsetX`           |       no | Extra horizontal offset in px after side placement.                                          |
| `offsetY`           |       no | Extra vertical offset in px; positive moves the decoration down.                             |
| `hiddenWhenLocked`  |       no | When `true`, hide the decoration until the anchored lesson is unlocked. Defaults to visible. |

Placement guidance:

- Treat these like Duolingo-style path-side characters: make them large enough
  to read as scene dressing (`120`-`160` px on Web), not tiny lesson icons.
- Prefer alternating `side` values and anchoring them every few lessons, rather
  than attaching one to every node.
- Use `offsetY` to avoid the start bubble and lesson labels. Positive values
  work well for the upper-left of a node; negative values work well when the
  decoration is above/right of a later node.
- Keep the actual Rive files under `apps/web/public/assets/rive/` and record
  them in `apps/web/public/assets/rive/manifest.json`.

After changing `mapDecorations`, run:

```bash
pnpm db:import
```

The import script validates this field, stores it in `Unit.mapDecorations`, and
`GET /api/v1/courses/:id/tree` returns it to Web and Mobile clients.

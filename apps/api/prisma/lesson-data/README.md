# Lesson Data

This directory is the source of truth for curriculum content imported by
`../seed.ts`.

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

Running `pnpm db:seed` clears curriculum content and related learning state, then
reimports this tree. User accounts, wallets, quests, achievements, and XP ledger
entries are preserved.

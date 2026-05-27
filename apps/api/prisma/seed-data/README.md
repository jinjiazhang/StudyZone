# Seed Data

This directory stores curriculum seed data separately from the database write
logic in `../seed.ts`.

## Layout

- `courses/english.ts` - English units, lessons, and exercises.
- `courses/math.ts` - Math units, lessons, and exercises.
- `courses/chinese.ts` - Chinese units, lessons, and exercises.
- `types.ts` - Shared seed data shapes and the `ex()` exercise helper.
- `index.ts` - Barrel exports consumed by `../seed.ts`.

## Data Shape

Course data follows this tree:

```text
subject
  course
    unit
      lesson
        exercise
```

Keep new lesson content in this directory. Keep Prisma upsert logic in
`../seed.ts`.

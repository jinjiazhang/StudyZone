---
name: generate-lesson-data
description: Create or regenerate StudyZone lesson-data from textbook assets and docs. Use when Codex needs to read textbook images/resources, understand curriculum goals, design 18-20 lessons per unit with 10-15 exercises each, use varied exercise types, clear old unit lesson-data, write JSON files under apps/api/prisma/lesson-data, and audit answer-order randomness/schema validity.
---

# Generate Lesson Data

## Workflow

1. Read the repo docs before writing data:
   - `docs/architecture/06-exercise-types.md`
   - `docs/architecture/04-learning-engine.md`
   - `docs/architecture/02-data-model.md`
   - `apps/api/prisma/lesson-data/loader.ts`
2. Inspect existing lesson-data in the target subject/grade to learn local naming, unit index, and JSON style.
3. Read the textbook assets from `apps/web/public/assets/textbooks/<subject>/<grade-volume>/`.
   - Read `manifest.json` and `resource.json`.
   - Use visual inspection for relevant `pages/page-*.jpg`; do not rely only on old lesson files.
4. Extract the unit's learning targets from the textbook:
   - Required texts, new characters, writing characters, vocabulary, exercises after the lesson, oral/reading tasks, and unit garden pages.
   - For Chinese, cover recognition, pinyin, word building, meaning, text comprehension, dictation/writing, recitation, sentence imitation, and integrated review.
5. Plan 18-20 lessons for the unit.
   - Do not create lessons named as preview/self-study/review phases.
   - Use skill-focused names such as "生字认读", "词语积累", "背诵拼图", "故事顺序", "句子仿照", "综合".
   - Keep each lesson at 10-15 exercises.
6. Clear and regenerate only the requested unit directory.
   - Preserve unrelated units and course metadata.
   - Write `lessons.json` plus one JSON file per lesson.
7. Use diverse exercise types supported by the docs and shared types.
   - Chinese: `pinyin_choice`, `pinyin_to_word`, `word_build`, `match_pairs`, `single_choice`, `word_bank`, `poem_complete`, `poem_multi_blank`, and `image_choice` when textbook images help.
   - Include `prompt.type` only when the repo's existing data style requires it; the loader adds it automatically.
8. Randomize answer surfaces before finishing.
   - For index-based questions, distribute correct answers across all option positions with no visible pattern.
   - For `word_bank`, shuffle `prompt.tokens` so the answer is not already contiguous or in order.
   - For `word_build`, shuffle candidate tokens so accepted sets are not grouped together.
   - For `match_pairs`, shuffle both columns and prevent many same-row matches.
   - For `image_choice`, vary the correct image position.
9. Validate with the loader and the audit script.

## Quality Rules

- Align every exercise with the textbook page,课后练习, or unit garden goal.
- Prefer concrete textbook wording for prompts, but avoid overlong passages.
- Keep distractors plausible for the grade level.
- Avoid repeated identical options in any option group.
- Avoid answer-position patterns inside a lesson and across the unit.
- Use textbook image URLs from the local asset path, for example `/assets/textbooks/chinese/grade-2-volume-2/pages/page-006.jpg`.
- Keep generated JSON pretty-printed and stable.

## Validation

Run the unit audit after writing lesson files:

```bash
python3 skills/generate-lesson-data/scripts/audit_lesson_data.py \
  apps/api/prisma/lesson-data/chinese/grade-2-volume-2/01-reading
```

Run the StudyZone loader against the course:

```bash
pnpm --filter @studyzone/api exec tsx -e "import { loadLessonData } from './prisma/lesson-data/loader'; const catalog = loadLessonData('./prisma/lesson-data'); console.log(catalog.subjects.length)"
```

If the audit reports alignment or randomness issues, reshuffle the affected prompts and rerun it.

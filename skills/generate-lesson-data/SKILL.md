---
name: generate-lesson-data
description: Create or regenerate textbook-aligned StudyZone lesson-data for Chinese, math, or English by inspecting textbook page images, planning 18-20 skill-focused lessons per unit with 10-15 exercises each, using subject-appropriate exercise types, and auditing schema, answer correctness, uniqueness, and answer-order randomness.
---

# Generate Lesson Data

## Workflow

1. Read the repo docs before writing data:
   - `docs/architecture/06-exercise-types.md`
   - `docs/architecture/04-learning-engine.md`
   - `docs/architecture/02-data-model.md`
   - `apps/api/prisma/lesson-data/loader.ts`
2. Inspect existing lesson-data in the target subject/grade only to learn local naming, unit index, JSON style, and file conventions. Do not treat old lesson files as the source of textbook content.
3. Read the textbook assets from `apps/web/public/assets/textbooks/<subject>/<grade-volume>/`.
   - Read `manifest.json` and `resource.json`.
   - Use multimodal/vision inspection of relevant `pages/page-*.jpg` before planning or writing exercises.
   - Locate the unit boundaries from the textbook pages; confirm page numbers and lesson titles from the images.
   - Crop or zoom pages when needed to read tables, pinyin, footnotes,课后练习, and 园地 sections accurately.
4. Extract the unit's learning targets from the textbook:
   - Required texts, new characters, writing characters from the textbook writing grid, vocabulary, exercises after the lesson, oral/reading tasks, and unit garden pages.
   - For Chinese, cover recognition, pinyin, word building, meaning, text comprehension, dictation/writing, recitation, sentence imitation, and integrated review.
   - For math, make a knowledge-point inventory before writing exercises: concepts, representations, calculation methods, worked examples, common mistakes, application models, required units, diagrams/tables, and textbook practice variants.
   - Record the valid number range, operations, notation, units, and expected solution method for every math knowledge point. Do not introduce content from later grades or unrelated units.
   - When textbook images conflict with existing lesson-data or memory of another edition, follow the images in the repository.
5. Plan 18-20 lessons for the unit.
   - Do not create lessons named as preview/self-study/review phases.
   - Use skill-focused names such as "生字认读", "词语积累", "背诵拼图", "故事顺序", "句子仿照", "口算基础", "方法理解", "应用辨析", and "综合运用".
   - For math, split each textbook topic into meaningful learning steps rather than repeating one worksheet: concept/representation, direct calculation, method reasoning, comparison or classification, error diagnosis, application modeling, and integrated use.
   - Keep prerequisites before applications and arrange difficulty from concrete to abstract. If the textbook unit genuinely cannot support 18 distinct lessons, create fewer high-quality lessons and explain the exception; never add unrelated content or duplicate exercises merely to reach the target.
   - Keep each lesson at 10-15 exercises.
6. Clear and regenerate only the requested unit directory.
   - Preserve unrelated units and course metadata.
   - Write `lessons.json` plus one JSON file per lesson.
7. Use diverse exercise types supported by the docs and shared types.
   - Chinese: `pinyin_choice`, `pinyin_to_word`, `word_build`, `match_pairs`, `single_choice`, `word_bank`, `poem_complete`, `poem_multi_blank`, and `image_choice` when textbook images help.
   - Math calculation and number sense: `numeric_input`, `multi_numeric_input`, `compare_input`, `order_sequence`, and `math_drag_fill`.
   - Math modeling and reasoning: `expression_input`, `single_choice`, `match_pairs`, and `table_read`.
   - Math topic-specific interaction: `geometry_choice`, `geometry_draw`, `clock_input`, `unit_conversion`, `fraction_input`, and `number_line`.
   - Select types because they fit the learning target. Do not use `word_bank` as a generic math filler, and do not force every supported type into every unit.
   - Include `prompt.type` only when the repo's existing data style requires it; the loader adds it automatically.
8. Randomize answer surfaces before finishing.
   - For index-based questions, distribute correct answers across all option positions with no visible pattern.
   - For `word_bank`, shuffle `prompt.tokens` so the answer is not already contiguous or in order.
   - For `word_build`, shuffle candidate tokens so accepted sets are not grouped together.
   - For `match_pairs`, shuffle both columns and prevent many same-row matches.
   - For `image_choice`, vary the correct image position.
   - For `geometry_choice`, vary the correct option position and keep option ids stable after shuffling.
   - For `order_sequence`, do not store `prompt.items` in the correct order.
   - For `math_drag_fill`, shuffle tokens and include only plausible distractors.
9. Validate with the loader and the audit script.

## Quality Rules

- Align every exercise with the textbook page,课后练习, or unit garden goal.
- Base content on direct textbook image understanding; use old lesson-data only as a style reference.
- Verify writing-character exercises against the textbook writing grid for the exact edition in `apps/web/public/assets/textbooks`.
- Prefer concrete textbook wording for prompts, but avoid overlong passages.
- Keep distractors plausible for the grade level.
- Avoid repeated identical options in any option group.
- Avoid repeated exercises within a lesson. Reuse a knowledge point with changed values, representations, or reasoning demands rather than copying the same question.
- Avoid answer-position patterns inside a lesson and across the unit.
- Use textbook image URLs from the local asset path, for example `/assets/textbooks/chinese/grade-2-volume-2/pages/page-006.jpg`.
- Keep generated JSON pretty-printed and stable.

## Math Quality Rules

- Independently solve every generated math exercise before writing its answer. Do not infer correctness from a template or from another generated exercise.
- Prefer exact answers. Use `tolerance: 0` for integer answers; use a small explicit tolerance only when the textbook expects an approximate decimal.
- Keep notation consistent with the textbook and learner level. Prefer `×` and `÷` in displayed elementary-school questions; accepted expression variants may also include `*` when useful for input.
- Ensure each application problem contains enough information, has one intended interpretation, and asks for the correct unit. Distinguish cases such as "最多", "至少", "还剩", and "平均".
- For division with remainder, verify `dividend = divisor × quotient + remainder` and `0 <= remainder < divisor`.
- For `expression_input`, list all genuinely accepted forms required by commutativity or textbook conventions, but do not accept expressions that accidentally produce the same value while modeling the wrong relationship.
- For `match_pairs`, every visible item on the side being matched must be distinguishable. Do not create multiple identical result labels such as three separate `"4"` options.
- For `multi_numeric_input`, keep blanks, values, and tolerances aligned in the same order.
- For `compare_input`, independently evaluate both sides and verify the comparison operator.
- For `unit_conversion`, verify the conversion factor and make `answer.unit` equal `prompt.toUnit`.
- For `fraction_input`, use a nonzero positive denominator and set `allowEquivalent` according to whether the task asks for a specific representation or any equivalent fraction.
- For `clock_input`, use valid clock values and make a read-mode answer match the displayed clock.
- For `number_line`, keep the answer inside `[min, max]`, use a positive step, and ensure the target is representable at the intended precision.
- For geometry, tables, images, and diagrams, inspect the rendered or source asset and confirm that the visual evidence uniquely supports the answer.
- Include a useful difficulty progression inside each lesson: mostly level 1-2 practice, followed by a small number of level 2-3 reasoning or application exercises.

## Validation

Run the unit audit after writing lesson files:

```bash
python3 skills/generate-lesson-data/scripts/audit_lesson_data.py \
  apps/api/prisma/lesson-data/chinese/grade-2-volume-2/01-reading
```

The audit infers the subject from the directory path. For a math unit it also
checks math-specific structure, references, basic arithmetic, comparisons, and
answer constraints. Warnings such as a lesson count outside the preferred
18-20 range require review but do not fail the command; issues must be fixed.

Run the StudyZone loader against the course:

```bash
pnpm --filter @studyzone/api exec tsx -e "import { loadLessonData } from './prisma/lesson-data/loader'; const catalog = loadLessonData('./prisma/lesson-data'); console.log(catalog.subjects.length)"
```

For math, manually solve and inspect any question the audit cannot prove, especially application
problems, geometry, diagrams, tables, and expression-modeling questions. If the audit reports
issues, fix the underlying exercise; reshuffle only when the problem is specifically answer-order
randomness.

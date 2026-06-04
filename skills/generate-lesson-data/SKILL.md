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
   - All subjects (Chinese, math, English) use the same image-based page format: read `manifest.json` and `resource.json`, then use multimodal/vision inspection of relevant `pages/page-*.jpg` before planning or writing exercises.
   - Locate the unit boundaries from the textbook pages; confirm page numbers and lesson titles from the images.
   - Crop or zoom pages when needed to read tables, pinyin, footnotes,课后练习,园地, English word lists, picture dictionaries, and story pages accurately.
   - The repository's existing course metadata and lesson-data may reflect a different edition than the page images. When they conflict, follow the page images in `apps/web/public/assets/textbooks/<subject>/<grade-volume>/pages/` and flag the mismatch.
4. Extract the unit's learning targets from the textbook:
   - Required texts, new characters, writing characters from the textbook writing grid, vocabulary, exercises after the lesson, oral/reading tasks, and unit garden pages.
   - For Chinese, cover recognition, pinyin, word building, meaning, text comprehension, dictation/writing, recitation, sentence imitation, and integrated review.
   - For English, inventory each unit's strands before writing exercises: target vocabulary (with the unit's pictures), core sentence patterns / target structures (e.g. "What would you like?" / "I'd like…"), listening points, dialogue and oral-communication functions, the story / reading passage, phonics or "sounds" focus, and the spelling/writing words from the word list. Keep language, tenses, and vocabulary within the unit and grade; do not introduce structures from later units or grades.
   - Record the valid number range, operations, notation, units, and expected solution method for every math knowledge point. Do not introduce content from later grades or unrelated units.
   - When textbook images conflict with existing lesson-data or memory of another edition, follow the images in the repository.
5. Plan 18-20 lessons for the unit.
   - Do not create lessons named as preview/self-study/review phases.
   - Use skill-focused names such as "生字认读", "词语积累", "背诵拼图", "故事顺序", "句子仿照", "口算基础", "方法理解", "应用辨析", and "综合运用".
   - For math, split each textbook topic into meaningful learning steps rather than repeating one worksheet: concept/representation, direct calculation, method reasoning, comparison or classification, error diagnosis, application modeling, and integrated use.
   - For English, split each unit into skill strands rather than one big "vocabulary/sentences/story" trio. Use skill-focused names such as "单词认读" (word recognition), "听音辨义" (listening), "句型操练" (sentence patterns), "情景对话" (dialogue), "看图排序" (story ordering), "阅读理解" (reading), "拼写产出" (spelling), and "自然拼读" (phonics) when the unit supports it. Order them receptive→productive (recognize → listen → use → produce).
   - Keep prerequisites before applications and arrange difficulty from concrete to abstract. If the textbook unit genuinely cannot support 18 distinct lessons, create fewer high-quality lessons and explain the exception; never add unrelated content or duplicate exercises merely to reach the target. English units are typically lighter and picture-based, so they usually support fewer lessons than Chinese/math units — prefer a smaller number of distinct skill-strand lessons over padding, and let the audit's lesson-count warning stand as an accepted exception.
   - Keep each lesson at 10-15 exercises.
6. Clear and regenerate only the requested unit directory.
   - Preserve unrelated units and course metadata.
   - Write `lessons.json` plus one JSON file per lesson.
7. Use diverse exercise types supported by the docs and shared types.
   - English vocabulary and meaning: `translate_choice`, `translate_input`, `image_choice` (when textbook pictures help), and `match_pairs` for word↔meaning or word↔picture.
   - English listening: `listen_input` (dictation) and `listen_choice` (listen and pick the matching word/picture). Only use audio-backed types when audio assets exist or are clearly planned; otherwise prefer reading-based equivalents.
   - English sentences and communication: `word_bank` (sentence assembly), `dialogue_complete` (fill the missing dialogue line), and `single_choice` for grammar/usage.
   - English reading and sequencing: `reading_comprehension` (story/passage + sub-questions), `picture_order` (order story panels or "Listen and number" cards), and `true_false` for "Read and check" judgments.
   - Select English types by the lesson's strand: word-recognition lessons lean on `translate_choice`/`image_choice`/`match_pairs`; dialogue lessons on `dialogue_complete`; story lessons on `picture_order`/`reading_comprehension`. Do not force every type into every unit.
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
   - For `order_sequence` and `picture_order`, do not store `prompt.items` in the correct `orderedIds` order.
   - For `math_drag_fill`, shuffle tokens and include only plausible distractors.
   - For `listen_choice`, vary the correct option position and keep option ids stable after shuffling.
   - For `dialogue_complete`, distribute the correct `correctIndex` across option positions; do not let the right answer sit in the same slot every time.
   - For `reading_comprehension`, vary `correctIndices` across questions and across the unit; avoid all-true or all-first answer keys.
   - For `true_false`, keep roughly half true and half false within a lesson, and avoid long runs of the same answer.
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

## English Quality Rules

- Keep every prompt and option inside the unit's vocabulary, sentence patterns, and grade level. Do not use words, tenses, or structures the unit has not taught.
- For translation types, make the source unambiguous so exactly one option is a correct translation. Avoid near-synonym distractors that are also defensible answers.
- Keep `translate_input` / `listen_input` answers short and provide a sensible `tolerance` (single word: 1; short sentence: 2-3). List all acceptable surface forms (e.g. lowercase variant) in `accepted`.
- Only use audio-backed types (`listen_input`, `listen_choice`) when the referenced `audioUrl` assets exist or are explicitly planned; never invent audio URLs that will 404. Provide `audioUrlSlow` when a slow replay is expected.
- For `image_choice` and image-based `listen_choice`, reference real local asset paths under `/assets/...`; confirm the image actually depicts the target word and that distractor images are clearly different.
- For `dialogue_complete`, make the surrounding turns establish exactly one natural reply; the missing line must be the unique appropriate response, and distractors must be grammatical but contextually wrong. Set `blankIndex` to the `null`-text turn.
- For `reading_comprehension`, keep the passage grade-appropriate and short (a few sentences for grade 1-2). Every sub-question must be answerable from the passage with one correct option, and the whole exercise is graded all-or-nothing.
- For `picture_order`, give the cards a single correct sequence (a story or a logical/temporal order). Use stable ids and reference real card images when using `imageUrl`.
- For `true_false`, base the statement on the textbook page so its truth value is verifiable; keep statements unambiguous (avoid "sometimes/usually" wording that could be argued either way).
- Keep distractors plausible for the grade, and avoid repeating identical options within an option group or identical visible labels within a `match_pairs` column.

## Validation

Run the unit audit after writing lesson files:

```bash
# Chinese unit
python3 skills/generate-lesson-data/scripts/audit_lesson_data.py \
  apps/api/prisma/lesson-data/chinese/grade-2-volume-2/01-reading

# English unit
python3 skills/generate-lesson-data/scripts/audit_lesson_data.py \
  apps/api/prisma/lesson-data/english/grade-2-volume-2/01-playtime
```

The audit infers the subject from the directory path. For a math unit it also
checks math-specific structure, references, basic arithmetic, comparisons, and
answer constraints. For an English unit it additionally validates the
listening/dialogue/reading/ordering/true-false types (`listen_choice`,
`dialogue_complete`, `reading_comprehension`, `picture_order`, `true_false`):
option/answer integrity, `correctIndices` alignment, `picture_order` permutation
and non-ordered storage, and true/false answer balance. Warnings such as a lesson
count outside the preferred 18-20 range require review but do not fail the
command (English units are often legitimately shorter); issues must be fixed.

Run the StudyZone loader against the course:

```bash
pnpm --filter @studyzone/api exec tsx -e "import { loadLessonData } from './prisma/lesson-data/loader'; const catalog = loadLessonData('./prisma/lesson-data'); console.log(catalog.subjects.length)"
```

For math, manually solve and inspect any question the audit cannot prove, especially application
problems, geometry, diagrams, tables, and expression-modeling questions. If the audit reports
issues, fix the underlying exercise; reshuffle only when the problem is specifically answer-order
randomness.

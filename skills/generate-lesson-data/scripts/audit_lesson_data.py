#!/usr/bin/env python3
"""Audit StudyZone unit lesson-data for structure and answer-order patterns."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


INDEX_TYPES = {"single_choice", "pinyin_choice", "poem_complete"}


def contiguous_in_order(haystack: list[Any], needle: list[Any]) -> bool:
    if not needle or len(needle) > len(haystack):
        return False
    return any(haystack[i : i + len(needle)] == needle for i in range(len(haystack) - len(needle) + 1))


def duplicate_values(values: list[Any]) -> list[Any]:
    seen: set[str] = set()
    duplicates: list[Any] = []
    for value in values:
        key = json.dumps(value, ensure_ascii=False, sort_keys=True)
        if key in seen:
            duplicates.append(value)
        seen.add(key)
    return duplicates


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def audit(unit_dir: Path) -> tuple[dict[str, Any], list[str]]:
    issues: list[str] = []
    lessons_index = load_json(unit_dir / "lessons.json")
    lessons = lessons_index.get("lessons")
    if not isinstance(lessons, list):
        raise ValueError(f"{unit_dir / 'lessons.json'} must contain lessons array")

    stats: dict[str, Any] = {
        "lesson_count": len(lessons),
        "exercise_count": 0,
        "type_counts": Counter(),
        "index_answer_positions": defaultdict(Counter),
        "image_correct_positions": [],
        "word_bank_total": 0,
        "word_bank_contiguous_answer": 0,
        "word_build_total": 0,
        "word_build_grouped_answer": 0,
        "match_pairs_total": 0,
        "match_pairs_too_aligned": 0,
    }

    order_indices = [lesson.get("orderIndex") for lesson in lessons]
    if len(order_indices) != len(set(order_indices)):
        issues.append("lessons.json contains duplicate orderIndex values")

    for lesson in lessons:
        lesson_file = unit_dir / str(lesson.get("file"))
        data = load_json(lesson_file)
        exercises = data.get("exercises")
        if not isinstance(exercises, list):
            issues.append(f"{lesson_file.name}: exercises must be an array")
            continue
        if not 10 <= len(exercises) <= 15:
            issues.append(f"{lesson_file.name}: expected 10-15 exercises, got {len(exercises)}")
        stats["exercise_count"] += len(exercises)

        for index, exercise in enumerate(exercises, start=1):
            ex_type = exercise.get("type")
            prompt = exercise.get("prompt", {})
            answer = exercise.get("answer", {})
            stats["type_counts"][ex_type] += 1

            if not isinstance(prompt, dict) or not isinstance(answer, dict):
                issues.append(f"{lesson_file.name}#{index}: prompt and answer must be objects")
                continue

            options = prompt.get("options")
            if isinstance(options, list):
                duplicates = duplicate_values(options)
                if duplicates:
                    issues.append(f"{lesson_file.name}#{index}: duplicate options {duplicates}")

            if ex_type in INDEX_TYPES:
                correct_index = answer.get("correctIndex")
                if not isinstance(correct_index, int):
                    issues.append(f"{lesson_file.name}#{index}: missing integer correctIndex")
                elif isinstance(options, list) and not 0 <= correct_index < len(options):
                    issues.append(f"{lesson_file.name}#{index}: correctIndex out of range")
                else:
                    stats["index_answer_positions"][ex_type][correct_index] += 1

            if ex_type == "poem_multi_blank":
                blanks = prompt.get("blanks", [])
                correct_indices = answer.get("correctIndices", [])
                if len(blanks) != len(correct_indices):
                    issues.append(f"{lesson_file.name}#{index}: blanks and correctIndices length mismatch")
                for blank_index, blank in enumerate(blanks):
                    blank_options = blank.get("options", []) if isinstance(blank, dict) else []
                    duplicates = duplicate_values(blank_options)
                    if duplicates:
                        issues.append(
                            f"{lesson_file.name}#{index}: duplicate poem blank options {duplicates}"
                        )
                    if blank_index < len(correct_indices):
                        stats["index_answer_positions"][ex_type][correct_indices[blank_index]] += 1

            if ex_type == "image_choice":
                image_options = prompt.get("options", [])
                correct_id = answer.get("correctOptionId")
                position = next(
                    (i for i, option in enumerate(image_options) if option.get("id") == correct_id),
                    -1,
                )
                stats["image_correct_positions"].append(position)
                if position < 0:
                    issues.append(f"{lesson_file.name}#{index}: image correctOptionId not found")

            if ex_type == "word_bank":
                stats["word_bank_total"] += 1
                tokens = prompt.get("tokens", [])
                ordered = answer.get("ordered", [])
                if contiguous_in_order(tokens, ordered):
                    stats["word_bank_contiguous_answer"] += 1
                    issues.append(f"{lesson_file.name}#{index}: word_bank answer is contiguous in tokens")

            if ex_type == "word_build":
                stats["word_build_total"] += 1
                tokens = prompt.get("tokens", [])
                first_set = (answer.get("acceptedSets") or [[]])[0]
                if contiguous_in_order(tokens, first_set):
                    stats["word_build_grouped_answer"] += 1
                    issues.append(f"{lesson_file.name}#{index}: word_build first accepted set is grouped")

            if ex_type == "match_pairs":
                stats["match_pairs_total"] += 1
                left = prompt.get("left", [])
                right = prompt.get("right", [])
                pairs = answer.get("pairs", {})
                same_position = 0
                for i, left_item in enumerate(left[: len(right)]):
                    if pairs.get(left_item.get("id")) == right[i].get("id"):
                        same_position += 1
                if same_position >= max(1, (min(len(left), len(right)) + 1) // 2):
                    stats["match_pairs_too_aligned"] += 1
                    issues.append(f"{lesson_file.name}#{index}: match_pairs has too many same-row matches")

    stats["type_counts"] = dict(stats["type_counts"])
    stats["index_answer_positions"] = {
        key: dict(value) for key, value in stats["index_answer_positions"].items()
    }
    return stats, issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("unit_dir", type=Path)
    args = parser.parse_args()
    stats, issues = audit(args.unit_dir)
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    if issues:
        print("\nIssues:")
        for issue in issues:
            print(f"- {issue}")
        return 1
    print("\nOK: lesson-data audit passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

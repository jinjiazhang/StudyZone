#!/usr/bin/env python3
"""Audit StudyZone unit lesson-data for structure, answers, and answer-order patterns."""

from __future__ import annotations

import argparse
import ast
import json
import math
import operator
import re
from collections import Counter, defaultdict
from fractions import Fraction
from pathlib import Path
from typing import Any


INDEX_TYPES = {"translate_choice", "single_choice", "pinyin_choice", "poem_complete", "dialogue_complete"}
MATH_DIR_NAME = "math"
ENGLISH_DIR_NAME = "english"
MATH_EXPRESSION_RE = re.compile(r"^\s*(.+?)\s*=\s*\?\s*$")
REMAINDER_NUMERIC_RE = re.compile(
    r"^\s*(-?\d+)\s*[÷/]\s*(-?\d+)\s*=\s*(-?\d+)\s*(?:\.{3,}|…+)\s*\?\s*$"
)
REMAINDER_MULTI_RE = re.compile(
    r"^\s*(-?\d+)\s*[÷/]\s*(-?\d+)\s*=\s*(?:_+|\?)\s*(?:\.{3,}|…+)\s*(?:_+|\?)\s*$"
)
MATH_BINARY_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
}
MATH_UNARY_OPERATORS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


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


def visible_value(value: Any) -> str | None:
    if isinstance(value, (str, int, float)):
        return str(value)
    if not isinstance(value, dict):
        return None
    for field in ("text", "label", "word"):
        visible = value.get(field)
        if isinstance(visible, (str, int, float)) and str(visible).strip():
            return str(visible)
    return None


def duplicate_visible_values(values: list[Any]) -> list[str]:
    visible = [item for value in values if (item := visible_value(value)) is not None]
    return [str(value) for value in duplicate_values(visible)]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def normalized_expression(value: str) -> str:
    return value.replace("×", "*").replace("÷", "/").replace("−", "-").replace(" ", "")


def judge_normalized_expression(value: str) -> str:
    return re.sub(r"\s+", "", value).lower()


def evaluate_math_expression(value: Any) -> Fraction | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        tree = ast.parse(normalized_expression(value), mode="eval")
        return evaluate_math_node(tree.body)
    except (SyntaxError, TypeError, ValueError, ZeroDivisionError):
        return None


def evaluate_math_node(node: ast.AST) -> Fraction:
    if isinstance(node, ast.Constant) and is_number(node.value):
        return Fraction(str(node.value))
    if isinstance(node, ast.BinOp) and type(node.op) in MATH_BINARY_OPERATORS:
        left = evaluate_math_node(node.left)
        right = evaluate_math_node(node.right)
        return MATH_BINARY_OPERATORS[type(node.op)](left, right)
    if isinstance(node, ast.UnaryOp) and type(node.op) in MATH_UNARY_OPERATORS:
        return MATH_UNARY_OPERATORS[type(node.op)](evaluate_math_node(node.operand))
    raise ValueError("unsupported math expression")


def valid_tolerance(value: Any) -> bool:
    return value is None or (is_number(value) and value >= 0)


def values_within_tolerance(actual: Fraction, expected: Any, tolerance: Any) -> bool:
    if not is_number(expected) or not valid_tolerance(tolerance):
        return False
    allowed = Fraction(str(tolerance or 0))
    return abs(actual - Fraction(str(expected))) <= allowed


def item_ids(items: Any) -> list[str]:
    if not isinstance(items, list):
        return []
    return [item.get("id") for item in items if isinstance(item, dict) and isinstance(item.get("id"), str)]


def infer_subject(unit_dir: Path) -> str | None:
    parts = unit_dir.resolve().parts
    for subject in ("math", "chinese", "english"):
        if subject in parts:
            return subject
    return None


def audit_math_exercise(
    lesson_name: str,
    index: int,
    ex_type: Any,
    prompt: dict[str, Any],
    answer: dict[str, Any],
    issues: list[str],
) -> None:
    label = f"{lesson_name}#{index}"

    if ex_type == "numeric_input":
        value = answer.get("value")
        tolerance = answer.get("tolerance")
        if not is_number(value):
            issues.append(f"{label}: numeric_input answer.value must be a finite number")
        if not valid_tolerance(tolerance):
            issues.append(f"{label}: numeric_input tolerance must be a non-negative number")
        statement = prompt.get("statement")
        match = MATH_EXPRESSION_RE.fullmatch(statement) if isinstance(statement, str) else None
        result = evaluate_math_expression(match.group(1)) if match else None
        if result is not None and not values_within_tolerance(result, value, tolerance):
            issues.append(f"{label}: numeric_input answer does not match the displayed calculation")
        remainder_match = REMAINDER_NUMERIC_RE.fullmatch(statement) if isinstance(statement, str) else None
        if remainder_match and is_number(value):
            dividend, divisor, quotient = map(int, remainder_match.groups())
            if divisor == 0 or dividend != divisor * quotient + value or not 0 <= value < abs(divisor):
                issues.append(f"{label}: numeric_input remainder answer is invalid")

    if ex_type == "expression_input":
        accepted = answer.get("accepted")
        if not isinstance(accepted, list) or not accepted or not all(isinstance(item, str) and item for item in accepted):
            issues.append(f"{label}: expression_input answer.accepted must contain expressions")
        elif len({judge_normalized_expression(item) for item in accepted}) != len(accepted):
            issues.append(f"{label}: expression_input contains duplicate normalized accepted expressions")

    if ex_type == "multi_numeric_input":
        blanks = prompt.get("blanks")
        values = answer.get("values")
        tolerances = answer.get("tolerances")
        if not isinstance(blanks, list) or not isinstance(values, list) or len(blanks) != len(values):
            issues.append(f"{label}: multi_numeric_input blanks and values must have equal lengths")
        if isinstance(tolerances, list) and isinstance(values, list) and len(tolerances) != len(values):
            issues.append(f"{label}: multi_numeric_input tolerances and values must have equal lengths")
        if isinstance(values, list) and not all(is_number(value) for value in values):
            issues.append(f"{label}: multi_numeric_input values must be finite numbers")
        if isinstance(tolerances, list) and not all(valid_tolerance(value) for value in tolerances):
            issues.append(f"{label}: multi_numeric_input tolerances must be non-negative numbers")
        statement = prompt.get("statement")
        remainder_match = REMAINDER_MULTI_RE.fullmatch(statement) if isinstance(statement, str) else None
        if remainder_match and isinstance(values, list) and len(values) == 2 and all(is_number(value) for value in values):
            dividend, divisor = map(int, remainder_match.groups())
            quotient, remainder = values
            if divisor == 0 or dividend != divisor * quotient + remainder or not 0 <= remainder < abs(divisor):
                issues.append(f"{label}: multi_numeric_input quotient or remainder is invalid")

    if ex_type == "order_sequence":
        ids = item_ids(prompt.get("items"))
        ordered_ids = answer.get("orderedIds")
        if len(ids) != len(set(ids)):
            issues.append(f"{label}: order_sequence item ids must be unique")
        if not isinstance(ordered_ids, list) or Counter(ids) != Counter(ordered_ids):
            issues.append(f"{label}: order_sequence orderedIds must be a permutation of item ids")
        elif ids == ordered_ids:
            issues.append(f"{label}: order_sequence prompt items are already in answer order")

    if ex_type == "compare_input":
        op = answer.get("operator")
        if op not in {"<", ">", "="}:
            issues.append(f"{label}: compare_input operator must be <, >, or =")
        left = evaluate_math_expression(prompt.get("left"))
        right = evaluate_math_expression(prompt.get("right"))
        if left is not None and right is not None:
            expected = "<" if left < right else ">" if left > right else "="
            if op != expected:
                issues.append(f"{label}: compare_input operator does not match the displayed expressions")

    if ex_type == "math_drag_fill":
        statement = prompt.get("statement")
        tokens = prompt.get("tokens")
        fills = answer.get("fills")
        blank_count = statement.count(None) if isinstance(statement, list) else -1
        if blank_count < 0 or not isinstance(fills, list) or blank_count != len(fills):
            issues.append(f"{label}: math_drag_fill null blanks and fills must have equal lengths")
        if not isinstance(tokens, list) or not isinstance(fills, list) or any(fill not in tokens for fill in fills):
            issues.append(f"{label}: every math_drag_fill answer must exist in prompt.tokens")
        elif contiguous_in_order(tokens, fills):
            issues.append(f"{label}: math_drag_fill answers are contiguous in prompt.tokens")

    if ex_type == "geometry_choice":
        options = prompt.get("options")
        ids = item_ids(options)
        correct_id = answer.get("correctOptionId")
        if len(ids) != len(set(ids)):
            issues.append(f"{label}: geometry_choice option ids must be unique")
        if correct_id not in ids:
            issues.append(f"{label}: geometry_choice correctOptionId not found")
        if isinstance(options, list):
            for option_index, option in enumerate(options, start=1):
                if not isinstance(option, dict) or not any(option.get(field) for field in ("label", "imageUrl", "svg")):
                    issues.append(f"{label}: geometry_choice option {option_index} has no visible content")

    if ex_type == "clock_input":
        hour = answer.get("hour")
        minute = answer.get("minute")
        if not isinstance(hour, int) or not isinstance(minute, int) or not 0 <= minute < 60:
            issues.append(f"{label}: clock_input answer must contain a valid hour and minute")
        clock = prompt.get("clock")
        if isinstance(clock, dict):
            clock_hour = clock.get("hour")
            clock_minute = clock.get("minute")
            if not isinstance(clock_hour, int) or not isinstance(clock_minute, int) or not 0 <= clock_minute < 60:
                issues.append(f"{label}: clock_input prompt.clock must contain a valid hour and minute")
            elif (
                prompt.get("mode") == "read"
                and isinstance(hour, int)
                and isinstance(minute, int)
                and (clock_hour % 12, clock_minute) != (hour % 12, minute)
            ):
                issues.append(f"{label}: clock_input read-mode answer does not match prompt.clock")

    if ex_type == "unit_conversion":
        if not is_number(answer.get("value")) or not valid_tolerance(answer.get("tolerance")):
            issues.append(f"{label}: unit_conversion requires a finite value and non-negative tolerance")
        if answer.get("unit") != prompt.get("toUnit"):
            issues.append(f"{label}: unit_conversion answer.unit must equal prompt.toUnit")
        if not prompt.get("fromUnit") or not prompt.get("toUnit"):
            issues.append(f"{label}: unit_conversion requires fromUnit and toUnit")

    if ex_type == "fraction_input":
        numerator = answer.get("numerator")
        denominator = answer.get("denominator")
        if not isinstance(numerator, int) or not isinstance(denominator, int) or denominator <= 0:
            issues.append(f"{label}: fraction_input requires integer numerator and positive denominator")
        if "allowEquivalent" in answer and not isinstance(answer.get("allowEquivalent"), bool):
            issues.append(f"{label}: fraction_input allowEquivalent must be boolean")

    if ex_type == "table_read":
        columns = prompt.get("columns")
        rows = prompt.get("rows")
        if not isinstance(columns, list) or not columns or len(columns) != len(set(columns)):
            issues.append(f"{label}: table_read columns must be a non-empty unique list")
        if not isinstance(rows, list) or not rows:
            issues.append(f"{label}: table_read rows must be a non-empty list")
        elif isinstance(columns, list) and any(not isinstance(row, dict) or any(col not in row for col in columns) for row in rows):
            issues.append(f"{label}: every table_read row must contain every column")
        if not is_number(answer.get("value")) and not (
            isinstance(answer.get("accepted"), list) and answer.get("accepted")
        ):
            issues.append(f"{label}: table_read answer requires value or accepted")

    if ex_type == "number_line":
        minimum = prompt.get("min")
        maximum = prompt.get("max")
        step = prompt.get("step")
        value = answer.get("value")
        if not all(is_number(item) for item in (minimum, maximum, value)) or minimum >= maximum:
            issues.append(f"{label}: number_line requires finite min < max and answer.value")
        elif not minimum <= value <= maximum:
            issues.append(f"{label}: number_line answer.value must be within min and max")
        if step is not None and (not is_number(step) or step <= 0):
            issues.append(f"{label}: number_line step must be positive")
        if not valid_tolerance(answer.get("tolerance")):
            issues.append(f"{label}: number_line tolerance must be non-negative")

    if ex_type == "geometry_draw" and "expected" not in answer:
        issues.append(f"{label}: geometry_draw answer.expected is required")


def audit_english_exercise(
    lesson_name: str,
    index: int,
    ex_type: Any,
    prompt: dict[str, Any],
    answer: dict[str, Any],
    stats: dict[str, Any],
    issues: list[str],
) -> None:
    label = f"{lesson_name}#{index}"

    if ex_type == "listen_choice":
        options = prompt.get("options")
        if not isinstance(options, list) or len(options) < 2:
            issues.append(f"{label}: listen_choice requires at least two options")
            options = options if isinstance(options, list) else []
        if not prompt.get("audioUrl"):
            issues.append(f"{label}: listen_choice requires prompt.audioUrl")
        for option_index, option in enumerate(options, start=1):
            if not isinstance(option, dict) or not any(option.get(field) for field in ("text", "label", "imageUrl")):
                issues.append(f"{label}: listen_choice option {option_index} has no visible content")
        correct_id = answer.get("correctOptionId")
        position = next(
            (i for i, option in enumerate(options) if isinstance(option, dict) and option.get("id") == correct_id),
            -1,
        )
        stats["listen_correct_positions"].append(position)
        if position < 0:
            issues.append(f"{label}: listen_choice correctOptionId not found")

    if ex_type == "true_false":
        value = answer.get("value")
        if not isinstance(value, bool):
            issues.append(f"{label}: true_false answer.value must be a boolean")
        else:
            stats["true_false_values"]["true" if value else "false"] += 1
        if not isinstance(prompt.get("statement"), str) or not prompt.get("statement"):
            issues.append(f"{label}: true_false requires a non-empty statement")

    if ex_type == "dialogue_complete":
        turns = prompt.get("turns")
        blank_index = prompt.get("blankIndex")
        options = prompt.get("options")
        if not isinstance(turns, list) or not turns:
            issues.append(f"{label}: dialogue_complete requires a non-empty turns array")
        elif not isinstance(blank_index, int) or not 0 <= blank_index < len(turns):
            issues.append(f"{label}: dialogue_complete blankIndex out of range")
        elif turns[blank_index].get("text") not in (None, ""):
            issues.append(f"{label}: dialogue_complete turn at blankIndex must have null/empty text")
        if not isinstance(options, list) or len(options) < 2:
            issues.append(f"{label}: dialogue_complete requires at least two options")

    if ex_type == "picture_order":
        ids = item_ids(prompt.get("items"))
        ordered_ids = answer.get("orderedIds")
        if len(ids) < 2:
            issues.append(f"{label}: picture_order requires at least two items")
        if len(ids) != len(set(ids)):
            issues.append(f"{label}: picture_order item ids must be unique")
        if not isinstance(ordered_ids, list) or Counter(ids) != Counter(ordered_ids):
            issues.append(f"{label}: picture_order orderedIds must be a permutation of item ids")
        elif ids == ordered_ids:
            issues.append(f"{label}: picture_order prompt items are already in answer order")

    if ex_type == "reading_comprehension":
        passage = prompt.get("passage")
        questions = prompt.get("questions")
        correct_indices = answer.get("correctIndices")
        if not isinstance(passage, str) or not passage.strip():
            issues.append(f"{label}: reading_comprehension requires a non-empty passage")
        if not isinstance(questions, list) or not questions:
            issues.append(f"{label}: reading_comprehension requires a non-empty questions array")
            return
        if not isinstance(correct_indices, list) or len(correct_indices) != len(questions):
            issues.append(f"{label}: reading_comprehension questions and correctIndices length mismatch")
            return
        for q_index, question in enumerate(questions):
            q_options = question.get("options", []) if isinstance(question, dict) else []
            if not isinstance(q_options, list) or len(q_options) < 2:
                issues.append(f"{label}: reading_comprehension question {q_index + 1} needs at least two options")
                continue
            duplicates = duplicate_values(q_options)
            if duplicates:
                issues.append(f"{label}: duplicate reading_comprehension options {duplicates}")
            correct_index = correct_indices[q_index]
            if not isinstance(correct_index, int) or not 0 <= correct_index < len(q_options):
                issues.append(f"{label}: reading_comprehension correctIndex out of range")
            else:
                stats["index_answer_positions"]["reading_comprehension"][correct_index] += 1


def audit(unit_dir: Path) -> tuple[dict[str, Any], list[str], list[str]]:
    issues: list[str] = []
    warnings: list[str] = []
    subject = infer_subject(unit_dir)
    lessons_index = load_json(unit_dir / "lessons.json")
    lessons = lessons_index.get("lessons")
    if not isinstance(lessons, list):
        raise ValueError(f"{unit_dir / 'lessons.json'} must contain lessons array")

    stats: dict[str, Any] = {
        "subject": subject,
        "lesson_count": len(lessons),
        "exercise_count": 0,
        "type_counts": Counter(),
        "index_answer_positions": defaultdict(Counter),
        "image_correct_positions": [],
        "geometry_correct_positions": [],
        "word_bank_total": 0,
        "word_bank_contiguous_answer": 0,
        "word_build_total": 0,
        "word_build_grouped_answer": 0,
        "match_pairs_total": 0,
        "match_pairs_too_aligned": 0,
        "listen_correct_positions": [],
        "true_false_values": Counter(),
    }

    if not 18 <= len(lessons) <= 20:
        warnings.append(f"preferred 18-20 lessons per unit, got {len(lessons)}")

    order_indices = [lesson.get("orderIndex") for lesson in lessons]
    if len(order_indices) != len(set(order_indices)):
        issues.append("lessons.json contains duplicate orderIndex values")
    lesson_files = [lesson.get("file") for lesson in lessons]
    if len(lesson_files) != len(set(lesson_files)):
        issues.append("lessons.json contains duplicate lesson file values")

    for lesson in lessons:
        lesson_file = unit_dir / str(lesson.get("file"))
        if not lesson_file.is_file():
            issues.append(f"{lesson_file.name}: lesson file not found")
            continue
        data = load_json(lesson_file)
        exercises = data.get("exercises")
        if not isinstance(exercises, list):
            issues.append(f"{lesson_file.name}: exercises must be an array")
            continue
        if not 10 <= len(exercises) <= 15:
            issues.append(f"{lesson_file.name}: expected 10-15 exercises, got {len(exercises)}")
        stats["exercise_count"] += len(exercises)
        seen_exercises: dict[str, int] = {}

        for index, exercise in enumerate(exercises, start=1):
            if not isinstance(exercise, dict):
                issues.append(f"{lesson_file.name}#{index}: exercise must be an object")
                continue
            ex_type = exercise.get("type")
            prompt = exercise.get("prompt", {})
            answer = exercise.get("answer", {})
            difficulty = exercise.get("difficulty", 1)
            stats["type_counts"][ex_type] += 1

            if not isinstance(ex_type, str) or not ex_type:
                issues.append(f"{lesson_file.name}#{index}: type must be a non-empty string")
            if not isinstance(difficulty, int) or isinstance(difficulty, bool) or difficulty not in {1, 2, 3}:
                issues.append(f"{lesson_file.name}#{index}: difficulty must be 1, 2, or 3")
            if not isinstance(prompt, dict) or not isinstance(answer, dict):
                issues.append(f"{lesson_file.name}#{index}: prompt and answer must be objects")
                continue

            exercise_key = json.dumps({"type": ex_type, "prompt": prompt, "answer": answer}, ensure_ascii=False, sort_keys=True)
            if exercise_key in seen_exercises:
                issues.append(
                    f"{lesson_file.name}#{index}: duplicate exercise content matches #{seen_exercises[exercise_key]}"
                )
            else:
                seen_exercises[exercise_key] = index

            options = prompt.get("options")
            if isinstance(options, list):
                duplicates = duplicate_values(options)
                if duplicates:
                    issues.append(f"{lesson_file.name}#{index}: duplicate options {duplicates}")
                visible_duplicates = duplicate_visible_values(options)
                if visible_duplicates:
                    issues.append(f"{lesson_file.name}#{index}: duplicate visible options {visible_duplicates}")

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
                if not isinstance(blanks, list) or not isinstance(correct_indices, list) or len(blanks) != len(correct_indices):
                    issues.append(f"{lesson_file.name}#{index}: blanks and correctIndices length mismatch")
                    continue
                for blank_index, blank in enumerate(blanks):
                    blank_options = blank.get("options", []) if isinstance(blank, dict) else []
                    duplicates = duplicate_values(blank_options)
                    if duplicates:
                        issues.append(f"{lesson_file.name}#{index}: duplicate poem blank options {duplicates}")
                    correct_index = correct_indices[blank_index]
                    if not isinstance(correct_index, int) or not 0 <= correct_index < len(blank_options):
                        issues.append(f"{lesson_file.name}#{index}: poem blank correctIndex out of range")
                    else:
                        stats["index_answer_positions"][ex_type][correct_index] += 1

            if ex_type == "image_choice":
                image_options = prompt.get("options", [])
                correct_id = answer.get("correctOptionId")
                position = next(
                    (i for i, option in enumerate(image_options) if isinstance(option, dict) and option.get("id") == correct_id),
                    -1,
                )
                stats["image_correct_positions"].append(position)
                if position < 0:
                    issues.append(f"{lesson_file.name}#{index}: image correctOptionId not found")

            if ex_type == "geometry_choice":
                geometry_options = prompt.get("options", [])
                correct_id = answer.get("correctOptionId")
                position = next(
                    (i for i, option in enumerate(geometry_options) if isinstance(option, dict) and option.get("id") == correct_id),
                    -1,
                )
                stats["geometry_correct_positions"].append(position)

            if ex_type == "word_bank":
                stats["word_bank_total"] += 1
                tokens = prompt.get("tokens", [])
                ordered = answer.get("ordered", [])
                if not isinstance(tokens, list) or not isinstance(ordered, list) or any(token not in tokens for token in ordered):
                    issues.append(f"{lesson_file.name}#{index}: every word_bank answer token must exist in prompt.tokens")
                elif contiguous_in_order(tokens, ordered):
                    stats["word_bank_contiguous_answer"] += 1
                    issues.append(f"{lesson_file.name}#{index}: word_bank answer is contiguous in tokens")

            if ex_type == "word_build":
                stats["word_build_total"] += 1
                tokens = prompt.get("tokens", [])
                accepted_sets = answer.get("acceptedSets")
                if not isinstance(tokens, list) or not isinstance(accepted_sets, list) or not accepted_sets:
                    issues.append(f"{lesson_file.name}#{index}: word_build requires tokens and acceptedSets")
                else:
                    for accepted_set in accepted_sets:
                        if not isinstance(accepted_set, list) or any(token not in tokens for token in accepted_set):
                            issues.append(f"{lesson_file.name}#{index}: every word_build answer token must exist in prompt.tokens")
                            break
                    first_set = accepted_sets[0]
                    if isinstance(first_set, list) and contiguous_in_order(tokens, first_set):
                        stats["word_build_grouped_answer"] += 1
                        issues.append(f"{lesson_file.name}#{index}: word_build first accepted set is grouped")

            if ex_type == "match_pairs":
                stats["match_pairs_total"] += 1
                raw_left = prompt.get("left", [])
                raw_right = prompt.get("right", [])
                left = raw_left if isinstance(raw_left, list) else []
                right = raw_right if isinstance(raw_right, list) else []
                pairs = answer.get("pairs", {})
                if not isinstance(raw_left, list) or not isinstance(raw_right, list):
                    issues.append(f"{lesson_file.name}#{index}: match_pairs left and right must be arrays")
                left_ids = item_ids(left)
                right_ids = item_ids(right)
                if len(left_ids) != len(set(left_ids)) or len(right_ids) != len(set(right_ids)):
                    issues.append(f"{lesson_file.name}#{index}: match_pairs ids must be unique")
                if not isinstance(pairs, dict) or set(pairs) != set(left_ids) or any(value not in right_ids for value in pairs.values()):
                    issues.append(f"{lesson_file.name}#{index}: match_pairs answer must map every left id to a right id")
                visible_duplicates = duplicate_visible_values(right)
                if visible_duplicates:
                    issues.append(f"{lesson_file.name}#{index}: duplicate visible right-side matches {visible_duplicates}")
                left_visible_duplicates = duplicate_visible_values(left)
                if left_visible_duplicates:
                    issues.append(f"{lesson_file.name}#{index}: duplicate visible left-side matches {left_visible_duplicates}")
                same_position = 0
                if isinstance(pairs, dict):
                    for i, left_item in enumerate(left[: len(right)]):
                        if isinstance(left_item, dict) and isinstance(right[i], dict) and pairs.get(left_item.get("id")) == right[i].get("id"):
                            same_position += 1
                if same_position >= max(1, (min(len(left), len(right)) + 1) // 2):
                    stats["match_pairs_too_aligned"] += 1
                    issues.append(f"{lesson_file.name}#{index}: match_pairs has too many same-row matches")

            if subject == MATH_DIR_NAME:
                audit_math_exercise(lesson_file.name, index, ex_type, prompt, answer, issues)
            if subject == ENGLISH_DIR_NAME:
                audit_english_exercise(lesson_file.name, index, ex_type, prompt, answer, stats, issues)

    stats["type_counts"] = dict(stats["type_counts"])
    stats["true_false_values"] = dict(stats["true_false_values"])
    stats["index_answer_positions"] = {
        key: dict(value) for key, value in stats["index_answer_positions"].items()
    }
    return stats, issues, warnings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("unit_dir", type=Path)
    args = parser.parse_args()
    stats, issues, warnings = audit(args.unit_dir)
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"- {warning}")
    if issues:
        print("\nIssues:")
        for issue in issues:
            print(f"- {issue}")
        return 1
    print("\nOK: lesson-data audit passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

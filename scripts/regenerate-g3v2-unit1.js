const fs = require("node:fs");
const path = require("node:path");

const unitDir = path.join(
  __dirname,
  "..",
  "apps/api/prisma/lesson-data/math/grade-3-volume-2/01-division",
);

const lessonSpecs = [
  ["01-array-representation.json", "点阵表示", "•"],
  ["02-place-value-decompose.json", "数位分解", "▦"],
  ["03-no-carry-vertical.json", "不进位竖式", "×"],
  ["04-price-quantity.json", "价格数量应用", "¥"],
  ["05-carry-basics.json", "进位乘法基础", "↗"],
  ["06-carry-error-diagnosis.json", "进位错误诊断", "?"],
  ["07-carry-fluency.json", "连续进位计算", "≡"],
  ["08-subsidy-and-ticket.json", "补贴票价应用", "$"],
  ["09-zero-meaning.json", "神奇的0", "0"],
  ["10-zero-in-numbers.json", "含0数乘法", "□"],
  ["11-zero-vertical-fill.json", "含0竖式补空", "▣"],
  ["12-distance-model.json", "路程模型", "→"],
  ["13-route-diagram.json", "路线图理解", "⌁"],
  ["14-chain-multiplication.json", "连乘意义", "××"],
  ["15-chain-calculation.json", "连乘计算", "()"],
  ["16-shopping-plans.json", "方案列表省钱", "表"],
  ["17-estimation.json", "估算方法", "≈"],
  ["18-integrated-use.json", "综合运用", "★"],
];

function n(statement, value, difficulty = 1) {
  return {
    type: "numeric_input",
    prompt: { statement },
    answer: { value, tolerance: 0 },
    difficulty,
  };
}

function mn(statement, blanks, values, difficulty = 2) {
  return {
    type: "multi_numeric_input",
    prompt: { statement, blanks: blanks.map((id) => ({ id })) },
    answer: { values, tolerances: values.map(() => 0) },
    difficulty,
  };
}

function expr(statement, accepted, difficulty = 2) {
  return {
    type: "expression_input",
    prompt: { statement, placeholder: "列出算式" },
    answer: { accepted },
    difficulty,
  };
}

const choicePattern = [2, 0, 3, 1, 1, 3, 0, 2, 0, 3, 2, 1];
let choiceCursor = 0;

function choice(question, correct, distractors, difficulty = 2) {
  const options = [];
  const desired = choicePattern[choiceCursor++ % choicePattern.length];
  const pool = [...new Set(distractors.filter((item) => item !== correct))].slice(0, 3);
  while (pool.length < 3) pool.push(`${correct}（不对）${pool.length + 1}`);
  for (let i = 0; i < 4; i += 1) {
    options[i] = i === desired ? correct : pool.shift();
  }
  return {
    type: "single_choice",
    prompt: { question, options },
    answer: { correctIndex: desired },
    difficulty,
  };
}

function cmp(left, right, difficulty = 1) {
  const lv = evalMath(left);
  const rv = evalMath(right);
  return {
    type: "compare_input",
    prompt: { left, right },
    answer: { operator: lv < rv ? "<" : lv > rv ? ">" : "=" },
    difficulty,
  };
}

function drag(statement, fills, tokens, difficulty = 2) {
  return {
    type: "math_drag_fill",
    prompt: { statement, tokens },
    answer: { fills },
    difficulty,
  };
}

function order(instruction, values, difficulty = 1) {
  const shuffled = [...values].sort((a, b) => String(b).localeCompare(String(a), "zh-CN"));
  const items = shuffled.map((value, index) => ({ id: `i${index}_${value}`, text: String(value) }));
  const ordered = [...values].sort((a, b) => a - b);
  return {
    type: "order_sequence",
    prompt: { instruction, items },
    answer: { orderedIds: ordered.map((value) => items.find((item) => item.text === String(value)).id) },
    difficulty,
  };
}

function table(question, columns, rows, answer, difficulty = 2) {
  return {
    type: "table_read",
    prompt: { question, columns, rows },
    answer: typeof answer === "number" ? { value: answer, tolerance: 0 } : { accepted: [answer] },
    difficulty,
  };
}

function tf(statement, value, difficulty = 1) {
  return {
    type: "true_false",
    prompt: { statement },
    answer: { value },
    difficulty,
  };
}

function pairs(entries, difficulty = 2) {
  const left = entries.map(([l], index) => ({ id: `l${index}`, text: l }));
  const rightBase = entries.map(([, r], index) => ({ id: `r${index}`, text: r }));
  const right = [rightBase[2], rightBase[3], rightBase[0], rightBase[1]];
  return {
    type: "match_pairs",
    prompt: { left, right },
    answer: { pairs: Object.fromEntries(entries.map((_, index) => [`l${index}`, `r${index}`])) },
    difficulty,
  };
}

function evalMath(value) {
  return Function(`"use strict"; return (${value.replaceAll("×", "*").replaceAll("÷", "/")});`)();
}

function mulItems(items) {
  return items.map(([a, b]) => n(`${a} × ${b} = ?`, a * b, 1));
}

const lessons = [
  [
    ...mulItems([[12, 4], [13, 3], [21, 4], [32, 2]]),
    mn("12 × 4：10 × 4 = __，2 × 4 = __，合起来 __", ["tens", "ones", "total"], [40, 8, 48]),
    mn("23 × 3：20 × 3 = __，3 × 3 = __，合起来 __", ["tens", "ones", "total"], [60, 9, 69]),
    expr("把 4 行、每行 12 人表示成乘法算式。", ["12×4", "4×12"]),
    choice("点子图分成 10×5 和 2×5，表示的算式是？", "12×5", ["10×5", "2×5", "15×2"]),
    cmp("12 × 4", "10 × 4"),
    order("按积从小到大排列", [12 * 3, 12 * 4, 12 * 5, 12 * 2]),
  ],
  [
    ...mulItems([[213, 3], [124, 2], [312, 3]]),
    mn("213 × 3：200 × 3 = __，10 × 3 = __，3 × 3 = __，总数 __", ["hundreds", "tens", "ones", "total"], [600, 30, 9, 639]),
    mn("214 × 2：200 × 2 = __，10 × 2 = __，4 × 2 = __，总数 __", ["hundreds", "tens", "ones", "total"], [400, 20, 8, 428]),
    drag(["364 × 2 可以分成", null, "+", null, "+", null], ["600", "120", "8"], ["8", "600", "2", "120", "728"]),
    choice("计算 123×3 时，百位上的 1 要乘几？", "3", ["1", "2", "6"]),
    cmp("213 × 3", "600 + 30 + 9"),
    pairs([["123×3", "369"], ["214×2", "428"], ["312×3", "936"], ["122×4", "488"]]),
    tf("三位数乘一位数时，可以按百位、十位、个位分别乘，再相加。", true),
  ],
  [
    ...mulItems([[22, 4], [31, 3], [123, 3], [214, 2], [312, 2], [421, 2]]),
    mn("竖式 214 × 2 的个位、十位、百位结果分别是 __、__、__", ["ones", "tens", "hundreds"], [8, 2, 4]),
    choice("31×3 的竖式积应写成？", "93", ["39", "63", "903"]),
    cmp("214 × 2", "123 × 3"),
    drag(["22", null, "4", null, "88"], ["×", "="], ["=", "+", "×", "88"]),
    tf("计算 31×3 时，十位上的 3 表示 30。", true),
  ],
  [
    expr("夹克每件124元，买2件夹克，列式求总价。", ["124×2", "2×124"]),
    n("124 × 2 = ?", 248),
    expr("毛衣每件212元，买3件毛衣，列式求总价。", ["212×3", "3×212"]),
    n("212 × 3 = ?", 636),
    table("买4件单价为112元的运动服，一共多少元？", ["物品", "单价/元", "数量"], [{ "物品": "运动服", "单价/元": 112, "数量": 4 }], 448),
    choice("每箱有22筐、22筐、22筐、23筐，货车能装90筐，能一次运走吗？", "能，因为共89筐", ["不能，因为共90筐", "不能，因为共91筐", "能，因为共88筐"]),
    n("22 + 22 + 22 + 23 = ?", 89),
    expr("4亩油菜，每亩补贴20元，列式求补贴。", ["20×4", "4×20"]),
    n("20 × 4 = ?", 80),
    cmp("124 × 2 + 212", "500"),
  ],
  [
    ...mulItems([[12, 5], [28, 3], [16, 5], [36, 4], [47, 2], [29, 3]]),
    mn("12 × 5：个位 2×5=10，写 __ 进 __，十位 1×5 加进位得 __", ["write", "carry", "tens"], [0, 1, 6]),
    choice("12×5 的积是60，竖式中个位写0、向十位进1，原因是？", "2×5=10", ["1×5=5", "10×5=50", "5×2=10但不用进位"]),
    cmp("28 × 3", "80"),
    drag(["16 × 5：先算 6×5=30，个位写", null, "，向十位进", null], ["0", "3"], ["3", "30", "0", "5"]),
    tf("有进位时，下一位相乘后要加上进位数。", true),
  ],
  [
    choice("黑板上 29×8 写成92，主要错在哪里？", "忘记把个位进上来的7加到十位", ["把9×8算错成72", "把2×8算错成20", "不该写竖式"]),
    n("29 × 8 = ?", 232),
    choice("182×4 写成428，主要错在哪里？", "百位上的1×4后忘记加十位进位", ["个位2×4算错", "十位8×4不用进位", "应该先算百位"]),
    n("182 × 4 = ?", 728),
    choice("24×5 写成1020，错误原因是？", "个位进位处理和数位对齐都错了", ["24×5本来就是1020", "只少写一个0", "应该用除法"]),
    n("24 × 5 = ?", 120),
    tf("做完竖式后，用估算检查结果是否合理。", true),
    cmp("29 × 8", "92"),
    drag(["182 × 4 的正确积是", null, "，不是", null], ["728", "428"], ["428", "720", "728", "182"]),
    pairs([["29×8", "232"], ["182×4", "728"], ["24×5", "120"], ["73×4", "292"]]),
  ],
  [
    ...mulItems([[364, 2], [163, 5], [135, 4], [219, 2], [243, 4], [48, 3], [209, 4], [216, 4]]),
    cmp("364 × 2", "700"),
    cmp("243 × 4", "1000"),
    order("按积从小到大排列", [48 * 3, 135 * 4, 209 * 4, 243 * 4]),
  ],
  [
    table("4亩油菜每亩补贴20元，补贴多少元？", ["作物", "亩数", "每亩补贴/元"], [{ "作物": "油菜", "亩数": 4, "每亩补贴/元": 20 }, { "作物": "小麦", "亩数": 5, "每亩补贴/元": 18 }, { "作物": "玉米", "亩数": 6, "每亩补贴/元": 29 }], 80),
    table("5亩小麦每亩补贴18元，补贴多少元？", ["作物", "亩数", "每亩补贴/元"], [{ "作物": "油菜", "亩数": 4, "每亩补贴/元": 20 }, { "作物": "小麦", "亩数": 5, "每亩补贴/元": 18 }, { "作物": "玉米", "亩数": 6, "每亩补贴/元": 29 }], 90),
    table("6亩玉米每亩补贴29元，补贴多少元？", ["作物", "亩数", "每亩补贴/元"], [{ "作物": "油菜", "亩数": 4, "每亩补贴/元": 20 }, { "作物": "小麦", "亩数": 5, "每亩补贴/元": 18 }, { "作物": "玉米", "亩数": 6, "每亩补贴/元": 29 }], 174),
    n("29 × 6 = ?", 174),
    expr("成人票15元，学生票8元，14名学生和1名老师买动物园门票，列式求总价。", ["14×8+15", "8×14+15", "15+14×8", "15+8×14"]),
    n("8 × 14 + 15 = ?", 127),
    expr("15名学生和1名老师买票，买10张学生票赠1张学生票，列式求总价。", ["14×8+15", "8×14+15", "15+14×8", "15+8×14"]),
    n("14 × 8 + 15 = ?", 127),
    cmp("6 × 29", "5 × 18"),
    choice("买10张学生票赠1张学生票，15名学生需要买几张学生票？", "14张", ["15张", "13张", "10张"]),
  ],
  [
    ...mulItems([[0, 3], [8, 0], [200, 0], [0, 9]]),
    choice("0乘任何数都等于？", "0", ["这个数", "1", "不能计算"]),
    tf("3个0相加得0，所以0×3=0。", true),
    tf("8×0表示8个0相加，结果是8。", false),
    cmp("0 × 126", "126 - 126"),
    drag(["0 ×", null, "=", null], ["7", "0"], ["0", "1", "7", "9"]),
    pairs([["0×5", "0"], ["9×0", "0的9倍"], ["0+50", "50"], ["25-0", "25"]]),
  ],
  [
    ...mulItems([[240, 2], [130, 5], [203, 3], [208, 4], [304, 2], [106, 3], [205, 4], [250, 4]]),
    choice("计算203×3时，十位上的0乘3得0，积的十位应该怎样处理？", "写0占位", ["省略不写", "写3", "向百位进1"]),
    cmp("208 × 4", "800"),
    tf("末尾有0的数相乘，积的末尾一定没有0。", false),
  ],
  [
    mn("240 × 2 = __ __ 0", ["hundreds", "tens"], [4, 8]),
    mn("130 × 5 = __ __ __", ["hundreds", "tens", "ones"], [6, 5, 0]),
    mn("203 × 3 = __ __ 9", ["hundreds", "tens"], [6, 0]),
    mn("208 × 4 = __ __ 2", ["hundreds", "tens"], [8, 3]),
    drag(["304 × 2 的十位是", null, "，积是", null], ["0", "608"], ["608", "8", "0", "304"]),
    n("304 × 2 = ?", 608),
    n("160 × 3 = ?", 480),
    n("250 × 4 = ?", 1000),
    choice("208×4 竖式中个位 8×4=32，个位写2，向十位进几？", "3", ["2", "4", "0"]),
    cmp("250 × 4", "1000"),
  ],
  [
    expr("火车每小时行115千米，行4小时，列式求路程。", ["115×4", "4×115"]),
    n("115 × 4 = ?", 460),
    expr("汽车每小时行45千米，行2小时，列式求路程。", ["45×2", "2×45"]),
    n("45 × 2 = ?", 90),
    n("115 × 4 + 45 × 2 = ?", 550),
    choice("“每小时行115千米，行4小时”求的是？", "火车行驶的路程", ["汽车行驶的路程", "一共用时", "速度差"]),
    cmp("115 × 4", "45 × 2"),
    table("火车每小时115千米，4小时行多少千米？", ["交通工具", "速度/千米每时", "时间/时"], [{ "交通工具": "火车", "速度/千米每时": 115, "时间/时": 4 }, { "交通工具": "汽车", "速度/千米每时": 45, "时间/时": 2 }], 460),
    table("淘气家到奶奶家一共多少千米？", ["路段", "速度/千米每时", "时间/时"], [{ "路段": "淘气家-新站", "速度/千米每时": 115, "时间/时": 4 }, { "路段": "新站-奶奶家", "速度/千米每时": 45, "时间/时": 2 }], 550),
    tf("求路程时，可以用速度乘时间。", true),
  ],
  [
    table("光明镇到新城，汽车每小时55千米，3小时行多少千米？", ["路段", "交通工具", "速度/千米每时", "时间/时"], [{ "路段": "光明镇-新城", "交通工具": "汽车", "速度/千米每时": 55, "时间/时": 3 }, { "路段": "新城-古城", "交通工具": "火车", "速度/千米每时": 120, "时间/时": 5 }], 165),
    table("新城到古城，火车每小时120千米，5小时行多少千米？", ["路段", "交通工具", "速度/千米每时", "时间/时"], [{ "路段": "光明镇-新城", "交通工具": "汽车", "速度/千米每时": 55, "时间/时": 3 }, { "路段": "新城-古城", "交通工具": "火车", "速度/千米每时": 120, "时间/时": 5 }], 600),
    n("55 × 3 + 120 × 5 = ?", 765),
    table("北京到青岛的路程是多少千米？", ["路段", "路程/千米"], [{ "路段": "北京-天津", "路程/千米": 122 }, { "路段": "天津-济南", "路程/千米": 304 }, { "路段": "济南-青岛", "路程/千米": 393 }], 819),
    n("122 + 304 + 393 = ?", 819),
    expr("火车平均每小时152千米，3小时大约行到哪里，先列式求3小时路程。", ["152×3", "3×152"]),
    n("152 × 3 = ?", 456),
    cmp("152 × 3", "122 + 304"),
    choice("从北京出发，3小时行456千米，大约超过哪个城市？", "济南附近", ["天津之前", "刚到天津", "已经到青岛"]),
    tf("路线图题要先找清每一段的路程或速度时间。", true),
  ],
  [
    expr("每箱12瓶，每瓶2元，买3箱矿泉水，列式求总价。", ["12×2×3", "2×12×3", "3×12×2", "12×3×2"]),
    n("12 × 2 × 3 = ?", 72),
    mn("12 × 2 × 3：先算一箱 __ 元，再算3箱 __ 元", ["oneBox", "total"], [24, 72]),
    expr("45瓶汽水，酸奶是汽水的4倍，矿泉水是酸奶的2倍，列式求矿泉水瓶数。", ["45×4×2", "4×45×2", "45×(4×2)"]),
    n("45 × 4 × 2 = ?", 360),
    choice("45×4表示什么？", "酸奶有多少瓶", ["矿泉水有多少瓶", "汽水和酸奶一共多少瓶", "每箱多少瓶"]),
    choice("180×2表示什么？", "矿泉水有多少瓶", ["汽水有多少瓶", "每瓶多少元", "酸奶比汽水多多少"]),
    cmp("45 × 4 × 2", "45 × 8"),
    drag(["45 × 4 × 2 =", null, "× 2 =", null], ["180", "360"], ["360", "45", "2", "180"]),
    tf("连乘题可以先算前两个数的积，再乘第三个数。", true),
  ],
  [
    ...mulItems([[15, 6 * 8], [3 * 9, 2], [5 * 18, 7]], 2),
    n("15 × 6 × 8 = ?", 720, 2),
    n("3 × 9 × 2 = ?", 54, 1),
    n("5 × 18 × 7 = ?", 630, 2),
    n("(15 + 35) × 6 = ?", 300, 2),
    n("105 + 17 × 3 = ?", 156, 2),
    n("32 × (2 × 5) = ?", 320, 2),
    cmp("32 × (2 × 5)", "32 × 10"),
    order("按结果从小到大排列", [54, 156, 300, 320, 630]),
  ],
  [
    table("30棵幼苗，全部买小包装，至少要买几盒？", ["包装", "每盒棵数", "每盒价格/元"], [{ "包装": "小包装", "每盒棵数": 3, "每盒价格/元": 4 }, { "包装": "大包装", "每盒棵数": 9, "每盒价格/元": 10 }], 10),
    table("30棵幼苗，全部买大包装，至少要买几盒？", ["包装", "每盒棵数", "每盒价格/元"], [{ "包装": "小包装", "每盒棵数": 3, "每盒价格/元": 4 }, { "包装": "大包装", "每盒棵数": 9, "每盒价格/元": 10 }], 4),
    n("10 × 4 = ?", 40),
    n("4 × 10 = ?", 40),
    table("买3盒大包装和1盒小包装，一共有多少棵？", ["包装", "每盒棵数", "每盒价格/元"], [{ "包装": "小包装", "每盒棵数": 3, "每盒价格/元": 4 }, { "包装": "大包装", "每盒棵数": 9, "每盒价格/元": 10 }], 30),
    n("3 × 10 + 1 × 4 = ?", 34),
    choice("买30棵幼苗最省钱的方案是？", "3盒大包装和1盒小包装，34元", ["10盒小包装，40元", "4盒大包装，40元", "2盒大包装和4盒小包装，36元"]),
    cmp("3 × 10 + 4", "10 × 4"),
    table("方案2盒大包装、4盒小包装的金额是多少元？", ["大包装/盒", "小包装/盒", "幼苗总数/棵", "金额/元"], [{ "大包装/盒": 2, "小包装/盒": 4, "幼苗总数/棵": 30, "金额/元": 36 }], 36),
    tf("列出多种购买方案再比较金额，能帮助找到省钱方案。", true),
  ],
  [
    choice("估计一个看台人数，可以先做什么？", "估一排约有多少人，再数有几排", ["逐个精确数完整体育场", "只看颜色猜", "先算票价"]),
    n("180 × 5 = ?", 900),
    n("160 × 5 = ?", 800),
    cmp("180 × 5", "160 × 5"),
    choice("如果1个看台约180人，5个看台大约多少人？", "900人", ["800人", "185人", "360人"]),
    choice("如果1个看台约160人，5个看台大约多少人？", "800人", ["900人", "165人", "500人"]),
    order("按估计人数从少到多排列", [120 * 4, 160 * 5, 180 * 5, 200 * 5]),
    tf("估计时要选择比较容易计算、又接近实际的数。", true),
    expr("一盒糖分成4块区域，每块约40块，列式估计总数。", ["40×4", "4×40"]),
    n("40 × 4 = ?", 160),
  ],
  [
    n("54 × 4 = ?", 216),
    n("91 × 9 = ?", 819),
    n("102 × 7 = ?", 714),
    mn("54 × 4 可分成 50×4=__，4×4=__，合起来 __", ["a", "b", "c"], [200, 16, 216]),
    expr("一个书架4层，分别有48本、52本、47本、51本，4个这样的书架约有多少本，列式先求一个书架。", ["48+52+47+51"]),
    n("48 + 52 + 47 + 51 = ?", 198),
    n("198 × 4 = ?", 792),
    expr("5名教师和88名学生去游园，成人票8元，学生票5元，列式求实际花费。", ["5×8+88×5", "8×5+5×88"]),
    n("5 × 8 + 88 × 5 = ?", 480),
    cmp("5 × 8 + 88 × 5", "500"),
  ],
];

for (let i = 0; i < lessons.length; i += 1) {
  if (lessons[i].length < 10 || lessons[i].length > 15) {
    throw new Error(`${lessonSpecs[i][0]} has ${lessons[i].length} exercises`);
  }
}

fs.rmSync(unitDir, { recursive: true, force: true });
fs.mkdirSync(unitDir, { recursive: true });

const lessonIndex = {
  lessons: lessonSpecs.map(([file, title, icon], orderIndex) => ({
    file,
    orderIndex,
    title,
    icon,
  })),
};
fs.writeFileSync(path.join(unitDir, "lessons.json"), `${JSON.stringify(lessonIndex, null, 2)}\n`);

for (let i = 0; i < lessonSpecs.length; i += 1) {
  fs.writeFileSync(
    path.join(unitDir, lessonSpecs[i][0]),
    `${JSON.stringify({ exercises: lessons[i] }, null, 2)}\n`,
  );
}

console.log(`Wrote ${lessons.length} lessons to ${unitDir}`);

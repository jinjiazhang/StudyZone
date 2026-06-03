# 06 — 题型配置说明

> 本文档是各题型 JSON 配置的完整参考手册，涵盖字段定义、判分规则、难度建议，以及在**英语、语文、数学**三个科目中的实际效果示例。
>
> 类型定义源文件：[`packages/shared-types/src/exercise.ts`](../../packages/shared-types/src/exercise.ts)
> 枚举值源文件：[`packages/shared-types/src/enums.ts`](../../packages/shared-types/src/enums.ts)

---

## 题型总览

| # | code | 中文名 | 适用科目 | 难度区间 |
|---|---|---|---|---|
| 1 | `translate_choice` | 翻译选择 | 英语 | 1–2 |
| 2 | `translate_input` | 翻译输入 | 英语 | 2–3 |
| 3 | `listen_input` | 听力输入 | 英语 | 2–3 |
| 4 | `match_pairs` | 配对连线 | 英语 / 语文 / 数学 | 2 |
| 5 | `image_choice` | 看图选词 | 英语 / 语文 | 1–2 |
| 6 | `word_bank` | 词块组句 | 英语 / 语文 | 2 |
| 7 | `single_choice` | 单选题 | 语文 / 数学 / 英语 | 1–3 |
| 8 | `numeric_input` | 数字输入 | 数学 | 1–2 |
| 9 | `pinyin_choice` | 拼音选择 | 语文 | 1–2 |
| 10 | `pinyin_to_word` | 看拼音写字 | 语文 | 2–3 |
| 11 | `poem_complete` | 古诗填空（单空）| 语文 | 2 |
| 12 | `poem_multi_blank` | 古诗填空（多空）| 语文 | 3 |
| 13 | `word_build` | 组词 | 语文 | 2 |

---

## 一、`translate_choice` 翻译选择

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"translate_choice"` | ✅ | 固定值 |
| `source` | string | ✅ | 待翻译的源文本（可中文→英文，也可英文→中文） |
| `sourceLocale` | string | ✅ | 源文本语言，如 `"en-US"` 或 `"zh-CN"` |
| `options` | string[4] | ✅ | 4 个候选翻译，顺序随机展示 |
| `audioUrl` | string | ❌ | 源句子的音频 URL（可选，有则展示播放按钮） |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `correctIndex` | number | `options` 数组中正确答案的下标（0–3） |

### 判分规则

用户提交的下标 === `correctIndex` 即为正确，无容错。

### 效果示例 — 英语（单词认知，难度 1）

```json
{
  "type": "translate_choice",
  "prompt": {
    "type": "translate_choice",
    "source": "Sunday",
    "sourceLocale": "en-US",
    "options": ["今天", "星期日", "星期三", "星期四"]
  },
  "answer": { "correctIndex": 1 },
  "difficulty": 1
}
```

> 界面效果：大字显示英文单词 **Sunday**，下方展示 4 个中文选项，用户点击正确选项即得分。

### 效果示例 — 英语（句子翻译，反向，难度 2）

```json
{
  "type": "translate_choice",
  "prompt": {
    "type": "translate_choice",
    "source": "我星期六骑自行车。",
    "sourceLocale": "zh-CN",
    "options": [
      "We go to school from Monday to Friday.",
      "Today is Wednesday.",
      "I ride a bike on Saturday.",
      "What do you do on Friday?"
    ]
  },
  "answer": { "correctIndex": 2 },
  "difficulty": 2
}
```

> 界面效果：显示中文句子，要求从 4 个英文句子中选出正确翻译，适合句型理解练习。

---

## 二、`translate_input` 翻译输入

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"translate_input"` | ✅ | 固定值 |
| `source` | string | ✅ | 源文本或填空句（可包含 `___` 占位提示） |
| `sourceLocale` | string | ✅ | 源文本语言 |
| `hint` | string | ❌ | 提示文字，如首字母提示 `"首字母提示: F"` |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `accepted` | string[] | 所有合法答案列表，第一项为标准答案 |
| `tolerance` | number | Levenshtein 编辑距离容错值（建议：单词填空 1，长句翻译 2–3） |

### 判分规则

服务端计算用户输入（去掉首尾空格、忽略大小写）与每个 `accepted` 之间的 Levenshtein 距离，任一距离 ≤ `tolerance` 即正确。

### 效果示例 — 英语（单词拼写，难度 2）

```json
{
  "type": "translate_input",
  "prompt": {
    "type": "translate_input",
    "source": "星期四",
    "sourceLocale": "zh-CN",
    "hint": "拼写提示: T_______"
  },
  "answer": {
    "accepted": ["Thursday", "thursday"],
    "tolerance": 1
  },
  "difficulty": 2
}
```

> 界面效果：显示中文"星期四"和首字母提示，用户用键盘输入英文单词，允许 1 个拼写错误。

### 效果示例 — 英语（句子填空，难度 3）

```json
{
  "type": "translate_input",
  "prompt": {
    "type": "translate_input",
    "source": "补全句子: We go to school from Monday to ___? (我们从周一到周五去上学。)",
    "sourceLocale": "zh-CN",
    "hint": "首字母提示: F"
  },
  "answer": {
    "accepted": ["Friday", "friday"],
    "tolerance": 1
  },
  "difficulty": 3
}
```

> 界面效果：展示带空格的不完整英语句子，学生根据中文提示输入缺失单词。

---

## 三、`listen_input` 听力输入

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"listen_input"` | ✅ | 固定值 |
| `audioUrl` | string | ✅ | 标准语速音频 URL |
| `audioUrlSlow` | string | ❌ | 慢速音频 URL，用于"慢速重播"按钮 |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `accepted` | string[] | 所有合法答案 |
| `tolerance` | number | Levenshtein 容错值 |

### 判分规则

与 `translate_input` 相同，基于 Levenshtein 距离，忽略大小写和首尾空格。

### 效果示例 — 英语（单词听写）

```json
{
  "type": "listen_input",
  "prompt": {
    "type": "listen_input",
    "audioUrl": "https://cdn.studyzone.app/audio/en/saturday.mp3",
    "audioUrlSlow": "https://cdn.studyzone.app/audio/en/saturday-slow.mp3"
  },
  "answer": {
    "accepted": ["Saturday", "saturday"],
    "tolerance": 1
  },
  "difficulty": 2
}
```

> 界面效果：播放按钮 + 慢速按钮，用户听音后在输入框写出单词。适合英语单词听写训练。

---

## 四、`match_pairs` 配对连线

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"match_pairs"` | ✅ | 固定值 |
| `left` | `{id, text, audioUrl?}[]` | ✅ | 左列项目，`id` 用于匹配答案 |
| `right` | `{id, text}[]` | ✅ | 右列项目（系统自动乱序展示） |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `pairs` | `Record<leftId, rightId>` | 正确的左→右配对映射 |

### 判分规则

用户提交的所有配对均与 `pairs` 完全匹配则正确，部分正确不得分。

### 效果示例 — 英语（中英句子配对，难度 2）

```json
{
  "type": "match_pairs",
  "prompt": {
    "type": "match_pairs",
    "left": [
      { "id": "l_0", "text": "I play football on Sunday." },
      { "id": "l_1", "text": "We go to school from Monday to Friday." },
      { "id": "l_2", "text": "I make a model plane on Friday." },
      { "id": "l_3", "text": "Today is Wednesday." }
    ],
    "right": [
      { "id": "r_0", "text": "我星期日踢足球。" },
      { "id": "r_1", "text": "我们从周一到周五去上学。" },
      { "id": "r_2", "text": "我星期五做飞机模型。" },
      { "id": "r_3", "text": "今天星期三。" }
    ]
  },
  "answer": {
    "pairs": { "l_0": "r_0", "l_1": "r_1", "l_2": "r_2", "l_3": "r_3" }
  },
  "difficulty": 2
}
```

> 界面效果：左右两列各 4 条，用户拖拽/点击连线。适合中英对照、词义配对等。

### 效果示例 — 语文（词语释义配对，难度 2）

```json
{
  "type": "match_pairs",
  "prompt": {
    "type": "match_pairs",
    "left": [
      { "id": "l1", "text": "碧玉" },
      { "id": "l2", "text": "绿丝绦" },
      { "id": "l3", "text": "似剪刀" },
      { "id": "l4", "text": "纸鸢" }
    ],
    "right": [
      { "id": "r1", "text": "像剪刀一样" },
      { "id": "r2", "text": "绿色的美玉" },
      { "id": "r3", "text": "风筝" },
      { "id": "r4", "text": "绿色的丝带" }
    ]
  },
  "answer": {
    "pairs": { "l1": "r2", "l2": "r4", "l3": "r1", "l4": "r3" }
  },
  "difficulty": 2
}
```

> 界面效果：诗词词语与白话释义配对，加深古诗词理解。

### 效果示例 — 数学（算式与结果配对，难度 2）

```json
{
  "type": "match_pairs",
  "prompt": {
    "type": "match_pairs",
    "left": [
      { "id": "l_0", "text": "30 - 3 * 9 = ?" },
      { "id": "l_1", "text": "80 - 9 * 8 = ?" },
      { "id": "l_2", "text": "9 * 4 - 12 = ?" },
      { "id": "l_3", "text": "15 + 8 * 2 = ?" }
    ],
    "right": [
      { "id": "r_0", "text": "3" },
      { "id": "r_1", "text": "8" },
      { "id": "r_2", "text": "24" },
      { "id": "r_3", "text": "31" }
    ]
  },
  "answer": {
    "pairs": { "l_0": "r_0", "l_1": "r_1", "l_2": "r_2", "l_3": "r_3" }
  },
  "difficulty": 2
}
```

> 界面效果：左列是混合运算算式，右列是结果数字（乱序），学生通过连线验证运算能力。

---

## 五、`image_choice` 看图选词

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"image_choice"` | ✅ | 固定值 |
| `word` | string | ✅ | 展示给用户的词/题干 |
| `audioUrl` | string | ❌ | 词的发音音频 |
| `options` | `{id, imageUrl, label}[]` | ✅ | 4 张图片选项，`label` 为图片文字标注（可空字符串） |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `correctOptionId` | string | 正确图片的 `id` |

### 效果示例 — 英语（词与图匹配）

```json
{
  "type": "image_choice",
  "prompt": {
    "type": "image_choice",
    "word": "football",
    "audioUrl": "https://cdn.studyzone.app/audio/en/football.mp3",
    "options": [
      { "id": "opt_a", "imageUrl": "https://cdn.studyzone.app/img/football.png", "label": "" },
      { "id": "opt_b", "imageUrl": "https://cdn.studyzone.app/img/basketball.png", "label": "" },
      { "id": "opt_c", "imageUrl": "https://cdn.studyzone.app/img/tennis.png", "label": "" },
      { "id": "opt_d", "imageUrl": "https://cdn.studyzone.app/img/swimming.png", "label": "" }
    ]
  },
  "answer": { "correctOptionId": "opt_a" },
  "difficulty": 1
}
```

> 界面效果：顶部显示单词 **football**，下方 2×2 图片网格，用户点击正确图片。适合低年级单词认知。

---

## 六、`word_bank` 词块组句

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"word_bank"` | ✅ | 固定值 |
| `source` | string | ✅ | 题目说明/翻译提示文字 |
| `tokens` | string[] | ✅ | 词块池，包含正确词块和干扰词块（系统乱序展示） |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `ordered` | string[] | 正确的词块排列顺序（`tokens` 的子集） |

### 判分规则

用户提交的词块序列与 `ordered` 完全一致则正确（严格顺序匹配）。

### 效果示例 — 英语（句子组装，难度 2）

```json
{
  "type": "word_bank",
  "prompt": {
    "type": "word_bank",
    "source": "拼出句子: 你星期日做什么？",
    "tokens": ["do", "do", "play", "on", "Sunday", "you", "What"]
  },
  "answer": {
    "ordered": ["What", "do", "you", "do", "on", "Sunday"]
  },
  "difficulty": 2
}
```

> 界面效果：乱序词块从底部池中拖拽到上方答案槽，组成完整英语句子。含干扰词 `"play"`。

### 效果示例 — 语文（古诗词句排序，难度 2）

```json
{
  "type": "word_bank",
  "prompt": {
    "type": "word_bank",
    "source": "请按顺序排出《咏柳》的第一句",
    "tokens": ["碧玉", "妆成", "一树高", "万条", "细叶"]
  },
  "answer": {
    "ordered": ["碧玉", "妆成", "一树高"]
  },
  "difficulty": 2
}
```

> 界面效果：给出一首诗中某句的词块（含干扰词），学生拖拽还原正确语序，加深古诗记忆。

---

## 七、`single_choice` 单选题

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"single_choice"` | ✅ | 固定值 |
| `question` | string | ✅ | 题干文字（支持较长文字，如应用题情境描述） |
| `options` | string[] | ✅ | 候选项列表（通常 4 项） |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `correctIndex` | number | 正确选项下标 |

### 效果示例 — 数学（应用题，难度 2）

```json
{
  "type": "single_choice",
  "prompt": {
    "type": "single_choice",
    "question": "蚂蚁操场上有4排蚂蚁做操，每排有12只。一共有多少只蚂蚁做操？ 请列式并选择正确答案：",
    "options": ["46", "96", "48 (只)", "53"]
  },
  "answer": { "correctIndex": 2 },
  "difficulty": 2
}
```

> 界面效果：情境化应用题，选项中正确答案标注单位 `(只)` 提醒学生关注答题规范。

### 效果示例 — 语文（诗词理解，难度 2）

```json
{
  "type": "single_choice",
  "prompt": {
    "type": "single_choice",
    "question": ""碧玉妆成一树高"这句诗把柳树比作了什么？",
    "options": ["一位用碧玉打扮的美人", "一条小溪", "一只黄莺", "一把剪刀"]
  },
  "answer": { "correctIndex": 0 },
  "difficulty": 2
}
```

> 界面效果：考察修辞手法理解，适合课文阅读后的综合考察。

### 效果示例 — 语文（诗词常识，难度 1）

```json
{
  "type": "single_choice",
  "prompt": {
    "type": "single_choice",
    "question": "《咏柳》的作者是哪位唐代诗人？",
    "options": ["贺知章", "李白", "高鼎", "白居易"]
  },
  "answer": { "correctIndex": 0 },
  "difficulty": 1
}
```

---

## 八、`numeric_input` 数字输入

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"numeric_input"` | ✅ | 固定值 |
| `statement` | string | ✅ | 算式字符串，支持 LaTeX 友好格式，`?` 表示待填答案 |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `value` | number | 正确答案数值 |
| `tolerance` | number | 允许误差（绝对值），整数题设为 `0.01` 以处理浮点精度 |

### 判分规则

`abs(用户输入 - value) <= tolerance` 即正确。

### 效果示例 — 数学（混合运算，难度 1）

```json
{
  "type": "numeric_input",
  "prompt": {
    "type": "numeric_input",
    "statement": "3 * 4 + 5 = ?"
  },
  "answer": { "value": 17.0, "tolerance": 0.01 },
  "difficulty": 1
}
```

> 界面效果：展示算式，光标自动聚焦数字键盘输入框，学生直接输入计算结果。

### 效果示例 — 数学（三位数乘法，难度 1）

```json
{
  "type": "numeric_input",
  "prompt": {
    "type": "numeric_input",
    "statement": "123 * 3 = ?"
  },
  "answer": { "value": 369.0, "tolerance": 0.01 },
  "difficulty": 1
}
```

> 适合乘法竖式练习，快速刷题巩固计算速度。

---

## 九、`pinyin_choice` 拼音选择

> **仅语文科目使用。**

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"pinyin_choice"` | ✅ | 固定值 |
| `character` | string | ✅ | 待标注拼音的汉字或词语 |
| `hint` | string | ❌ | 辅助提示，如"请选择字【等】的正确拼音"或语境句 |
| `options` | string[4] | ✅ | 4 个拼音选项（含声调），如 `["mā", "má", "mǎ", "mà"]` |
| `audioUrl` | string | ❌ | 汉字标准发音音频 |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `correctIndex` | number | 正确拼音在 `options` 中的下标 |

### 效果示例 — 语文（字词注音，难度 1）

```json
{
  "type": "pinyin_choice",
  "prompt": {
    "type": "pinyin_choice",
    "character": "等",
    "hint": "请选择字【等】的正确拼音",
    "options": ["děng", "fá", "zhēng", "xī"]
  },
  "answer": { "correctIndex": 0 },
  "difficulty": 1
}
```

> 界面效果：汉字大字居中展示，下方 4 个带声调的拼音选项，考察识字注音能力。

### 效果示例 — 语文（古诗难字，带语境提示，难度 2）

```json
{
  "type": "pinyin_choice",
  "prompt": {
    "type": "pinyin_choice",
    "character": "绦",
    "hint": ""万条垂下绿丝绦"的"绦"",
    "options": ["tāo", "táo", "tiáo", "dāo"]
  },
  "answer": { "correctIndex": 0 },
  "difficulty": 2
}
```

> 带诗句语境的提示，帮助学生在上下文中理解难字读音。

---

## 十、`pinyin_to_word` 看拼音写字

> **仅语文科目使用。** 需要客户端集成 **HanziWriter** 笔画识别库。

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `type` | `"pinyin_to_word"` | ✅ | — | 固定值 |
| `pinyin` | string | ✅ | — | 带声调的拼音，如 `"shī"` |
| `sentence` | string | ✅ | — | 含空白占位符的句子，如 `"老__在黑板上写字。"` |
| `blankPlaceholder` | string | ❌ | `"__"` | 句子中空白的标记字符串 |
| `character` | string | ✅ | — | 目标汉字，如 `"师"`，用于加载 HanziWriter 笔画数据 |
| `allowedMistakes` | number | ❌ | `3` | 笔画允许出错次数（HanziWriter quiz mode） |
| `leniency` | number | ❌ | `1.0` | HanziWriter 形状匹配宽松度，推荐 `0.8`–`1.3` |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `character` | string | 与 `prompt.character` 相同，保持 answer 列自描述 |

**用户提交（UserAttemptPayload）**

| 字段 | 类型 | 说明 |
|---|---|---|
| `character` | string | 与 prompt.character 一致（服务端校验） |
| `mistakes` | number | HanziWriter 记录的错误笔画数 |
| `completed` | boolean | 是否完成了所有笔画 |

### 判分规则

`completed === true && mistakes <= allowedMistakes` 则判正确。

### 效果示例 — 语文（古诗字词书写，难度 2）

```json
{
  "type": "pinyin_to_word",
  "prompt": {
    "type": "pinyin_to_word",
    "pinyin": "jiǎn",
    "sentence": "二月春风似__刀。",
    "blankPlaceholder": "__",
    "character": "剪",
    "allowedMistakes": 3,
    "leniency": 1.2
  },
  "answer": { "character": "剪" },
  "difficulty": 2
}
```

> 界面效果：展示拼音 **jiǎn** + 带空格的诗句，空格处显示可书写的 Canvas，学生用手指/触控笔逐笔写出"剪"字，HanziWriter 实时判断每笔笔顺和形状。

### 参数调优建议

| 场景 | `allowedMistakes` | `leniency` |
|---|---|---|
| 简单常用字（人、口、日） | 2 | 1.0 |
| 中等难度（师、归、裁） | 3 | 1.2 |
| 复杂字（赢、疆、藏） | 4 | 1.3 |

---

## 十一、`poem_complete` 古诗填空（单空）

> **仅语文科目使用。**

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"poem_complete"` | ✅ | 固定值 |
| `title` | string | ✅ | 诗歌标题 |
| `author` | string | ✅ | 作者 |
| `lines` | `Array<Array<string \| null>>` | ✅ | 每行是词条数组，`null` 表示空白（全诗只有一个 `null`） |
| `options` | string[4] | ✅ | 4 个候选填空词 |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `correctIndex` | number | `options` 中正确词的下标 |

### 效果示例 — 语文（单句填空）

```json
{
  "type": "poem_complete",
  "prompt": {
    "type": "poem_complete",
    "title": "静夜思",
    "author": "李白",
    "lines": [
      ["床前", null, "光"],
      ["疑是地上霜"]
    ],
    "options": ["明月", "白雪", "灯火", "彩霞"]
  },
  "answer": { "correctIndex": 0 },
  "difficulty": 2
}
```

> 界面效果：以诗歌排版展示全诗（空格用下划线占位），4 个选项供点击，适合初步古诗记忆训练。

---

## 十二、`poem_multi_blank` 古诗填空（多空）

> **仅语文科目使用。** 是 `poem_complete` 的多空泛化版本，每个空有独立选项组。

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"poem_multi_blank"` | ✅ | 固定值 |
| `title` | string | ✅ | 诗歌标题 |
| `author` | string | ✅ | 作者 |
| `lines` | `Array<Array<string \| null>>` | ✅ | 每行词条，可包含多个 `null` |
| `blanks` | `{options: string[]}[]` | ✅ | 按从左到右、从上到下的顺序，每个 `null` 对应一组选项 |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `correctIndices` | number[] | 与 `blanks` 等长，每个元素是对应空格的正确选项下标 |

### 效果示例 — 语文（整首诗多空填写，难度 3）

```json
{
  "type": "poem_multi_blank",
  "prompt": {
    "type": "poem_multi_blank",
    "title": "咏柳",
    "author": "贺知章",
    "lines": [
      ["碧玉", null, "一树高，"],
      ["万条垂下", null, "。"],
      ["不知细叶谁", null, "出，"],
      ["二月春风似", null, "。"]
    ],
    "blanks": [
      { "options": ["妆成", "栽成", "长成", "化成"] },
      { "options": ["绿丝绦", "白丝带", "青丝绳", "翠丝绳"] },
      { "options": ["裁", "栽", "猜", "采"] },
      { "options": ["剪刀", "钢刀", "菜刀", "镰刀"] }
    ]
  },
  "answer": { "correctIndices": [0, 0, 0, 0] },
  "difficulty": 3
}
```

> 界面效果：全诗排版展示，4 处空格各自展示独立的选项下拉/按钮，学生逐空选择，最后一并提交。考察整首诗的掌握程度，难度最高。

---

## 十三、`word_build` 组词

> **仅语文科目使用。**

### 字段说明

**prompt**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `"word_build"` | ✅ | 固定值 |
| `character` | string | ✅ | 中心字，醒目展示 |
| `tokens` | string[] | ✅ | 候选字池（含干扰字） |
| `targetCount` | number | ✅ | 需要选择的字数 |
| `instruction` | string | ❌ | 覆盖默认提示文案 |

**answer**

| 字段 | 类型 | 说明 |
|---|---|---|
| `acceptedSets` | `string[][]` | 合法答案集合列表，每个元素是一个无序字集合；用户选择匹配任一集合即得分 |

**用户提交**

| 字段 | 类型 | 说明 |
|---|---|---|
| `selected` | string[] | 用户点选的字（按顺序，服务端比较时作为集合） |

### 判分规则

将 `selected` 视为无序集合，与 `acceptedSets` 中每个集合比较，匹配任意一个则正确。

### 效果示例 — 语文（组词练习，难度 2）

```json
{
  "type": "word_build",
  "prompt": {
    "type": "word_build",
    "character": "明",
    "tokens": ["白", "天", "光", "亮", "星", "暗"],
    "targetCount": 3,
    "instruction": "选出 3 个能与"明"组成词语的字"
  },
  "answer": {
    "acceptedSets": [["白", "天", "光"], ["白", "天", "亮"]]
  },
  "difficulty": 2
}
```

> 界面效果：中心字"明"大字展示，周围散布 6 个候选字，学生点选 3 个组成"明白/明天/光明"等词语。支持多种正确答案。

### 效果示例 — 语文（鲜字组词，难度 2）

```json
{
  "type": "word_build",
  "prompt": {
    "type": "word_build",
    "character": "鲜",
    "tokens": ["花", "美", "艳", "果", "黑", "暗", "苦"],
    "targetCount": 4,
    "instruction": "选出 4 个能与"鲜"组成词语的字"
  },
  "answer": {
    "acceptedSets": [["花", "美", "艳", "果"]]
  },
  "difficulty": 2
}
```

> 可组成：鲜花、鲜美、鲜艳、鲜果；干扰字：黑、暗、苦。

---

## 附录 A：各科目题型搭配建议

### 英语

一节 lesson 的典型题型顺序（从易到难）：

1. `translate_choice`（难度 1）— 单词认知，先建立理解
2. `translate_choice`（难度 2）— 句子翻译（含反向中→英）
3. `word_bank`（难度 2）— 句子组装，强化语序
4. `match_pairs`（难度 2）— 中英句子配对，巩固记忆
5. `translate_input`（难度 2–3）— 单词/句子拼写，输出产出

> 听力资源就绪后可在步骤 1–2 之间插入 `listen_input`。

### 语文

1. `single_choice`（难度 1）— 作者/朝代等基础常识
2. `pinyin_choice`（难度 1–2）— 识字注音
3. `pinyin_to_word`（难度 2–3）— 书写练习（需 HanziWriter）
4. `match_pairs`（难度 2）— 词语释义配对
5. `word_build`（难度 2）— 组词扩展
6. `word_bank`（难度 2）— 古诗语序还原
7. `poem_complete`（难度 2）— 单空填诗
8. `poem_multi_blank`（难度 3）— 多空填诗（综合考察）

### 数学

1. `numeric_input`（难度 1）— 直接计算，大量刷题
2. `match_pairs`（难度 2）— 算式与结果配对，检验计算准确性
3. `single_choice`（难度 2–3）— 应用题，考察建模与选择

---

## 附录 B：`difficulty` 字段参考

| 值 | 含义 | 典型题型 |
|---|---|---|
| 1 | 基础认知 | 单词选择、识字注音、直接计算 |
| 2 | 理解运用 | 句子翻译、配对、组词、单空填诗 |
| 3 | 综合产出 | 拼写输入、看拼音写字、多空填诗 |

`difficulty` 影响 SRS 权重和组卷时的难度分布，同一 lesson 内建议以 1→2→3 梯度排布。

---

## 附录 C：新增题型 Checklist

1. `enums.ts` — 添加 `ExerciseType.<NEW>`
2. `exercise.ts` — 定义 `<New>Prompt` / `<New>Answer` / `<New>AttemptPayload`（可选）
3. `judge.ts` — 添加判分分支，并补 `judge.test.ts` 单测
4. 客户端 Web — `apps/web/src/components/exercises/<NewExercise>.tsx`
5. 客户端 Mobile — `apps/mobile/src/components/exercises/<NewExercise>.tsx`
6. 管理后台 — `apps/admin/src/pages/exercises/<new-exercise>/` 编辑表单
7. 本文档 — 补充题型说明和示例

---

*最后更新：对应 `packages/shared-types` 版本，与 `exercise.ts` 同步维护。*

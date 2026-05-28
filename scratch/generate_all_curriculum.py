import os
import json
import random

# Core database for procedural Chinese exercise generation
VOCAB_DICT = {
    # Characters with Pinyin, structure, left part, right part
    "天": ("tiān", "vertical", "一", "大"),
    "地": ("dì", "horizontal", "土", "也"),
    "人": ("rén", "vertical", "丿", "乀"),
    "你": ("nǐ", "horizontal", "亻", "尔"),
    "我": ("wǒ", "horizontal", "丿", "找"),
    "他": ("tā", "horizontal", "亻", "也"),
    "金": ("jīn", "vertical", "人", "王"),
    "木": ("mù", "vertical", "十", "八"),
    "水": ("shuǐ", "horizontal", "亅", "水"),
    "火": ("huǒ", "vertical", "人", "丷"),
    "土": ("tǔ", "vertical", "十", "一"),
    "口": ("kǒu", "horizontal", "冂", "一"),
    "耳": ("ěr", "vertical", "一", "目"),
    "目": ("mù", "vertical", "冂", "三"),
    "手": ("shǒu", "vertical", "丿", "毛"),
    "日": ("rì", "vertical", "冂", "二"),
    "月": ("yuè", "vertical", "冂", "二"),
    "山": ("shān", "vertical", "凵", "丨"),
    "石": ("shí", "vertical", "一", "口"),
    "田": ("tián", "vertical", "囗", "十"),
    "禾": ("hé", "vertical", "丿", "木"),
    "对": ("duì", "horizontal", "又", "寸"),
    "雨": ("yǔ", "vertical", "一", "巾"),
    "风": ("fēng", "horizontal", "几", "乂"),
    "花": ("huā", "vertical", "艹", "化"),
    "鸟": ("niǎo", "vertical", "勹", "一"),
    "秋": ("qiū", "horizontal", "禾", "火"),
    "气": ("qì", "vertical", "𠂇", "乙"),
    "了": ("le", "vertical", "乛", "亅"),
    "子": ("zǐ", "vertical", "了", "一"),
    "大": ("dà", "vertical", "一", "人"),
    "飞": ("fēi", "vertical", "九", "丶"),
    "会": ("huì", "vertical", "人", "云"),
    "个": ("gè", "vertical", "人", "丨"),
    "春": ("chūn", "vertical", "三", "日"),
    "夏": ("xià", "vertical", "𦣻", "夂"),
    "冬": ("dōng", "vertical", "夂", "冫"),
    "红": ("hóng", "horizontal", "纟", "工"),
    "游": ("yóu", "horizontal", "氵", "方"),
    "池": ("chí", "horizontal", "氵", "也"),
    "歌": ("gē", "horizontal", "哥", "欠"),
    "姓": ("xìng", "horizontal", "女", "生"),
    "什": ("shén", "horizontal", "亻", "十"),
    "么": ("me", "vertical", "丿", "厶"),
    "双": ("shuāng", "horizontal", "又", "又"),
    "脑": ("nǎo", "horizontal", "⺼", "脑"),
    "井": ("jǐng", "vertical", "二", "丨"),
    "想": ("xiǎng", "vertical", "相", "心"),
    "叶": ("yè", "horizontal", "口", "十"),
    "爸": ("bà", "vertical", "父", "巴"),
    "妈": ("mā", "horizontal", "女", "马"),
    "青": ("qīng", "vertical", "龶", "月"),
    "荷": ("hé", "vertical", "艹", "何"),
    "圆": ("yuán", "vertical", "囗", "员"),
    "家": ("jiā", "vertical", "宀", "豕"),
    "姑": ("gū", "horizontal", "女", "古"),
    "娘": ("niáng", "horizontal", "女", "良"),
    "蝌": ("kē", "horizontal", "虫", "科"),
    "蚪": ("dǒu", "horizontal", "虫", "斗"),
    "娃": ("wá", "horizontal", "女", "圭"),
    "飘": ("piāo", "horizontal", "票", "风"),
    "极": ("jí", "horizontal", "木", "及"),
    "桥": ("qiáo", "horizontal", "木", "乔"),
    "枫": ("fēng", "horizontal", "木", "风"),
    "猫": ("māo", "horizontal", "犭", "苗"),
    "写": ("xiě", "vertical", "冖", "与"),
    "信": ("xìn", "horizontal", "亻", "言"),
    "每": ("měi", "vertical", "𠂇", "母"),
    "笔": ("bǐ", "vertical", "⺮", "毛"),
    "景": ("jǐng", "vertical", "日", "京"),
    "湾": ("wān", "horizontal", "氵", "弯"),
    "沿": ("yán", "horizontal", "氵", "沿"),
    "答": ("dá", "vertical", "⺮", "合"),
    "治": ("zhì", "horizontal", "氵", "台"),
    "扁": ("biǎn", "vertical", "户", "册"),
    "担": ("dān", "horizontal", "扌", "旦"),
    "难": ("nán", "horizontal", "又", "隹"),
    "泼": ("pō", "horizontal", "氵", "发"),
    "雪": ("xuě", "vertical", "雨", "彐"),
    "晴": ("qíng", "horizontal", "日", "青"),
    "朗": ("lǎng", "horizontal", "月", "良"),
    "将": ("jiāng", "horizontal", "丬", "将"),
    "枯": ("kū", "horizontal", "木", "古"),
    "荣": ("róng", "vertical", "艹", "木"),
    "燕": ("yàn", "vertical", "廿", "灬"),
    "聚": ("jù", "vertical", "取", "乑"),
    "蓬": ("péng", "vertical", "艹", "逢"),
    "昆": ("kūn", "vertical", "日", "比"),
    "录": ("lù", "vertical", "彐", "氺"),
    "守": ("shǒu", "vertical", "宀", "寸"),
    "待": ("dài", "horizontal", "彳", "寺"),
    "宋": ("sòng", "vertical", "宀", "木"),
    "释": ("shì", "horizontal", "采", "睪"),
    "骄": ("jiāo", "horizontal", "马", "乔"),
    "傲": ("ào", "horizontal", "亻", "敖"),
    "谦": ("qiān", "horizontal", "讠", "兼"),
    "虚": ("xū", "vertical", "虍", "业"),
    "懦": ("nuò", "horizontal", "忄", "需"),
    "鹿": ("lù", "vertical", "广", "比"),
    "赏": ("shǎng", "vertical", "⺌", "贝"),
    "叹": ("tàn", "horizontal", "口", "又"),
    "川": ("chuān", "vertical", "丿", "丨"),
    "州": ("zhōu", "vertical", "丶", "丨"),
    "匠": ("jiàng", "horizontal", "匚", "斤"),
    "社": ("shè", "horizontal", "礻", "土"),
    "设": ("shè", "horizontal", "讠", "殳"),
    "县": ("xiàn", "vertical", "目", "幺"),
    "史": ("shǐ", "vertical", "口", "乂"),
    "创": ("chuàng", "horizontal", "仓", "刂"),
    "阅": ("yuè", "horizontal", "门", "兑"),
    "蜂": ("fēng", "horizontal", "虫", "夆"),
    "辨": ("biàn", "horizontal", "辛", "辛"),
    "阻": ("zǔ", "horizontal", "⻖", "且"),
    "跨": ("kuà", "horizontal", "⻊", "夸"),
    "括": ("kuò", "horizontal", "扌", "舌"),
    "检": ("jiǎn", "horizontal", "木", "佥"),
    "途": ("tú", "horizontal", "辶", "余"),
    "超": ("chāo", "horizontal", "走", "召"),
    "悠": ("yōu", "vertical", "攸", "心"),
    "闲": ("xián", "horizontal", "门", "木"),
    "泡": ("pào", "horizontal", "氵", "包"),
    "扯": ("chě", "horizontal", "扌", "止"),
    "仰": ("yǎng", "horizontal", "亻", "卬"),
    "串": ("chuàn", "vertical", "口", "口"),
    "婴": ("yīng", "vertical", "贝", "女"),
    "幻": ("huàn", "horizontal", "幺", "𢎘"),
    "润": ("rùn", "horizontal", "氵", "门"),
    "芒": ("máng", "vertical", "艹", "亡"),
    "模": ("mó", "horizontal", "木", "莫"),
    "型": ("xíng", "vertical", "刑", "土"),
    "窃": ("qiè", "vertical", "穴", "切"),
    "私": ("sī", "horizontal", "禾", "厶"),
    "警": ("jǐng", "vertical", "敬", "言"),
    "肌": ("jī", "horizontal", "⺼", "几"),
    "章": ("zhāng", "vertical", "立", "早"),
    "差": ("chà", "vertical", "𦍌", "工"),
    "胞": ("bāo", "horizontal", "⺼", "包"),
    "海": ("hǎi", "horizontal", "氵", "每"),
    "椒": ("jiāo", "horizontal", "木", "叔"),
    "橱": ("chú", "horizontal", "木", "厨"),
    "改": ("gǎi", "horizontal", "己", "攵"),
    "善": ("shàn", "vertical", "羊", "口")
}

PINYIN_DISTRACTORS = ["tā", "ní", "hǎo", "xué", "xí", "shān", "shí", "shuǐ", "fēng", "yǔ", "huā", "niǎo", "rén", "kǒu", "shǒu", "mù", "ěr", "rì", "yuè", "tiān", "dì"]

CHINESE_PAIRS_DB = [
    ("学习", "获取知识和技能的过程"),
    ("教师", "在学校传授学问的人"),
    ("学生", "在学校学习的人"),
    ("学校", "专门进行教育的机构"),
    ("教室", "学生上课学习的房间"),
    ("读书", "阅读书籍获取知识"),
    ("写字", "用笔在纸上书写文字"),
    ("朋友", "志同道合、互相帮助的人"),
    ("春天", "一年中温暖、百花盛开的季节"),
    ("夏天", "一年中炎热、万物旺盛的季节"),
    ("秋天", "一年中凉爽、落叶丰收的季节"),
    ("冬天", "一年中寒冷、白雪茫茫的季节"),
    ("大自然", "包含山川、河流、动植物的自然界"),
    ("太阳", "白天照亮大地、带来温暖的恒星"),
    ("月亮", "夜空中弯弯或圆圆的卫星"),
    ("星星", "夜空中闪闪发光的天体"),
    ("爱护", "精心照料和保护"),
    ("勤奋", "努力学习和工作"),
    ("诚实", "言行一致，不说谎"),
    ("勇敢", "面对困难和危险不害怕"),
    ("健康", "身体强壮、精神饱满的状态"),
    ("快乐", "心里感到欢喜和满足")
]

# Predefined high-quality reading questions for Chinese to ensure excellent pedagogic quality
CHINESE_READINGS = {
    # Default fallback pool of high-quality reading comprehensions
    "default": [
        ("大自然中有许多美妙的声音，比如风声、雨声和鸟叫声。这告诉我们：", ["大自然很神奇，要用心聆听", "只在教室听歌", "不要去户外", "声音很刺耳"], 0),
        ("学习新知识时，遇到不懂的问题，我们应该：", ["不懂就要问，主动思考", "装作懂了", "抄袭别人的答案", "直接放弃不学"], 0),
        ("保护大自然和小动物是每个人的责任，我们应该：", ["爱护动物，不乱扔垃圾", "随意砍伐树木", "捕捉野生动物", "关起窗户不看"], 0),
        ("古人说“一寸光阴一寸金”，这句话告诉我们：", ["时间非常宝贵，要珍惜时间", "金子很容易买到", "一分钟不重要", "可以天天偷懒"], 0),
        ("课文中所说的“两件宝”是指我们的双手和什么？", ["大脑，用来思考和创造", "双脚", "眼睛和耳朵", "零食和玩具"], 0)
    ]
}

# Predefined themes, units, and lessons lists for the 8 books to generate.
CHINESE_COURSES = {
    "grade-1-volume-1": {
        "units": [
            {
                "dir": "01-literacy1", "title": "第一单元・识字一", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-tiandiren.json", "title": "天地人", "icon": "🏫", "vocab": ["天", "地", "人", "你", "我", "他"]},
                    {"file": "02-jinmushuihuotu.json", "title": "金木水火土", "icon": "🔥", "vocab": ["金", "木", "水", "火", "土"]},
                    {"file": "03-kouermu.json", "title": "口耳目", "icon": "👁️", "vocab": ["口", "耳", "目", "手"]},
                    {"file": "04-riyueshuihuo.json", "title": "日月水火", "icon": "☀️", "vocab": ["日", "月", "山", "石", "田", "禾"]},
                    {"file": "05-duiyunge.json", "title": "对韵歌", "icon": "🎵", "vocab": ["对", "雨", "风", "花", "鸟"]}
                ]
            },
            {
                "dir": "02-pinyin1", "title": "第二单元・汉语拼音上", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "06-aoe.json", "title": "a o e", "icon": "🗣️", "vocab": ["天", "人", "了", "子"]},
                    {"file": "07-iuuyw.json", "title": "i u ü y w", "icon": "🎈", "vocab": ["地", "你", "他", "会"]},
                    {"file": "08-bpmf.json", "title": "b p m f", "icon": "🥁", "vocab": ["木", "水", "火", "土"]},
                    {"file": "09-dtnl.json", "title": "d t n l", "icon": "🎺", "vocab": ["日", "月", "山", "石"]}
                ]
            },
            {
                "dir": "03-pinyin2", "title": "第三单元・汉语拼音下", "themeColor": "#D97706",
                "lessons": [
                    {"file": "10-gkh.json", "title": "g k h", "icon": "🦜", "vocab": ["口", "耳", "目", "手"]},
                    {"file": "11-jqx.json", "title": "j q x", "icon": "🧸", "vocab": ["雨", "风", "花", "鸟"]},
                    {"file": "12-zcs.json", "title": "z c s", "icon": "🔤", "vocab": ["秋", "气", "了", "子"]},
                    {"file": "13-zhchshr.json", "title": "zh ch sh r", "icon": "🦁", "vocab": ["一", "二", "三", "十"]}
                ]
            },
            {
                "dir": "04-autumn", "title": "第四单元・秋天与自然", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "14-qiutian.json", "title": "秋天", "icon": "🍂", "vocab": ["秋", "气", "了", "子", "大", "飞", "会", "个"]}
                ]
            }
        ]
    },
    "grade-1-volume-2": {
        "units": [
            {
                "dir": "01-spring", "title": "第一单元・春天的发现", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-chunxiaqiudong.json", "title": "春夏秋冬", "icon": "🌸", "vocab": ["春", "夏", "冬", "红", "花", "秋"]},
                    {"file": "02-xingshige.json", "title": "姓氏歌", "icon": "👪", "vocab": ["姓", "什", "么", "双", "我", "你"]},
                    {"file": "03-shuangshou.json", "title": "双手和大脑", "icon": "🧠", "vocab": ["双", "手", "脑", "人", "地", "天"]}
                ]
            },
            {
                "dir": "02-wishes", "title": "第二单元・美丽心愿", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "04-chishui.json", "title": "吃水不忘挖井人", "icon": "🪚", "vocab": ["井", "想", "他", "地", "你", "人"]},
                    {"file": "05-woduoxiang.json", "title": "我多想去看看", "icon": "🏔️", "vocab": ["想", "我", "你", "地", "天", "春"]},
                    {"file": "06-pingguo.json", "title": "一个苹果", "icon": "🍎", "vocab": ["叶", "爸", "妈", "红", "花", "圆"]}
                ]
            },
            {
                "dir": "03-partners", "title": "第三单元・快乐伙伴", "themeColor": "#D97706",
                "lessons": [
                    {"file": "07-xiaogongji.json", "title": "小公鸡和小鸭子", "icon": "🐥", "vocab": ["他", "地", "你", "我", "春", "冬"]},
                    {"file": "08-shuhexique.json", "title": "树和喜鹊", "icon": "🐦", "vocab": ["双", "脑", "家", "冬", "春", "秋"]},
                    {"file": "09-zenmedoukuaile.json", "title": "怎么都快乐", "icon": "😄", "vocab": ["双", "国", "王", "主", "席", "亲"]}
                ]
            },
            {
                "dir": "04-family", "title": "第四单元・家人相伴", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "10-jingyesi.json", "title": "静夜思", "icon": "🌙", "vocab": ["我", "你", "他", "天", "地", "人"]},
                    {"file": "11-yese.json", "title": "夜色", "icon": "🌌", "vocab": ["想", "爸", "妈", "叶", "红", "花"]},
                    {"file": "12-duanwuzong.json", "title": "端午粽", "icon": "🍙", "vocab": ["姑", "娘", "红", "花", "春", "冬"]}
                ]
            },
            {
                "dir": "05-literacy2", "title": "第五单元・识字二", "themeColor": "#7C3AED",
                "lessons": [
                    {"file": "13-dongwuerge.json", "title": "动物儿歌", "icon": "🐝", "vocab": ["什", "么", "我", "你", "他", "人"]},
                    {"file": "14-guduijin.json", "title": "古对今", "icon": "☯️", "vocab": ["春", "夏", "冬", "秋", "红", "花"]},
                    {"file": "15-caochangshang.json", "title": "操场上", "icon": "跑", "vocab": ["手", "工", "做", "用", "姓", "什"]}
                ]
            },
            {
                "dir": "06-summer", "title": "第六单元・快乐夏天", "themeColor": "#0891B2",
                "lessons": [
                    {"file": "16-gushi2.json", "title": "古诗二首", "icon": "🍃", "vocab": ["我", "地", "天", "春", "冬", "秋"]},
                    {"file": "17-heye.json", "title": "荷叶圆圆", "icon": "☘️", "vocab": ["荷", "圆", "他", "你", "我", "地"]}
                ]
            },
            {
                "dir": "07-virtues", "title": "第七单元・好习惯好品质", "themeColor": "#DB2777",
                "lessons": [
                    {"file": "18-wenjudejia.json", "title": "文具的家", "icon": "🎒", "vocab": ["爸", "妈", "叶", "红", "花", "圆"]},
                    {"file": "19-yifenzhong.json", "title": "一分钟", "icon": "⏱️", "vocab": ["做", "用", "什", "么", "我", "你"]}
                ]
            },
            {
                "dir": "08-science", "title": "第八单元・奇妙科学", "themeColor": "#059669",
                "lessons": [
                    {"file": "20-mianhua.json", "title": "棉花姑娘", "icon": "☁️", "vocab": ["姑", "娘", "双", "脑", "工", "做"]},
                    {"file": "21-gudong.json", "title": "咕咚来了", "icon": "🌊", "vocab": ["人", "天", "地", "春", "夏", "秋"]}
                ]
            }
        ]
    },
    "grade-2-volume-1": {
        "units": [
            {
                "dir": "01-nature", "title": "第一单元・奇妙大自然", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-xiaokedou.json", "title": "小蝌蚪找妈妈", "icon": "🐸", "vocab": ["蝌", "蚪", "娃", "我", "地", "人"]},
                    {"file": "02-woshishenme.json", "title": "我是什么", "icon": "💧", "vocab": ["极", "飘", "我", "地", "天", "春"]},
                    {"file": "03-zhiwumama.json", "title": "植物妈妈有办法", "icon": "🌾", "vocab": ["娃", "飘", "极", "秋", "冬", "夏"]}
                ]
            },
            {
                "dir": "02-literacy", "title": "第二单元・场景与社会", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "04-changjinge.json", "title": "场景歌", "icon": "⛵", "vocab": ["桥", "极", "他", "地", "你", "人"]},
                    {"file": "05-shumuge.json", "title": "树木歌", "icon": "🌳", "vocab": ["枫", "极", "双", "脑", "工", "做"]},
                    {"file": "06-paishouge.json", "title": "拍手歌", "icon": "👏", "vocab": ["猫", "写", "手", "做", "用", "姓"]},
                    {"file": "07-tianjiashiji.json", "title": "田家四季歌", "icon": "🌾", "vocab": ["每", "笔", "春", "夏", "秋", "冬"]}
                ]
            },
            {
                "dir": "03-thinking", "title": "第三单元・观察与思考", "themeColor": "#D97706",
                "lessons": [
                    {"file": "08-caochong.json", "title": "曹冲称象", "icon": "🐘", "vocab": ["娃", "写", "想", "做", "用", "人"]},
                    {"file": "09-hongmaan.json", "title": "红马鞍", "icon": "🐎", "vocab": ["红", "娃", "手", "双", "脑", "信"]},
                    {"file": "10-yifengxin.json", "title": "一封信", "icon": "✉️", "vocab": ["信", "写", "笔", "手", "想", "我"]}
                ]
            },
            {
                "dir": "04-homeland", "title": "第四单元・美丽家乡", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "11-gushi2.json", "title": "古诗二首", "icon": "🏔️", "vocab": ["山", "日", "月", "天", "地", "石"]},
                    {"file": "12-huangshan.json", "title": "黄山奇石", "icon": "🪨", "vocab": ["石", "山", "景", "极", "想", "我"]},
                    {"file": "13-riyuebi.json", "title": "日月潭", "icon": "🏞️", "vocab": ["日", "月", "水", "湾", "景", "画"]}
                ]
            },
            {
                "dir": "05-wisdom", "title": "第五单元・思想与道理", "themeColor": "#7C3AED",
                "lessons": [
                    {"file": "14-zuojingguantian.json", "title": "坐井观天", "icon": "🐸", "vocab": ["井", "沿", "答", "信", "天", "口"]},
                    {"file": "15-hanhaoniao.json", "title": "寒号鸟", "icon": "🐦", "vocab": ["晴", "朗", "枯", "将", "冬", "风"]},
                    {"file": "16-hulu.json", "title": "我要的是葫芦", "icon": "🎃", "vocab": ["想", "治", "叶", "花", "了", "每"]}
                ]
            },
            {
                "dir": "06-virtue", "title": "第六单元・伟人与品格", "themeColor": "#0891B2",
                "lessons": [
                    {"file": "17-dayu.json", "title": "大禹治水", "icon": "🌊", "vocab": ["治", "水", "地", "人", "每", "做"]},
                    {"file": "18-zhude.json", "title": "朱德的扁担", "icon": "🥖", "vocab": ["扁", "担", "难", "人", "我", "信"]},
                    {"file": "19-poshuijie.json", "title": "难忘的泼水节", "icon": "💦", "vocab": ["泼", "水", "歌", "想", "极", "欢"]}
                ]
            },
            {
                "dir": "07-imagination", "title": "第七单元・想象与世界", "themeColor": "#DB2777",
                "lessons": [
                    {"file": "20-gushi2.json", "title": "古诗二首", "icon": "🌌", "vocab": ["日", "月", "星", "野", "天", "地"]},
                    {"file": "21-wuzainali.json", "title": "雾在哪里", "icon": "🌫️", "vocab": ["想", "飘", "地", "海", "人", "大"]},
                    {"file": "22-xuehaizi.json", "title": "雪孩子", "icon": "⛄", "vocab": ["雪", "化", "水", "极", "想", "了"]}
                ]
            },
            {
                "dir": "08-relation", "title": "第八单元・相处与智慧", "themeColor": "#059669",
                "lessons": [
                    {"file": "23-hujiahuwei.json", "title": "狐假虎威", "icon": "🦊", "vocab": ["娃", "飘", "极", "猫", "我", "地"]},
                    {"file": "24-hulifennaizhao.json", "title": "狐狸分奶酪", "icon": "🧀", "vocab": ["双", "脑", "工", "做", "用", "答"]}
                ]
            }
        ]
    },
    "grade-3-volume-2": {
        "units": [
            {
                "dir": "01-creatures", "title": "第一单元・可爱生灵", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-gushi3.json", "title": "古诗三首", "icon": "🌸", "vocab": ["燕", "花", "春", "日", "江", "山"]},
                    {"file": "02-yanzi.json", "title": "燕子", "icon": "🐦", "vocab": ["燕", "聚", "飞", "羽", "尾", "翼"]},
                    {"file": "03-hehua.json", "title": "荷花", "icon": "🪷", "vocab": ["荷", "蓬", "圆", "绿", "花", "瓣"]},
                    {"file": "04-kunchong.json", "title": "昆虫备忘录", "icon": "🐞", "vocab": ["昆", "录", "翅", "甲", "壳", "虫"]}
                ]
            },
            {
                "dir": "02-fables", "title": "第二单元・寓言故事", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "05-shouzhudaitu.json", "title": "守株待兔", "icon": "🐇", "vocab": ["守", "待", "宋", "释", "耕", "兔"]},
                    {"file": "06-taoguan.json", "title": "陶罐和铁罐", "icon": "🏺", "vocab": ["骄", "傲", "谦", "虚", "懦", "罐"]},
                    {"file": "07-lujiao.json", "title": "鹿角和鹿腿", "icon": "🦌", "vocab": ["鹿", "赏", "叹", "精", "配", "腿"]},
                    {"file": "08-chizi.json", "title": "池子与河流", "icon": "🌊", "vocab": ["河流", "池塘", "奔跑", "流逝", "静止", "源泉"]}
                ]
            },
            {
                "dir": "03-traditions", "title": "第三单元・传统文化", "themeColor": "#D97706",
                "lessons": [
                    {"file": "09-gushi3.json", "title": "古诗三首", "icon": "🏮", "vocab": ["川", "州", "节日", "重阳", "中秋", "扫墓"]},
                    {"file": "10-zhidefaming.json", "title": "纸的发明", "icon": "📜", "vocab": ["创", "阅", "蔡", "伦", "纸", "造"]},
                    {"file": "11-zhaozhouqiao.json", "title": "赵州桥", "icon": "🪨", "vocab": ["匠", "设", "县", "史", "石", "桥"]},
                    {"file": "12-yifuhua.json", "title": "名扬中外的画", "icon": "🎨", "vocab": ["择", "端", "河", "画", "卷", "市"]}
                ]
            },
            {
                "dir": "04-discoveries", "title": "第四单元・观察发现", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "13-huazhong.json", "title": "花钟", "icon": "⏰", "vocab": ["暮", "苏", "争", "艳", "芬", "芳"]},
                    {"file": "14-mifeng.json", "title": "蜜蜂", "icon": "🐝", "vocab": ["蜂", "辨", "阻", "跨", "括", "途"]},
                    {"file": "15-xiaoxia.json", "title": "小虾", "icon": "🦐", "vocab": ["缸", "隙", "掀", "蹦", "副", "搏"]}
                ]
            },
            {
                "dir": "05-imagination", "title": "第五单元・奇妙想象", "themeColor": "#7C3AED",
                "lessons": [
                    {"file": "16-changtoufa.json", "title": "小真的长头发", "icon": "💇", "vocab": ["超", "悠", "闲", "椅", "沫", "套"]},
                    {"file": "17-bianchengshu.json", "title": "我变成了一棵树", "icon": "🌳", "vocab": ["泡", "娇", "扯", "仰", "串", "婴"]}
                ]
            },
            {
                "dir": "06-childhood", "title": "第六单元・多彩童年", "themeColor": "#0891B2",
                "lessons": [
                    {"file": "18-shuimohua.json", "title": "童年的水墨画", "icon": "🎨", "vocab": ["染", "碎", "浪", "竿", "葫", "芦"]},
                    {"file": "19-titoudashi.json", "title": "剃头大师", "icon": "✂️", "vocab": ["剃", "仇", "骂", "付", "倍", "差"]},
                    {"file": "20-feizaopao.json", "title": "肥皂泡", "icon": "🫧", "vocab": ["若", "娇", "扯", "仰", "串", "婴"]},
                    {"file": "21-wobunengshixin.json", "title": "我不能失信", "icon": "🤝", "vocab": ["盼", "叠", "歉", "释", "信", "约"]}
                ]
            },
            {
                "dir": "07-wonders", "title": "第七单元・奇妙天地", "themeColor": "#DB2777",
                "lessons": [
                    {"file": "22-qimiaoshijie.json", "title": "我们奇妙的世界", "icon": "🌍", "vocab": ["幻", "润", "芒", "模", "型", "冰"]},
                    {"file": "23-haidishijie.json", "title": "海底世界", "icon": "🌊", "vocab": ["窃", "私", "警", "肌", "章", "胞"]},
                    {"file": "24-daxiongmao.json", "title": "国宝大熊猫", "icon": "🐼", "vocab": ["熊", "猫", "胖", "竹", "幼", "笋"]}
                ]
            },
            {
                "dir": "08-stories", "title": "第八单元・有趣故事", "themeColor": "#059669",
                "lessons": [
                    {"file": "25-caifeng.json", "title": "慢性子裁缝和急性子顾客", "icon": "🧵", "vocab": ["箱", "交", "橱", "改", "承", "袖"]},
                    {"file": "26-fangmaozi.json", "title": "方帽子店", "icon": "🎩", "vocab": ["焦", "粘", "扣", "嚷", "溜", "董"]},
                    {"file": "27-lou.json", "title": "漏", "icon": "💧", "vocab": ["脊", "贼", "狼", "莫", "胶", "粘"]},
                    {"file": "28-zaohe.json", "title": "枣核", "icon": "🌰", "vocab": ["枣", "核", "娶", "折", "罢", "牲"]}
                ]
            }
        ]
    }
}

# --- MATH CURRICULUM DEFINITIONS ---
MATH_COURSES = {
    "grade-1-volume-1": {
        "name": "数学一年级上册",
        "description": "认识20以内的数，掌握简单的加减法，识别基础图形并学会认钟表。",
        "flagEmoji": "🎒",
        "units": [
            {
                "dir": "01-numbers", "title": "第一单元・生活中的数", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-happyhome.json", "title": "快乐的家园", "icon": "🏡", "type": "conceptual", "topic": "count_1_5"},
                    {"file": "02-toys.json", "title": "玩具", "icon": "🧸", "type": "conceptual", "topic": "count_6_10"},
                    {"file": "03-cats.json", "title": "小猫钓鱼", "icon": "🐱", "type": "conceptual", "topic": "zero_concept"}
                ]
            },
            {
                "dir": "02-compare", "title": "第二单元・比较", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "04-birthday.json", "title": "过生日", "icon": "🎂", "type": "conceptual", "topic": "size_compare"},
                    {"file": "05-afterclass.json", "title": "下课啦", "icon": "🔔", "type": "conceptual", "topic": "height_compare"}
                ]
            },
            {
                "dir": "03-addsub1", "title": "第三单元・加与减（一）", "themeColor": "#D97706",
                "lessons": [
                    {"file": "06-howmany.json", "title": "一共有多少", "icon": "➕", "type": "calculation", "expr_type": "add_10"},
                    {"file": "07-howmuchleft.json", "title": "还剩多少", "icon": "➖", "type": "calculation", "expr_type": "sub_10"},
                    {"file": "08-cutes.json", "title": "可爱的小猫", "icon": "🐈", "type": "calculation", "expr_type": "addsub_0"},
                    {"file": "09-guessnumbers.json", "title": "猜数游戏", "icon": "🎲", "type": "calculation", "expr_type": "addsub_6_7"}
                ]
            },
            {
                "dir": "04-classify", "title": "第四单元・分类", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "10-schoolbag.json", "title": "整理书包", "icon": "🎒", "type": "conceptual", "topic": "classify_basics"}
                ]
            },
            {
                "dir": "05-position", "title": "第五单元・位置与顺序", "themeColor": "#7C3AED",
                "lessons": [
                    {"file": "11-frontback.json", "title": "前后", "icon": "🚶", "type": "conceptual", "topic": "front_back"},
                    {"file": "12-updown.json", "title": "上下", "icon": "🪜", "type": "conceptual", "topic": "up_down"},
                    {"file": "13-leftright.json", "title": "左右", "icon": "🫱", "type": "conceptual", "topic": "left_right"}
                ]
            },
            {
                "dir": "06-shapes", "title": "第六单元・认识图形", "themeColor": "#0891B2",
                "lessons": [
                    {"file": "14-recognize.json", "title": "认识图形", "icon": "🔺", "type": "conceptual", "topic": "shapes_basics"}
                ]
            },
            {
                "dir": "07-addsub2", "title": "第七单元・加与减（二）", "themeColor": "#DB2777",
                "lessons": [
                    {"file": "15-ancient.json", "title": "古人计数", "icon": "🦴", "type": "conceptual", "topic": "eleven_twenty"},
                    {"file": "16-blocks.json", "title": "搭积木", "icon": "🧱", "type": "calculation", "expr_type": "addsub_20_nocarry"},
                    {"file": "17-milk.json", "title": "有几瓶牛奶", "icon": "🥛", "type": "calculation", "expr_type": "add_9_carry"},
                    {"file": "18-trees.json", "title": "有几棵树", "icon": "🌲", "type": "calculation", "expr_type": "add_8_carry"}
                ]
            },
            {
                "dir": "08-clock", "title": "第八单元・认识钟表", "themeColor": "#059669",
                "lessons": [
                    {"file": "19-xiaomingday.json", "title": "小明的一天", "icon": "⏰", "type": "conceptual", "topic": "clock_hour"},
                    {"file": "20-clockpractice.json", "title": "钟表练习", "icon": "🕰️", "type": "conceptual", "topic": "clock_half_hour"}
                ]
            }
        ]
    },
    "grade-1-volume-2": {
        "name": "数学一年级下册",
        "description": "学习100以内的数与加减运算，开始接触有趣的二维平面图形与估算。",
        "flagEmoji": "🏫",
        "units": [
            {
                "dir": "01-addsub1", "title": "第一单元・加与减（一）", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-pencils.json", "title": "买铅笔", "icon": "✏️", "type": "calculation", "expr_type": "sub_9_carry"},
                    {"file": "02-hideandseek.json", "title": "捉迷藏", "icon": "🙈", "type": "calculation", "expr_type": "sub_8_carry"},
                    {"file": "03-ducks.json", "title": "快乐的小鸭", "icon": "🦆", "type": "calculation", "expr_type": "sub_7_6_carry"}
                ]
            },
            {
                "dir": "02-observe", "title": "第二单元・观察物体", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "04-look1.json", "title": "看一看（一）", "icon": "👁️", "type": "conceptual", "topic": "observe_basics"},
                    {"file": "05-look2.json", "title": "看一看（二）", "icon": "📦", "type": "conceptual", "topic": "observe_sides"}
                ]
            },
            {
                "dir": "03-numbers", "title": "第三单元・生活中的数", "themeColor": "#D97706",
                "lessons": [
                    {"file": "06-peanuts.json", "title": "数花生", "icon": "🥜", "type": "conceptual", "topic": "hundred_count"},
                    {"file": "07-count.json", "title": "数一数", "icon": "🔢", "type": "conceptual", "topic": "tens_ones"},
                    {"file": "08-order.json", "title": "数的顺序", "icon": "🔀", "type": "conceptual", "topic": "hundred_compare"}
                ]
            },
            {
                "dir": "04-shapes", "title": "第四单元・有趣的图形", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "09-recognize.json", "title": "认识图形", "icon": "🟦", "type": "conceptual", "topic": "flat_shapes"},
                    {"file": "10-diy1.json", "title": "动手做（一）", "icon": "✂️", "type": "conceptual", "topic": "tangram_fun"}
                ]
            },
            {
                "dir": "05-addsub2", "title": "第五单元・加与减（二）", "themeColor": "#7C3AED",
                "lessons": [
                    {"file": "11-library.json", "title": "图书馆", "icon": "📚", "type": "calculation", "expr_type": "add_twodigit_ones_carry"},
                    {"file": "12-apples.json", "title": "摘苹果", "icon": "🍎", "type": "calculation", "expr_type": "add_twodigit_twodigit_carry"},
                    {"file": "13-readingroom.json", "title": "阅览室", "icon": "📖", "type": "calculation", "expr_type": "sub_twodigit_ones_carry"},
                    {"file": "14-ropesing.json", "title": "跳绳", "icon": "🪢", "type": "calculation", "expr_type": "sub_twodigit_twodigit_carry"}
                ]
            },
            {
                "dir": "06-addsub3", "title": "第六单元・加与减（三）", "themeColor": "#0891B2",
                "lessons": [
                    {"file": "15-hoops.json", "title": "套圈游戏", "icon": "⭕", "type": "calculation", "expr_type": "three_numbers_add"},
                    {"file": "16-bus.json", "title": "乘车", "icon": "🚌", "type": "calculation", "expr_type": "three_numbers_mixed"},
                    {"file": "17-estimate.json", "title": "估算", "icon": "🧮", "type": "calculation", "expr_type": "easy_estimate"},
                    {"file": "18-comprehension.json", "title": "综合练习", "icon": "🧠", "type": "calculation", "expr_type": "math_fun"}
                ]
            }
        ]
    },
    "grade-2-volume-1": {
        "name": "数学二年级上册",
        "description": "全面掌握100以内的连加连减与混合运算，系统学习人民币计算与乘除法入门。",
        "flagEmoji": "📘",
        "units": [
            {
                "dir": "01-addsub", "title": "第一单元・加与减", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-highscore.json", "title": "谁的得分高", "icon": "🎯", "type": "calculation", "expr_type": "add_three_numbers"},
                    {"file": "02-autumn.json", "title": "秋游", "icon": "🍂", "type": "calculation", "expr_type": "sub_three_numbers"},
                    {"file": "03-chorus.json", "title": "星星合唱队", "icon": "🌟", "type": "calculation", "expr_type": "mixed_three_numbers"}
                ]
            },
            {
                "dir": "02-shopping", "title": "第二单元・购物", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "04-clothes.json", "title": "买衣服", "icon": "👕", "type": "conceptual", "topic": "rmb_basics"},
                    {"file": "05-littleshop.json", "title": "小小商店", "icon": "🏪", "type": "conceptual", "topic": "rmb_calc"}
                ]
            },
            {
                "dir": "03-multiply", "title": "第三单元・数一数与乘法", "themeColor": "#D97706",
                "lessons": [
                    {"file": "06-stickers.json", "title": "有多少张贴画", "icon": "🏷️", "type": "calculation", "expr_type": "multiply_table_5"},
                    {"file": "07-themepark.json", "title": "儿童乐园", "icon": "🎠", "type": "calculation", "expr_type": "multiply_basics"},
                    {"file": "08-apples.json", "title": "有多少个苹果", "icon": "🍏", "type": "calculation", "expr_type": "multiply_concept"}
                ]
            },
            {
                "dir": "04-shapechanges", "title": "第四单元・图形的变化", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "09-origami.json", "title": "折一折，剪一剪", "icon": "✂️", "type": "conceptual", "topic": "origami_fun"},
                    {"file": "10-symmetry.json", "title": "轴对称", "icon": "🦋", "type": "conceptual", "topic": "symmetry_basics"}
                ]
            },
            {
                "dir": "05-multable25", "title": "第五单元・2~5的乘法口诀", "themeColor": "#7C3AED",
                "lessons": [
                    {"file": "11-pinecone.json", "title": "数松果", "icon": "🌲", "type": "calculation", "expr_type": "multiply_5"},
                    {"file": "12-housework.json", "title": "做家务", "icon": "🧹", "type": "calculation", "expr_type": "multiply_2"},
                    {"file": "13-wheels.json", "title": "需要几个轮子", "icon": "🛞", "type": "calculation", "expr_type": "multiply_3"},
                    {"file": "14-bearshop.json", "title": "小熊开店", "icon": "🐻", "type": "calculation", "expr_type": "multiply_4"}
                ]
            },
            {
                "dir": "06-measurement", "title": "第六单元・测量", "themeColor": "#0891B2",
                "lessons": [
                    {"file": "15-classroom.json", "title": "教室有多长", "icon": " classroom", "type": "conceptual", "topic": "measure_classroom"},
                    {"file": "16-desk.json", "title": "课桌有多长", "icon": "📐", "type": "conceptual", "topic": "measure_desk_cm"},
                    {"file": "17-onemeter.json", "title": "1米有多长", "icon": "🧣", "type": "conceptual", "topic": "measure_meter"}
                ]
            },
            {
                "dir": "07-division", "title": "第七单元・分一分与除法", "themeColor": "#DB2777",
                "lessons": [
                    {"file": "18-apples.json", "title": "分苹果", "icon": "🍎", "type": "calculation", "expr_type": "divide_equal"},
                    {"file": "19-sweets.json", "title": "分糖果", "icon": "🍬", "type": "calculation", "expr_type": "divide_remainder"},
                    {"file": "20-bananas.json", "title": "分香蕉", "icon": "🍌", "type": "calculation", "expr_type": "divide_basics"}
                ]
            },
            {
                "dir": "08-multable69", "title": "第八单元・6~9的乘法口诀", "themeColor": "#059669",
                "lessons": [
                    {"file": "21-weeks.json", "title": "有多少个星期", "icon": "📅", "type": "calculation", "expr_type": "multiply_6_7_8"},
                    {"file": "22-buyballs.json", "title": "买球", "icon": "⚽", "type": "calculation", "expr_type": "multiply_9"}
                ]
            }
        ]
    },
    "grade-3-volume-2": {
        "name": "数学三年级下册",
        "description": "深入学习多位数乘除法与长方形面积计算，建立千克/克/吨质量概念并初步认识分数。",
        "flagEmoji": "🧮",
        "units": [
            {
                "dir": "01-division", "title": "第一单元・除法运算", "themeColor": "#16A34A",
                "lessons": [
                    {"file": "01-peaches.json", "title": "分桃子", "icon": "🍑", "type": "calculation", "expr_type": "div_twodigit_ones"},
                    {"file": "02-oranges.json", "title": "分橘子", "icon": "🍊", "type": "calculation", "expr_type": "div_twodigit_ones_carry"},
                    {"file": "03-digits.json", "title": "商是几位数", "icon": "🔢", "type": "calculation", "expr_type": "div_threedigit_ones"},
                    {"file": "04-monkeys.json", "title": "猴子的烦恼", "icon": "🐵", "type": "calculation", "expr_type": "div_with_zero"}
                ]
            },
            {
                "dir": "02-shapechanges", "title": "第二单元・图形的变化", "themeColor": "#DC2626",
                "lessons": [
                    {"file": "05-symmetry.json", "title": "轴对称（二）", "icon": "🦋", "type": "conceptual", "topic": "symmetry_advanced"},
                    {"file": "06-translations.json", "title": "平移和旋转", "icon": "🌀", "type": "conceptual", "topic": "translation_rotation"}
                ]
            },
            {
                "dir": "03-multiplication", "title": "第三单元・乘法", "themeColor": "#D97706",
                "lessons": [
                    {"file": "07-patterns.json", "title": "找规律", "icon": "🔍", "type": "calculation", "expr_type": "mul_tens"},
                    {"file": "08-formations.json", "title": "队列表演", "icon": "🕴️", "type": "calculation", "expr_type": "mul_twodigit_basics"},
                    {"file": "09-cinema.json", "title": "电影院", "icon": "🎬", "type": "calculation", "expr_type": "mul_twodigit_carry"}
                ]
            },
            {
                "dir": "04-mass", "title": "第四单元・千克、克、吨", "themeColor": "#2563EB",
                "lessons": [
                    {"file": "10-heavy.json", "title": "有多重", "icon": "⚖️", "type": "conceptual", "topic": "mass_kg_g"},
                    {"file": "11-oneton.json", "title": "1吨有多重", "icon": "🐘", "type": "conceptual", "topic": "mass_ton"}
                ]
            },
            {
                "dir": "05-area", "title": "第五单元・面积", "themeColor": "#7C3AED",
                "lessons": [
                    {"file": "12-whatisarea.json", "title": "什么是面积", "icon": "🟩", "type": "conceptual", "topic": "area_intro"},
                    {"file": "13-areaunits.json", "title": "面积单位", "icon": "📏", "type": "conceptual", "topic": "area_units"},
                    {"file": "14-rectarea.json", "title": "长方形面积", "icon": "📐", "type": "calculation", "expr_type": "area_calc"},
                    {"file": "15-conversions.json", "title": "面积单位的换算", "icon": "🔀", "type": "calculation", "expr_type": "area_conv"}
                ]
            },
            {
                "dir": "06-fractions", "title": "第六单元・认识分数", "themeColor": "#0891B2",
                "lessons": [
                    {"file": "16-cake.json", "title": "分吃蛋糕", "icon": "🎂", "type": "conceptual", "topic": "fraction_intro"},
                    {"file": "17-fractioncompare.json", "title": "分数的大小比较", "icon": "⚖️", "type": "conceptual", "topic": "fraction_compare"},
                    {"file": "18-watermelon.json", "title": "吃西瓜", "icon": "🍉", "type": "calculation", "expr_type": "fraction_addsub"}
                ]
            },
            {
                "dir": "07-data", "title": "第七单元・数据的整理和表示", "themeColor": "#DB2777",
                "lessons": [
                    {"file": "19-shoes.json", "title": "小小鞋店", "icon": "👟", "type": "conceptual", "topic": "data_collect"},
                    {"file": "20-outdoor.json", "title": "快乐户外", "icon": "🏕️", "type": "conceptual", "topic": "data_chart"}
                ]
            },
            {
                "dir": "08-mathisfun", "title": "第八单元・数学好玩", "themeColor": "#059669",
                "lessons": [
                    {"file": "21-tessellation.json", "title": "密铺", "icon": "🧱", "type": "conceptual", "topic": "tessellation"},
                    {"file": "22-matching.json", "title": "搭配中的学问", "icon": "👕", "type": "conceptual", "topic": "matching_combos"},
                    {"file": "23-sports.json", "title": "体育中的数学", "icon": "⚽", "type": "conceptual", "topic": "sports_math"},
                    {"file": "24-review.json", "title": "综合练习", "icon": "🧠", "type": "calculation", "expr_type": "grade3_review"}
                ]
            }
        ]
    }
}

# Base Output Directory
BASE_OUT_DIR = "apps/api/prisma/lesson-data"

def generate_chinese_lesson(course_id, unit_dir, lesson):
    # Generates exactly 25 exercises for a Chinese lesson
    exercises = []
    vocab = lesson["vocab"]
    pairs = lesson.get("pairs", [])
    
    # Pad vocab if needed
    while len(vocab) < 6:
        vocab = vocab + ["人", "手", "口", "天"]
    
    # ----------------------------------------------------
    # Type 1: pinyin_choice (6 exercises)
    # ----------------------------------------------------
    for i in range(6):
        char = vocab[i]
        py, struct, left, right = VOCAB_DICT.get(char, ("zhōng", "horizontal", "口", "丨"))
        
        # Distractors
        distractors = random.sample([d for d in PINYIN_DISTRACTORS if d != py], 3)
        options = [py] + distractors
        random.shuffle(options)
        correct_idx = options.index(py)
        
        exercises.append({
          "type": "pinyin_choice",
          "prompt": {
            "character": char,
            "hint": f"请选择字【{char}】的正确拼音",
            "options": options
          },
          "answer": {
            "correctIndex": correct_idx
          },
          "difficulty": 1
        })
        
    # ----------------------------------------------------
    # Type 2: pinyin_to_character_assemble (6 exercises)
    # ----------------------------------------------------
    for i in range(6):
        char = vocab[(i + 1) % len(vocab)]
        py, struct, left, right = VOCAB_DICT.get(char, ("zhōng", "horizontal", "口", "丨"))
        
        distractors = random.sample([c for c in ["木", "氵", "亻", "纟", "扌", "口", "日", "土"] if c not in [left, right]], 4)
        candidates = [left, right] + distractors
        random.shuffle(candidates)
        
        exercises.append({
          "type": "pinyin_to_character_assemble",
          "prompt": {
            "pinyin": py,
            "hint": f"请组装字【{char}】",
            "structure": struct,
            "slots": [{"id": "slot_1", "label": "部首/偏旁"}, {"id": "slot_2", "label": "部件/声旁"}],
            "candidates": candidates,
            "target": char
          },
          "answer": {
            "slotFills": {
              "slot_1": left,
              "slot_2": right
            }
          },
          "difficulty": 2
        })
        
    # ----------------------------------------------------
    # Type 3: match_pairs (6 exercises)
    # ----------------------------------------------------
    for i in range(6):
        # Create matching pairs
        sample_pairs = list(pairs)
        available_general_pairs = [gp for gp in CHINESE_PAIRS_DB if gp[0] not in [p[0] for p in sample_pairs]]
        needed = 4 - len(sample_pairs)
        if needed > 0:
            sample_pairs.extend(random.sample(available_general_pairs, min(needed, len(available_general_pairs))))
        sample_pairs = random.sample(sample_pairs, 4)
        
        left_nodes = [{"id": f"l_{idx}", "text": p[0]} for idx, p in enumerate(sample_pairs)]
        right_nodes = [{"id": f"r_{idx}", "text": p[1]} for idx, p in enumerate(sample_pairs)]
        random.shuffle(right_nodes)
        
        pairs_map = {}
        for l_node in left_nodes:
            matching_desc = next(p[1] for p in sample_pairs if p[0] == l_node["text"])
            r_node = next(r for r in right_nodes if r["text"] == matching_desc)
            pairs_map[l_node["id"]] = r_node["id"]
            
        exercises.append({
          "type": "match_pairs",
          "prompt": {
            "left": left_nodes,
            "right": right_nodes
          },
          "answer": {
            "pairs": pairs_map
          },
          "difficulty": 2
        })
        
    # ----------------------------------------------------
    # Type 4: single_choice (Comprehension - 5 exercises)
    # ----------------------------------------------------
    readings = lesson.get("reading_choices", CHINESE_READINGS["default"])
    for i in range(5):
        q, opts, correct_idx = readings[i % len(readings)]
        # Ensure option shuffling is not needed, or shuffle and adjust index:
        options = list(opts)
        correct_opt = options[correct_idx]
        random.shuffle(options)
        new_correct_idx = options.index(correct_opt)
        
        exercises.append({
          "type": "single_choice",
          "prompt": {
            "question": q,
            "options": options
          },
          "answer": {
            "correctIndex": new_correct_idx
          },
          "difficulty": 2
        })
        
    # ----------------------------------------------------
    # Type 5: word_bank (Sentence building - 2 exercises)
    # ----------------------------------------------------
    wb_src, wb_clean = lesson.get("word_bank_src", ("我喜欢读书和写字。", "我喜欢读书和写字"))
    # Split into clean words or chars
    wb_ordered = [c for c in wb_clean]
    tokens = list(wb_ordered) + random.sample(["天", "地", "人", "，", "。"], 2)
    random.shuffle(tokens)
    
    exercises.append({
      "type": "word_bank",
      "prompt": {
        "source": f"请把拼出的字词组合成经典的句子: '{wb_src}'",
        "tokens": tokens
      },
      "answer": {
        "ordered": list(wb_ordered)
      },
      "difficulty": 3
    })
    
    # Exercise 2: general sentence
    gen_src = "我们一起快快乐乐地上学去。"
    gen_ordered = ["我们", "一起", "快快乐乐地", "上学去", "。"]
    gen_tokens = list(gen_ordered) + ["学校", "，"]
    random.shuffle(gen_tokens)
    exercises.append({
      "type": "word_bank",
      "prompt": {
        "source": f"请组合出正确的句子: '{gen_src}'",
        "tokens": gen_tokens
      },
      "answer": {
        "ordered": gen_ordered
      },
      "difficulty": 2
    })
    
    return exercises[:25]

def generate_math_lesson(course_id, unit_dir, lesson):
    # Generates exactly 25 exercises for a Math lesson
    exercises = []
    l_type = lesson["type"]
    
    if l_type == "calculation":
        expr_type = lesson["expr_type"]
        # Procedurally generate arithmetic operations
        expr_value_pairs = []
        
        for _ in range(50): # generate huge pool, deduplicate
            a = b = c = 0
            expr_str = ""
            val = 0.0
            
            if expr_type == "add_10":
                a, b = random.randint(1, 9), random.randint(1, 9)
                expr_str, val = f"{a} + {b}", float(a + b)
            elif expr_type == "sub_10":
                a = random.randint(2, 10)
                b = random.randint(1, a - 1)
                expr_str, val = f"{a} - {b}", float(a - b)
            elif expr_type == "addsub_0":
                a = random.randint(0, 9)
                if random.random() < 0.5:
                    expr_str, val = f"{a} + 0", float(a)
                else:
                    expr_str, val = f"{a} - 0", float(a)
            elif expr_type == "addsub_6_7":
                a = random.choice([6, 7])
                b = random.randint(0, a)
                if random.random() < 0.5:
                    expr_str, val = f"{a} - {b}", float(a - b)
                else:
                    expr_str, val = f"{b} + {a - b}", float(a)
            elif expr_type == "addsub_20_nocarry":
                a = random.randint(10, 15)
                b = random.randint(1, 4)
                if random.random() < 0.5:
                    expr_str, val = f"{a} + {b}", float(a + b)
                else:
                    expr_str, val = f"{a} - {b}", float(a - b)
            elif expr_type == "add_9_carry":
                b = random.randint(2, 9)
                expr_str, val = f"9 + {b}", float(9 + b)
            elif expr_type == "add_8_carry":
                b = random.randint(3, 9)
                expr_str, val = f"8 + {b}", float(8 + b)
            elif expr_type == "sub_9_carry":
                a = random.randint(11, 18)
                expr_str, val = f"{a} - 9", float(a - 9)
            elif expr_type == "sub_8_carry":
                a = random.randint(11, 17)
                expr_str, val = f"{a} - 8", float(a - 8)
            elif expr_type == "sub_7_6_carry":
                sub_val = random.choice([7, 6])
                a = random.randint(11, 15)
                expr_str, val = f"{a} - {sub_val}", float(a - sub_val)
            elif expr_type == "add_twodigit_ones_carry":
                a = random.randint(21, 89)
                b = random.randint(2, 9)
                expr_str, val = f"{a} + {b}", float(a + b)
            elif expr_type == "add_twodigit_twodigit_carry":
                a = random.randint(15, 45)
                b = random.randint(15, 45)
                expr_str, val = f"{a} + {b}", float(a + b)
            elif expr_type == "sub_twodigit_ones_carry":
                a = random.randint(31, 95)
                b = random.randint(2, 9)
                expr_str, val = f"{a} - {b}", float(a - b)
            elif expr_type == "sub_twodigit_twodigit_carry":
                a = random.randint(45, 95)
                b = random.randint(15, 44)
                expr_str, val = f"{a} - {b}", float(a - b)
            elif expr_type == "three_numbers_add":
                a, b, c = random.randint(2, 9), random.randint(2, 9), random.randint(2, 9)
                expr_str, val = f"{a} + {b} + {c}", float(a + b + c)
            elif expr_type == "three_numbers_mixed":
                a, b, c = random.randint(10, 20), random.randint(2, 9), random.randint(2, 9)
                expr_str, val = f"{a} + {b} - {c}", float(a + b - c)
            elif expr_type == "easy_estimate":
                a, b = random.choice([19, 29, 39, 49]), random.randint(2, 5)
                expr_str, val = f"约 {a} * {b}", float(round(a, -1) * b)
            elif expr_type == "add_three_numbers":
                a, b, c = random.randint(10, 30), random.randint(10, 30), random.randint(10, 30)
                expr_str, val = f"{a} + {b} + {c}", float(a + b + c)
            elif expr_type == "sub_three_numbers":
                a = random.randint(80, 99)
                b, c = random.randint(15, 30), random.randint(15, 30)
                expr_str, val = f"{a} - {b} - {c}", float(a - b - c)
            elif expr_type == "mixed_three_numbers":
                a = random.randint(40, 60)
                b, c = random.randint(15, 30), random.randint(15, 30)
                expr_str, val = f"{a} - {b} + {c}", float(a - b + c)
            elif expr_type == "multiply_table_5":
                a = random.randint(1, 9)
                expr_str, val = f"5 * {a}", float(5 * a)
            elif expr_type == "multiply_basics":
                a, b = random.randint(2, 5), random.randint(2, 5)
                expr_str, val = f"{a} * {b}", float(a * b)
            elif expr_type == "multiply_5":
                a = random.randint(1, 9)
                expr_str, val = f"5 * {a}", float(5 * a)
            elif expr_type == "multiply_2":
                a = random.randint(1, 9)
                expr_str, val = f"2 * {a}", float(2 * a)
            elif expr_type == "multiply_3":
                a = random.randint(1, 9)
                expr_str, val = f"3 * {a}", float(3 * a)
            elif expr_type == "multiply_4":
                a = random.randint(1, 9)
                expr_str, val = f"4 * {a}", float(4 * a)
            elif expr_type == "multiply_6_7_8":
                a = random.choice([6, 7, 8])
                b = random.randint(2, 9)
                expr_str, val = f"{a} * {b}", float(a * b)
            elif expr_type == "multiply_9":
                a = random.randint(2, 9)
                expr_str, val = f"9 * {a}", float(9 * a)
            elif expr_type == "divide_equal":
                b = random.randint(2, 5)
                a = b * random.randint(2, 6)
                expr_str, val = f"{a} / {b}", float(a / b)
            elif expr_type == "divide_remainder":
                b = random.randint(3, 5)
                q = random.randint(2, 5)
                r = random.randint(1, b - 1)
                a = b * q + r
                expr_str, val = f"{a} / {b} 的商", float(q)
            elif expr_type == "divide_basics":
                b = random.randint(2, 6)
                a = b * random.randint(2, 8)
                expr_str, val = f"{a} / {b}", float(a / b)
            elif expr_type == "div_twodigit_ones":
                b = random.randint(2, 4)
                q = random.randint(11, 24)
                a = b * q
                expr_str, val = f"{a} / {b}", float(q)
            elif expr_type == "div_twodigit_ones_carry":
                b = random.choice([3, 4, 5])
                q = random.randint(12, 19)
                a = b * q
                expr_str, val = f"{a} / {b}", float(q)
            elif expr_type == "div_threedigit_ones":
                b = random.randint(3, 6)
                q = random.randint(105, 180)
                a = b * q
                expr_str, val = f"{a} / {b}", float(q)
            elif expr_type == "div_with_zero":
                b = random.choice([2, 3, 4])
                q = random.choice([101, 102, 103, 104, 201, 202])
                a = b * q
                expr_str, val = f"{a} / {b}", float(q)
            elif expr_type == "mul_tens":
                a = random.choice([10, 20, 30, 40])
                b = random.randint(2, 9)
                expr_str, val = f"{a} * {b}", float(a * b)
            elif expr_type == "mul_twodigit_basics":
                a = random.randint(11, 24)
                b = random.randint(2, 4)
                expr_str, val = f"{a} * {b}", float(a * b)
            elif expr_type == "mul_twodigit_carry":
                a = random.randint(24, 48)
                b = random.randint(3, 5)
                expr_str, val = f"{a} * {b}", float(a * b)
            elif expr_type == "area_calc":
                a = random.randint(5, 12)
                b = random.randint(3, 8)
                expr_str, val = f"长{a}宽{b}的长方形面积", float(a * b)
            elif expr_type == "area_conv":
                a = random.randint(2, 9)
                expr_str, val = f"{a}平方分米=多少平方厘米", float(a * 100)
            elif expr_type == "fraction_addsub":
                den = random.choice([5, 6, 7, 8])
                num1 = random.randint(1, den - 2)
                num2 = random.randint(1, den - num1 - 1)
                expr_str, val = f"{num1}/{den} + {num2}/{den}", float((num1 + num2) / den)
            else:
                a, b = random.randint(5, 20), random.randint(2, 9)
                expr_str, val = f"{a} + {b}", float(a + b)
                
            if (expr_str, val) not in expr_value_pairs:
                expr_value_pairs.append((expr_str, val))
                
        # ----------------------------------------------------
        # Type 1: numeric_input (16 exercises)
        # ----------------------------------------------------
        for i in range(16):
            expr_str, val = expr_value_pairs[i % len(expr_value_pairs)]
            exercises.append({
              "type": "numeric_input",
              "prompt": {
                "statement": f"{expr_str} = ?"
              },
              "answer": {
                "value": float(val),
                "tolerance": 0.01
              },
              "difficulty": 1
            })
            
        # ----------------------------------------------------
        # Type 2: match_pairs (6 exercises)
        # ----------------------------------------------------
        for i in range(6):
            sample_calcs = random.sample(expr_value_pairs[:12], 4)
            left_nodes = [{"id": f"l_{idx}", "text": f"{p[0]} = ?"} for idx, p in enumerate(sample_calcs)]
            right_nodes = [{"id": f"r_{idx}", "text": f"{p[1]}"} for idx, p in enumerate(sample_calcs)]
            random.shuffle(right_nodes)
            
            pairs_map = {}
            for l_node in left_nodes:
                matching_val = next(p[1] for p in sample_calcs if f"{p[0]} = ?" == l_node["text"])
                r_node = next(r for r in right_nodes if r["text"] == f"{matching_val}")
                pairs_map[l_node["id"]] = r_node["id"]
                
            exercises.append({
              "type": "match_pairs",
              "prompt": {
                "left": left_nodes,
                "right": right_nodes
              },
              "answer": {
                "pairs": pairs_map
              },
              "difficulty": 2
            })
            
        # ----------------------------------------------------
        # Type 3: single_choice (3 word problems)
        # ----------------------------------------------------
        word_probs = [
            ("小熊有25元，买了一支3元的画笔和一本5元的笔记本。它一共花了多少钱？", ["8元", "15元", "20元", "28元"], 0),
            ("操场上有3排同学，每排有12个人。一共有多少名同学？", ["36人", "15人", "24人", "40人"], 0),
            ("果园摘了45箱苹果，平均分给5个班的同学。每班分到多少箱？", ["9箱", "5箱", "15箱", "8箱"], 0)
        ]
        
        for i in range(3):
            q, opts, correct_idx = word_probs[i]
            options = list(opts)
            correct_opt = options[correct_idx]
            random.shuffle(options)
            new_correct_idx = options.index(correct_opt)
            
            exercises.append({
              "type": "single_choice",
              "prompt": {
                "question": q,
                "options": options
              },
              "answer": {
                "correctIndex": new_correct_idx
              },
              "difficulty": 2
            })
            
    else:
        # Conceptual lesson types (Observe objects, shapes, directions, clock, mass, etc.)
        topic = lesson["topic"]
        
        # Conceptual question generation database
        questions_pool = [
            ("圆柱体从正面和侧面看，看到的图形分别是什么形状？", ["长方形", "圆形", "三角形", "正方形"], 0),
            ("正方体从上面看，看到的是什么图形？", ["正方形", "长方形", "圆形", "六边形"], 0),
            ("球体从任何方向观察，看到的都是：", ["圆形", "正方形", "椭圆形", "三角形"], 0),
            ("时针走一大格，表示时间经过了：", ["1小时", "5分钟", "12小时", "60秒"], 0),
            ("普通计时法“下午2时”用24时计时法表示是：", ["14:00", "2:00", "16:00", "22:00"], 0),
            ("一个正方形的边长是4厘米，它的周长是：", ["16厘米", "8厘米", "12厘米", "20厘米"], 0),
            ("一个长方形长5米，宽3米，它的周长是：", ["16米", "15米", "8米", "10米"], 0),
            ("1吨也就是相当于多少千克？", ["1000千克", "100千克", "10千克", "10000千克"], 0),
            ("比较大小：3/5 与 2/5 相比：", ["3/5 > 2/5", "3/5 < 2/5", "3/5 = 2/5", "无法确定"], 0),
            ("一个涵洞的限制高度是3.5米。一辆高3.8米的大卡车能通过吗？", ["不能通过", "能安全通过", "只能加速通过", "无法确定"], 0),
            ("钟面上，分针走一小格是：", ["1分钟", "5分钟", "1小时", "1秒钟"], 0),
            ("把一个正方形平均分成4份，每份是它的：", ["四分之一", "四分之二", "全部", "八分之一"], 0),
            ("1千克也就是相当于多少克？", ["1000克", "100克", "10克", "500克"], 0),
            ("我们常用的面积单位不包括以下哪个？", ["米", "平方米", "平方分米", "平方厘米"], 0),
            ("从南往北看，你的左边是哪个方向？", ["西", "东", "南", "北"], 0),
            ("平移和旋转的区别是，平移：", ["方向和形状不变，只改变位置", "会改变物体的大小", "会让物体转圈", "会让物体消失"], 0)
        ]
        
        # ----------------------------------------------------
        # Type 1: single_choice (16 exercises)
        # ----------------------------------------------------
        for i in range(16):
            q, opts, correct_idx = questions_pool[i % len(questions_pool)]
            options = list(opts)
            correct_opt = options[correct_idx]
            random.shuffle(options)
            new_correct_idx = options.index(correct_opt)
            
            exercises.append({
              "type": "single_choice",
              "prompt": {
                "question": q,
                "options": options
              },
              "answer": {
                "correctIndex": new_correct_idx
              },
              "difficulty": 2
            })
            
        # ----------------------------------------------------
        # Type 2: match_pairs (9 exercises)
        # ----------------------------------------------------
        matches_pool = [
            ("时针", "指示小时"), ("分针", "指示分钟"),
            ("周长", "图形一周的长度"), ("面积", "图形表面的大小"),
            ("千克", "常用的质量单位"), ("克", "较轻的质量单位"),
            ("平移", "沿直线移动"), ("旋转", "绕中心点转动"),
            ("大月", "每月有31天"), ("小月", "每月有30天")
        ]
        
        for i in range(9):
            sample_matches = random.sample(matches_pool, 4)
            left_nodes = [{"id": f"l_{idx}", "text": m[0]} for idx, m in enumerate(sample_matches)]
            right_nodes = [{"id": f"r_{idx}", "text": m[1]} for idx, m in enumerate(sample_matches)]
            random.shuffle(right_nodes)
            
            pairs_map = {}
            for l_node in left_nodes:
                matching_desc = next(m[1] for m in sample_matches if m[0] == l_node["text"])
                r_node = next(r for r in right_nodes if r["text"] == matching_desc)
                pairs_map[l_node["id"]] = r_node["id"]
                
            exercises.append({
              "type": "match_pairs",
              "prompt": {
                "left": left_nodes,
                "right": right_nodes
              },
              "answer": {
                "pairs": pairs_map
              },
              "difficulty": 2
            })
            
    return exercises[:25]

def main():
    print("Executing master procedural generator for all 8 textbook volumes...")
    
    # ------------------ GENERATE CHINESE ------------------
    for course_id, course_data in CHINESE_COURSES.items():
        course_dir = os.path.join(BASE_OUT_DIR, "chinese", course_id)
        os.makedirs(course_dir, exist_ok=True)
        
        # Create units.json
        units_meta = {"units": []}
        for u_idx, unit in enumerate(course_data["units"]):
            units_meta["units"].append({
                "dir": unit["dir"],
                "orderIndex": u_idx,
                "title": unit["title"],
                "themeColor": unit["themeColor"]
            })
            
        with open(os.path.join(course_dir, "units.json"), "w", encoding="utf-8") as f:
            json.dump(units_meta, f, indent=2, ensure_ascii=False)
            
        # Create unit directory, lessons.json, and lesson file levels
        for unit in course_data["units"]:
            unit_path = os.path.join(course_dir, unit["dir"])
            os.makedirs(unit_path, exist_ok=True)
            
            lessons_meta = {"lessons": []}
            for l_idx, lesson in enumerate(unit["lessons"]):
                lessons_meta["lessons"].append({
                    "file": lesson["file"],
                    "orderIndex": l_idx,
                    "title": lesson["title"],
                    "icon": lesson["icon"]
                })
                
                # Generate level exercises
                exercises = generate_chinese_lesson(course_id, unit["dir"], lesson)
                with open(os.path.join(unit_path, lesson["file"]), "w", encoding="utf-8") as f:
                    json.dump({"exercises": exercises}, f, indent=2, ensure_ascii=False)
                    
            with open(os.path.join(unit_path, "lessons.json"), "w", encoding="utf-8") as f:
                json.dump(lessons_meta, f, indent=2, ensure_ascii=False)
                
    print("Chinese courses written to disk successfully!")
    
    # ------------------ GENERATE MATH ------------------
    for course_id, course_data in MATH_COURSES.items():
        course_dir = os.path.join(BASE_OUT_DIR, "math", course_id)
        os.makedirs(course_dir, exist_ok=True)
        
        # Create units.json
        units_meta = {"units": []}
        for u_idx, unit in enumerate(course_data["units"]):
            units_meta["units"].append({
                "dir": unit["dir"],
                "orderIndex": u_idx,
                "title": unit["title"],
                "themeColor": unit["themeColor"]
            })
            
        with open(os.path.join(course_dir, "units.json"), "w", encoding="utf-8") as f:
            json.dump(units_meta, f, indent=2, ensure_ascii=False)
            
        # Create unit directory, lessons.json, and lesson file levels
        for unit in course_data["units"]:
            unit_path = os.path.join(course_dir, unit["dir"])
            os.makedirs(unit_path, exist_ok=True)
            
            lessons_meta = {"lessons": []}
            for l_idx, lesson in enumerate(unit["lessons"]):
                lessons_meta["lessons"].append({
                    "file": lesson["file"],
                    "orderIndex": l_idx,
                    "title": lesson["title"],
                    "icon": lesson["icon"]
                })
                
                # Generate level exercises
                exercises = generate_math_lesson(course_id, unit["dir"], lesson)
                with open(os.path.join(unit_path, lesson["file"]), "w", encoding="utf-8") as f:
                    json.dump({"exercises": exercises}, f, indent=2, ensure_ascii=False)
                    
            with open(os.path.join(unit_path, "lessons.json"), "w", encoding="utf-8") as f:
                json.dump(lessons_meta, f, indent=2, ensure_ascii=False)
                
    print("Math courses written to disk successfully!")
    print("All curriculum generations completed successfully!")

if __name__ == "__main__":
    main()

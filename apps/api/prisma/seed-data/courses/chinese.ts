import { ex, type SeedCourseContent } from '../types';

export const chineseCourseContent: SeedCourseContent = {
  units: [
    {
      orderIndex: 0,
      title: '《咏柳》',
      themeColor: '#16A34A',
      lessons: [
        {
          orderIndex: 0,
          title: '读懂春柳',
          icon: '🌿',
          exercises: [
            ex('single_choice', {
              question: '《咏柳》的作者是？',
              options: ['贺知章', '高鼎', '李白', '杜甫'],
            }, { correctIndex: 0 }),
            ex('single_choice', {
              question: '“碧玉妆成一树高”把柳树比作什么？',
              options: ['穿着碧玉衣裳的美人', '一把剪刀', '一只黄莺', '一条小河'],
            }, { correctIndex: 0 }),
            ex('single_choice', {
              question: '“万条垂下绿丝绦”写的是柳树的什么？',
              options: ['柳条又多又绿地垂下来', '柳树开了红花', '柳树长得很矮', '柳叶落满地'],
            }, { correctIndex: 0 }),
            ex('pinyin_choice', {
              character: '妆',
              hint: '“碧玉妆成一树高”的妆',
              options: ['zhuāng', 'zhāng', 'chuāng', 'zuāng'],
            }, { correctIndex: 0 }),
            ex('pinyin_choice', {
              character: '裁',
              hint: '“不知细叶谁裁出”的裁',
              options: ['cái', 'chái', 'zāi', 'cǎi'],
            }, { correctIndex: 0 }),
            ex('match_pairs', {
              left: [
                { id: 'l1', text: '碧玉' },
                { id: 'l2', text: '绿丝绦' },
                { id: 'l3', text: '似剪刀' },
              ],
              right: [
                { id: 'r1', text: '像剪刀一样' },
                { id: 'r2', text: '绿色的丝带' },
                { id: 'r3', text: '绿色的美玉' },
              ],
            }, { pairs: { l1: 'r3', l2: 'r2', l3: 'r1' } }),
            ex('single_choice', {
              question: '这首诗主要描写了什么季节的柳树？',
              options: ['春天', '夏天', '秋天', '冬天'],
            }, { correctIndex: 0 }),
          ],
        },
        {
          orderIndex: 1,
          title: '背诵咏柳',
          icon: '📜',
          exercises: [
            ex('poem_complete', {
              title: '咏柳',
              author: '贺知章',
              lines: [
                ['碧玉', null, '一树高', '，'],
                ['万条垂下', '绿丝绦', '。'],
              ],
              options: ['妆成', '裁出', '吹成', '长成'],
            }, { correctIndex: 0 }),
            ex('poem_complete', {
              title: '咏柳',
              author: '贺知章',
              lines: [
                ['不知', null, '谁裁出', '，'],
                ['二月春风', '似剪刀', '。'],
              ],
              options: ['细叶', '柳条', '春烟', '纸鸢'],
            }, { correctIndex: 0 }),
            ex('match_pairs', {
              left: [
                { id: 'l1', text: '碧玉妆成一树高' },
                { id: 'l2', text: '万条垂下绿丝绦' },
                { id: 'l3', text: '不知细叶谁裁出' },
                { id: 'l4', text: '二月春风似剪刀' },
              ],
              right: [
                { id: 'r1', text: '是谁裁出了细细的柳叶呢' },
                { id: 'r2', text: '高高的柳树像碧玉装扮成的' },
                { id: 'r3', text: '二月春风好像灵巧的剪刀' },
                { id: 'r4', text: '千万条柳枝像绿色丝带垂下来' },
              ],
            }, { pairs: { l1: 'r2', l2: 'r4', l3: 'r1', l4: 'r3' } }),
            ex('word_bank', {
              source: '排出第一句',
              tokens: ['碧玉', '妆成', '一树高', '万条', '细叶'],
            }, { ordered: ['碧玉', '妆成', '一树高'] }),
            ex('word_bank', {
              source: '排出第二句',
              tokens: ['万条', '垂下', '绿丝绦', '二月', '剪刀'],
            }, { ordered: ['万条', '垂下', '绿丝绦'] }),
            ex('word_bank', {
              source: '排出第三句',
              tokens: ['不知', '细叶', '谁裁出', '春风', '碧玉'],
            }, { ordered: ['不知', '细叶', '谁裁出'] }),
            ex('word_bank', {
              source: '排出第四句',
              tokens: ['二月春风', '似剪刀', '绿丝绦', '谁裁出'],
            }, { ordered: ['二月春风', '似剪刀'] }),
          ],
        },
      ],
    },
    {
      orderIndex: 1,
      title: '《村居》',
      themeColor: '#F97316',
      lessons: [
        {
          orderIndex: 0,
          title: '读懂村居',
          icon: '🪁',
          exercises: [
            ex('single_choice', {
              question: '《村居》的作者是？',
              options: ['高鼎', '贺知章', '孟浩然', '王之涣'],
            }, { correctIndex: 0 }),
            ex('single_choice', {
              question: '“草长莺飞二月天”写出了什么景象？',
              options: ['青草生长、黄莺飞舞的早春', '大雪纷飞的冬天', '秋天落叶满地', '夏夜星星很多'],
            }, { correctIndex: 0 }),
            ex('single_choice', {
              question: '“拂堤杨柳醉春烟”中的“拂堤”是什么意思？',
              options: ['柳枝轻轻拂着堤岸', '孩子们跑过堤岸', '春风吹散烟雾', '小船停在岸边'],
            }, { correctIndex: 0 }),
            ex('pinyin_choice', {
              character: '莺',
              hint: '“草长莺飞二月天”的莺',
              options: ['yīng', 'yín', 'yǐng', 'yìng'],
            }, { correctIndex: 0 }),
            ex('pinyin_choice', {
              character: '鸢',
              hint: '“忙趁东风放纸鸢”的鸢',
              options: ['yuān', 'yān', 'yuán', 'yàn'],
            }, { correctIndex: 0 }),
            ex('match_pairs', {
              left: [
                { id: 'l1', text: '春烟' },
                { id: 'l2', text: '散学' },
                { id: 'l3', text: '纸鸢' },
              ],
              right: [
                { id: 'r1', text: '放学' },
                { id: 'r2', text: '风筝' },
                { id: 'r3', text: '春天水汽雾气' },
              ],
            }, { pairs: { l1: 'r3', l2: 'r1', l3: 'r2' } }),
            ex('single_choice', {
              question: '诗中儿童放学后急着去做什么？',
              options: ['放风筝', '读书', '采花', '划船'],
            }, { correctIndex: 0 }),
            ex('single_choice', {
              question: '《村居》描写的主要季节是？',
              options: ['春天', '夏天', '秋天', '冬天'],
            }, { correctIndex: 0 }),
            ex('single_choice', {
              question: '“醉春烟”在诗中更适合理解为？',
              options: ['杨柳在春天雾气中显得迷人', '孩子喝醉了在玩耍', '天空被烟火遮住了', '村庄里到处在做饭'],
            }, { correctIndex: 0 }),
            ex('single_choice', {
              question: '“忙趁东风放纸鸢”中的“趁”最接近哪个意思？',
              options: ['利用、借着', '躲开', '寻找', '等待'],
            }, { correctIndex: 0 }),
            ex('pinyin_choice', {
              character: '堤',
              hint: '“拂堤杨柳醉春烟”的堤',
              options: ['dī', 'tí', 'dēi', 'dì'],
            }, { correctIndex: 0 }),
            ex('pinyin_choice', {
              character: '趁',
              hint: '“忙趁东风放纸鸢”的趁',
              options: ['chèn', 'chèng', 'cèn', 'chéng'],
            }, { correctIndex: 0 }),
            ex('match_pairs', {
              left: [
                { id: 'l1', text: '草长莺飞' },
                { id: 'l2', text: '拂堤杨柳' },
                { id: 'l3', text: '忙趁东风' },
              ],
              right: [
                { id: 'r1', text: '借着春风做事' },
                { id: 'r2', text: '青草生长，黄莺飞舞' },
                { id: 'r3', text: '柳枝轻轻拂着堤岸' },
              ],
            }, { pairs: { l1: 'r2', l2: 'r3', l3: 'r1' } }),
            ex('single_choice', {
              question: '这首诗表达了怎样的生活气息？',
              options: ['春天乡村生活的生机与快乐', '边塞战争的紧张', '夜晚思乡的忧愁', '秋收劳动的辛苦'],
            }, { correctIndex: 0 }),
          ],
        },
        {
          orderIndex: 1,
          title: '背诵村居',
          icon: '📜',
          exercises: [
            ex('poem_complete', {
              title: '村居',
              author: '高鼎',
              lines: [
                ['草长', null, '二月天', '，'],
                ['拂堤杨柳', '醉春烟', '。'],
              ],
              options: ['莺飞', '柳飞', '燕回', '花开'],
            }, { correctIndex: 0 }),
            ex('poem_complete', {
              title: '村居',
              author: '高鼎',
              lines: [
                ['儿童散学', '归来早', '，'],
                ['忙趁东风', null, '。'],
              ],
              options: ['放纸鸢', '看柳树', '唱春歌', '过小桥'],
            }, { correctIndex: 0 }),
            ex('match_pairs', {
              left: [
                { id: 'l1', text: '草长莺飞二月天' },
                { id: 'l2', text: '拂堤杨柳醉春烟' },
                { id: 'l3', text: '儿童散学归来早' },
                { id: 'l4', text: '忙趁东风放纸鸢' },
              ],
              right: [
                { id: 'r1', text: '放学的孩子早早回来' },
                { id: 'r2', text: '青草生长、黄莺飞舞，正是二月春天' },
                { id: 'r3', text: '赶忙借着东风放风筝' },
                { id: 'r4', text: '杨柳轻拂堤岸，好像醉在春雾里' },
              ],
            }, { pairs: { l1: 'r2', l2: 'r4', l3: 'r1', l4: 'r3' } }),
            ex('word_bank', {
              source: '排出第一句',
              tokens: ['草长', '莺飞', '二月天', '东风', '纸鸢'],
            }, { ordered: ['草长', '莺飞', '二月天'] }),
            ex('word_bank', {
              source: '排出第二句',
              tokens: ['拂堤', '杨柳', '醉春烟', '莺飞', '归来早'],
            }, { ordered: ['拂堤', '杨柳', '醉春烟'] }),
            ex('word_bank', {
              source: '排出第三句',
              tokens: ['儿童', '散学', '归来早', '草长', '春烟'],
            }, { ordered: ['儿童', '散学', '归来早'] }),
            ex('word_bank', {
              source: '排出第四句',
              tokens: ['忙趁', '东风', '放纸鸢', '杨柳', '二月天'],
            }, { ordered: ['忙趁', '东风', '放纸鸢'] }),
          ],
        },
      ],
    },
  ],
};

import { ex, type SeedCourseContent } from '../types';

export const englishCourseContent: SeedCourseContent = {
  units: [
    {
      orderIndex: 0,
      title: '问候与基础',
      themeColor: '#3FB984',
      skills: [
        {
          orderIndex: 0,
          name: '打招呼',
          icon: '👋',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('translate_choice', {
                  source: '你好',
                  sourceLocale: 'zh-CN',
                  options: ['Hello', 'Goodbye', 'Sorry', 'Thanks'],
                }, { correctIndex: 0 }),
                ex('translate_choice', {
                  source: '再见',
                  sourceLocale: 'zh-CN',
                  options: ['Welcome', 'Hello', 'Goodbye', 'Please'],
                }, { correctIndex: 2 }),
                ex('translate_input', {
                  source: '谢谢',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['thank you', 'thanks'], tolerance: 1 }),
                ex('listen_input', {
                  audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/hello--_gb_1.mp3',
                }, { accepted: ['hello'], tolerance: 1 }),
                ex('word_bank', {
                  source: '早上好',
                  tokens: ['Good', 'morning', 'evening', 'night'],
                }, { ordered: ['Good', 'morning'] }),
                ex('match_pairs', {
                  left: [
                    { id: 'l1', text: '你好' },
                    { id: 'l2', text: '再见' },
                    { id: 'l3', text: '谢谢' },
                  ],
                  right: [
                    { id: 'r1', text: 'Goodbye' },
                    { id: 'r2', text: 'Thanks' },
                    { id: 'r3', text: 'Hello' },
                  ],
                }, { pairs: { l1: 'r3', l2: 'r1', l3: 'r2' } }),
                ex('translate_input', {
                  source: '对不起',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['sorry', "i'm sorry"], tolerance: 1 }),
              ],
            },
            {
              level: 1,
              orderIndex: 1,
              exercises: [
                ex('single_choice', {
                  question: 'Which is a greeting?',
                  options: ['Apple', 'Hello', 'Run', 'Big'],
                }, { correctIndex: 1 }),
                ex('translate_choice', {
                  source: '请',
                  sourceLocale: 'zh-CN',
                  options: ['Please', 'Maybe', 'Now', 'Why'],
                }, { correctIndex: 0 }),
                ex('translate_input', {
                  source: '欢迎',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['welcome'], tolerance: 1 }),
                ex('word_bank', {
                  source: '晚安',
                  tokens: ['Good', 'night', 'morning'],
                }, { ordered: ['Good', 'night'] }),
                ex('listen_input', {
                  audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/welcome--_gb_1.mp3',
                }, { accepted: ['welcome'], tolerance: 1 }),
                ex('translate_choice', {
                  source: '你好吗',
                  sourceLocale: 'zh-CN',
                  options: ['What is this', 'How are you', 'Where are you', 'Who are you'],
                }, { correctIndex: 1 }),
                ex('translate_input', {
                  source: '我很好',
                  sourceLocale: 'zh-CN',
                }, { accepted: ["i'm fine", 'i am fine', 'i am good'], tolerance: 2 }),
              ],
            },
          ],
        },
        {
          orderIndex: 1,
          name: '人称代词',
          icon: '👤',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('translate_choice', {
                  source: '我',
                  sourceLocale: 'zh-CN',
                  options: ['You', 'I', 'He', 'They'],
                }, { correctIndex: 1 }),
                ex('translate_choice', {
                  source: '你',
                  sourceLocale: 'zh-CN',
                  options: ['You', 'We', 'She', 'It'],
                }, { correctIndex: 0 }),
                ex('translate_input', {
                  source: '他',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['he'], tolerance: 0 }),
                ex('translate_input', {
                  source: '她',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['she'], tolerance: 0 }),
                ex('image_choice', {
                  word: 'I',
                  options: [
                    { id: 'me', label: 'I', imageUrl: 'https://placehold.co/480x360/E6F4EC/1F2937.png?text=I' },
                    { id: 'you', label: 'You', imageUrl: 'https://placehold.co/480x360/EEF2FF/1F2937.png?text=You' },
                    { id: 'he', label: 'He', imageUrl: 'https://placehold.co/480x360/FEE2E2/1F2937.png?text=He' },
                    { id: 'they', label: 'They', imageUrl: 'https://placehold.co/480x360/FEF3C7/1F2937.png?text=They' },
                  ],
                }, { correctOptionId: 'me' }),
                ex('word_bank', {
                  source: '我们是学生',
                  tokens: ['We', 'are', 'students', 'is', 'student'],
                }, { ordered: ['We', 'are', 'students'] }),
                ex('translate_choice', {
                  source: '他们',
                  sourceLocale: 'zh-CN',
                  options: ['We', 'They', 'You', 'I'],
                }, { correctIndex: 1 }),
              ],
            },
          ],
        },
      ],
    },
    {
      orderIndex: 1,
      title: '日常词汇',
      themeColor: '#F97316',
      skills: [
        {
          orderIndex: 0,
          name: '食物',
          icon: '🍎',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('translate_choice', {
                  source: '苹果',
                  sourceLocale: 'zh-CN',
                  options: ['Apple', 'Banana', 'Orange', 'Grape'],
                }, { correctIndex: 0 }),
                ex('translate_choice', {
                  source: '水',
                  sourceLocale: 'zh-CN',
                  options: ['Wine', 'Water', 'Milk', 'Juice'],
                }, { correctIndex: 1 }),
                ex('translate_input', {
                  source: '面包',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['bread'], tolerance: 0 }),
                ex('translate_input', {
                  source: '牛奶',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['milk'], tolerance: 0 }),
                ex('image_choice', {
                  word: 'apple',
                  audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/apple--_gb_1.mp3',
                  options: [
                    { id: 'apple', label: 'Apple', imageUrl: 'https://placehold.co/480x360/FEE2E2/991B1B.png?text=Apple' },
                    { id: 'bread', label: 'Bread', imageUrl: 'https://placehold.co/480x360/FEF3C7/92400E.png?text=Bread' },
                    { id: 'water', label: 'Water', imageUrl: 'https://placehold.co/480x360/DBEAFE/1D4ED8.png?text=Water' },
                    { id: 'milk', label: 'Milk', imageUrl: 'https://placehold.co/480x360/F8FAFC/334155.png?text=Milk' },
                  ],
                }, { correctOptionId: 'apple' }),
                ex('match_pairs', {
                  left: [
                    { id: 'l1', text: '苹果' },
                    { id: 'l2', text: '水' },
                    { id: 'l3', text: '面包' },
                  ],
                  right: [
                    { id: 'r1', text: 'Bread' },
                    { id: 'r2', text: 'Apple' },
                    { id: 'r3', text: 'Water' },
                  ],
                }, { pairs: { l1: 'r2', l2: 'r3', l3: 'r1' } }),
                ex('word_bank', {
                  source: '我喝水',
                  tokens: ['I', 'drink', 'water', 'eat', 'food'],
                }, { ordered: ['I', 'drink', 'water'] }),
              ],
            },
          ],
        },
        {
          orderIndex: 1,
          name: '颜色',
          icon: '🎨',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('translate_choice', {
                  source: '红色',
                  sourceLocale: 'zh-CN',
                  options: ['Red', 'Blue', 'Green', 'Yellow'],
                }, { correctIndex: 0 }),
                ex('translate_choice', {
                  source: '蓝色',
                  sourceLocale: 'zh-CN',
                  options: ['Pink', 'Black', 'Blue', 'White'],
                }, { correctIndex: 2 }),
                ex('translate_input', {
                  source: '绿色',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['green'], tolerance: 0 }),
                ex('translate_input', {
                  source: '黄色',
                  sourceLocale: 'zh-CN',
                }, { accepted: ['yellow'], tolerance: 1 }),
                ex('image_choice', {
                  word: 'blue',
                  options: [
                    { id: 'red', label: 'Red', imageUrl: 'https://placehold.co/480x360/FEE2E2/DC2626.png?text=Red' },
                    { id: 'blue', label: 'Blue', imageUrl: 'https://placehold.co/480x360/DBEAFE/2563EB.png?text=Blue' },
                    { id: 'green', label: 'Green', imageUrl: 'https://placehold.co/480x360/DCFCE7/16A34A.png?text=Green' },
                    { id: 'yellow', label: 'Yellow', imageUrl: 'https://placehold.co/480x360/FEF9C3/CA8A04.png?text=Yellow' },
                  ],
                }, { correctOptionId: 'blue' }),
                ex('word_bank', {
                  source: '苹果是红色的',
                  tokens: ['The', 'apple', 'is', 'red', 'blue'],
                }, { ordered: ['The', 'apple', 'is', 'red'] }),
                ex('single_choice', {
                  question: 'Which one is a color?',
                  options: ['Bread', 'Green', 'Walk', 'Tree'],
                }, { correctIndex: 1 }),
              ],
            },
          ],
        },
      ],
    },
  ],
};

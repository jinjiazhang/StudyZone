import { ex, type SeedCourseContent } from '../types';

export const mathCourseContent: SeedCourseContent = {
  units: [
    {
      orderIndex: 0,
      title: '加减法基础',
      themeColor: '#F59E0B',
      skills: [
        {
          orderIndex: 0,
          name: '一位数加法',
          icon: '➕',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('numeric_input', { statement: '3 + 4 = ?' }, { value: 7 }),
                ex('numeric_input', { statement: '5 + 2 = ?' }, { value: 7 }),
                ex('match_pairs', {
                  left: [
                    { id: 'l1', text: '3 + 4' },
                    { id: 'l2', text: '4 + 4' },
                    { id: 'l3', text: '6 + 3' },
                  ],
                  right: [
                    { id: 'r1', text: '9' },
                    { id: 'r2', text: '7' },
                    { id: 'r3', text: '8' },
                  ],
                }, { pairs: { l1: 'r2', l2: 'r3', l3: 'r1' } }),
                ex('numeric_input', { statement: '6 + 3 = ?' }, { value: 9 }),
                ex('single_choice', {
                  question: '8 + 1 = ?',
                  options: ['7', '8', '9', '10'],
                }, { correctIndex: 2 }),
                ex('numeric_input', { statement: '2 + 2 = ?' }, { value: 4 }),
                ex('single_choice', {
                  question: '4 + 5 = ?',
                  options: ['8', '9', '10', '11'],
                }, { correctIndex: 1 }),
              ],
            },
          ],
        },
        {
          orderIndex: 1,
          name: '一位数减法',
          icon: '➖',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('numeric_input', { statement: '9 - 3 = ?' }, { value: 6 }),
                ex('numeric_input', { statement: '7 - 2 = ?' }, { value: 5 }),
                ex('numeric_input', { statement: '8 - 5 = ?' }, { value: 3 }),
                ex('single_choice', {
                  question: '10 - 4 = ?',
                  options: ['4', '5', '6', '7'],
                }, { correctIndex: 2 }),
                ex('image_choice', {
                  word: 'Which picture shows 6?',
                  options: [
                    { id: 'four', label: '4', imageUrl: 'https://placehold.co/480x360/EEF2FF/3730A3.png?text=4' },
                    { id: 'five', label: '5', imageUrl: 'https://placehold.co/480x360/E0F2FE/0369A1.png?text=5' },
                    { id: 'six', label: '6', imageUrl: 'https://placehold.co/480x360/DCFCE7/15803D.png?text=6' },
                    { id: 'seven', label: '7', imageUrl: 'https://placehold.co/480x360/FEF3C7/B45309.png?text=7' },
                  ],
                }, { correctOptionId: 'six' }),
                ex('numeric_input', { statement: '6 - 1 = ?' }, { value: 5 }),
                ex('single_choice', {
                  question: '5 - 5 = ?',
                  options: ['0', '1', '5', '10'],
                }, { correctIndex: 0 }),
              ],
            },
          ],
        },
      ],
    },
    {
      orderIndex: 1,
      title: '乘法启蒙',
      themeColor: '#3B82F6',
      skills: [
        {
          orderIndex: 0,
          name: '2 的乘法',
          icon: '✖️',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('numeric_input', { statement: '2 × 3 = ?' }, { value: 6 }),
                ex('numeric_input', { statement: '2 × 4 = ?' }, { value: 8 }),
                ex('numeric_input', { statement: '2 × 6 = ?' }, { value: 12 }),
                ex('single_choice', {
                  question: '2 × 7 = ?',
                  options: ['12', '13', '14', '15'],
                }, { correctIndex: 2 }),
                ex('word_bank', {
                  source: '2 × 8 等于 16',
                  tokens: ['2', '×', '8', '=', '16', '14'],
                }, { ordered: ['2', '×', '8', '=', '16'] }),
                ex('numeric_input', { statement: '2 × 9 = ?' }, { value: 18 }),
                ex('single_choice', {
                  question: '2 × 8 = ?',
                  options: ['14', '16', '18', '20'],
                }, { correctIndex: 1 }),
              ],
            },
          ],
        },
        {
          orderIndex: 1,
          name: '5 的乘法',
          icon: '⭐',
          lessons: [
            {
              level: 1,
              orderIndex: 0,
              exercises: [
                ex('numeric_input', { statement: '5 × 2 = ?' }, { value: 10 }),
                ex('numeric_input', { statement: '5 × 4 = ?' }, { value: 20 }),
                ex('numeric_input', { statement: '5 × 6 = ?' }, { value: 30 }),
                ex('single_choice', {
                  question: '5 × 5 = ?',
                  options: ['20', '25', '30', '35'],
                }, { correctIndex: 1 }),
                ex('match_pairs', {
                  left: [
                    { id: 'l1', text: '5 × 2' },
                    { id: 'l2', text: '5 × 4' },
                    { id: 'l3', text: '5 × 6' },
                  ],
                  right: [
                    { id: 'r1', text: '20' },
                    { id: 'r2', text: '30' },
                    { id: 'r3', text: '10' },
                  ],
                }, { pairs: { l1: 'r3', l2: 'r1', l3: 'r2' } }),
                ex('numeric_input', { statement: '5 × 9 = ?' }, { value: 45 }),
                ex('single_choice', {
                  question: '5 × 7 = ?',
                  options: ['30', '35', '40', '45'],
                }, { correctIndex: 1 }),
              ],
            },
          ],
        },
      ],
    },
  ],
};

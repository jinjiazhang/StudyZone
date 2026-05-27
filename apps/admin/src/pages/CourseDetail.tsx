import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminExerciseDto } from '@studyzone/shared-types';
import { api } from '../state';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdminExerciseDto | null>(null);
  const [promptJson, setPromptJson] = useState('');
  const [answerJson, setAnswerJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin-course-content', id],
    queryFn: () => api.getAdminCourseContent(id!),
    enabled: !!id,
  });

  const exercises = useMemo(() => {
    return (
      course?.units.flatMap((unit) =>
        unit.lessons.flatMap((lesson) =>
          lesson.exercises.map((exercise) => ({ unit, lesson, exercise })),
        ),
      ) ?? []
    );
  }, [course]);

  const update = useMutation({
    mutationFn: (exercise: AdminExerciseDto) =>
      api.updateAdminExercise(exercise.id, {
        type: exercise.type,
        prompt: JSON.parse(promptJson),
        answer: JSON.parse(answerJson),
        difficulty: exercise.difficulty,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-course-content', id] });
      setSelected(null);
    },
  });

  useEffect(() => {
    if (!selected) return;
    setPromptJson(JSON.stringify(selected.prompt, null, 2));
    setAnswerJson(JSON.stringify(selected.answer, null, 2));
    setError(null);
  }, [selected]);

  async function save() {
    if (!selected) return;
    setError(null);
    try {
      JSON.parse(promptJson);
      JSON.parse(answerJson);
      await update.mutateAsync(selected);
    } catch (err) {
      setError(err instanceof SyntaxError ? 'JSON 格式不正确' : '保存失败');
    }
  }

  if (isLoading) return <div style={muted}>载入课程内容...</div>;
  if (!course) return <div style={muted}>课程不存在</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 24 }}>
      <section>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>{course.name}</h1>
          <p style={{ color: '#6b7280', marginTop: 6 }}>{course.description}</p>
        </div>

        {course.units.map((unit) => (
          <div key={unit.id} style={{ marginBottom: 24 }}>
            <div style={{ ...unitHeader, background: unit.themeColor }}>
              单元 {unit.orderIndex + 1} · {unit.title}
            </div>

            {unit.lessons.map((lesson) => (
              <div key={lesson.id} style={lessonBlock}>
                <div style={lessonTitle}>
                  <span style={{ fontSize: 22 }}>{lesson.icon}</span>
                  <span>{lesson.title}</span>
                  <span style={pill}>{lesson.exercises.length} 题</span>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {lesson.exercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => setSelected(exercise)}
                      style={{ ...exerciseRow, borderColor: selected?.id === exercise.id ? '#3FB984' : '#e5e7eb' }}
                    >
                      <span style={typeBadge}>{exercise.type}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>{summary(exercise.prompt)}</span>
                      <span style={muted}>难度 {exercise.difficulty}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {selected && (
        <aside style={editorPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>编辑题目</h2>
              <div style={muted}>{selected.type}</div>
            </div>
            <button onClick={() => setSelected(null)} style={ghostButton}>关闭</button>
          </div>

          <label style={label}>
            Prompt JSON
            <textarea value={promptJson} onChange={(e) => setPromptJson(e.target.value)} style={textarea} />
          </label>

          <label style={label}>
            Answer JSON
            <textarea value={answerJson} onChange={(e) => setAnswerJson(e.target.value)} style={textarea} />
          </label>

          {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <button onClick={save} disabled={update.isPending} style={saveButton}>
            {update.isPending ? '保存中...' : '保存'}
          </button>
        </aside>
      )}

      {!selected && exercises.length === 0 && <div style={muted}>暂无题目</div>}
    </div>
  );
}

function summary(prompt: unknown) {
  if (!prompt || typeof prompt !== 'object') return '未命名题目';
  const p = prompt as Record<string, unknown>;
  return String(p.source ?? p.question ?? p.statement ?? p.word ?? p.title ?? p.type ?? '未命名题目');
}

const muted: React.CSSProperties = { color: '#6b7280', fontSize: 13 };
const unitHeader: React.CSSProperties = { color: 'white', padding: 12, borderRadius: 8, fontWeight: 700 };
const lessonBlock: React.CSSProperties = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 10, overflow: 'hidden', padding: 12 };
const lessonTitle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #eef2f7', fontWeight: 700, marginBottom: 12 };
const pill: React.CSSProperties = { marginLeft: 'auto', color: '#6b7280', background: '#f3f4f6', borderRadius: 999, padding: '3px 8px', fontSize: 12 };
const exerciseRow: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', color: '#1f2937' };
const typeBadge: React.CSSProperties = { minWidth: 116, color: '#0f766e', background: '#ccfbf1', borderRadius: 6, padding: '3px 6px', fontSize: 12, fontWeight: 700 };
const editorPanel: React.CSSProperties = { position: 'sticky', top: 24, alignSelf: 'start', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'grid', gap: 14 };
const label: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 };
const textarea: React.CSSProperties = { minHeight: 180, resize: 'vertical', border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 };
const saveButton: React.CSSProperties = { padding: 10, border: 'none', borderRadius: 8, background: '#3FB984', color: 'white', fontWeight: 800, cursor: 'pointer' };
const ghostButton: React.CSSProperties = { padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 8, background: 'white', cursor: 'pointer' };

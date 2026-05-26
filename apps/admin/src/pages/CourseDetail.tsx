import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../state';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tree } = useQuery({
    queryKey: ['admin-tree', id],
    queryFn: () => api.getCourseTree(id!),
    enabled: !!id,
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>课程结构</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        浏览课程的单元 / 技能 / 关卡结构。题目编辑器可在此基础上扩展。
      </p>
      {tree?.map((unit) => (
        <div key={unit.unitId} style={{ marginBottom: 24 }}>
          <div
            style={{
              background: unit.themeColor,
              color: 'white',
              padding: 12,
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            单元 {unit.unitOrder + 1} · {unit.unitTitle}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
            {unit.skills.map((s) => (
              <li
                key={s.skillId}
                style={{
                  background: 'white',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  marginTop: 6,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>{s.lessonCount} 关卡</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

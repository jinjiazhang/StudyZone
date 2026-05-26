import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../state';

export function Courses() {
  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api.listCourses(),
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>课程管理</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {courses?.map((c) => (
          <Link
            to={`/courses/${c.id}`}
            key={c.id}
            style={{
              background: 'white',
              padding: 16,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              color: '#1f2937',
            }}
          >
            <div style={{ fontSize: 32 }}>{c.flagEmoji}</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

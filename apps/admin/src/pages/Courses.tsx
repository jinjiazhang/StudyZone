import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../state';

export function Courses() {
  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api.listCourses(),
  });
  const { data: subjects } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => api.listSubjects(),
  });
  const courseGroups = subjects
    ?.map((subject) => ({
      subject,
      courses: courses?.filter((course) => course.subjectId === subject.id) ?? [],
    }))
    .filter((group) => group.courses.length > 0);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>课程管理</h1>
      <div style={{ display: 'grid', gap: 24 }}>
        {courseGroups?.map(({ subject, courses: subjectCourses }) => (
          <section key={subject.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: subject.color,
                }}
              />
              <h2 style={{ fontSize: 18, margin: 0 }}>{subject.name}</h2>
              <div style={{ height: 1, flex: 1, background: '#e5e7eb' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {subjectCourses.map((c) => (
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
                  <img
                    src={c.coverImageUrl}
                    alt={`${c.name}封面`}
                    style={{
                      width: 112,
                      height: 152,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      objectFit: 'contain',
                      background: 'white',
                    }}
                  />
                  <div style={{ fontWeight: 700, marginTop: 8 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.description}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {courses && courses.length === 0 && (
          <div
            style={{
              background: 'white',
              padding: 16,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            暂无课程
          </div>
        )}
        {!subjects && courses?.map((c) => (
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
            <img
              src={c.coverImageUrl}
              alt={`${c.name}封面`}
              style={{
                width: 112,
                height: 152,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                objectFit: 'contain',
                background: 'white',
              }}
            />
            <div style={{ fontWeight: 700, marginTop: 8 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

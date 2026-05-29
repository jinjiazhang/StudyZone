import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { Layout } from './pages/Layout';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Users } from './pages/Users';
import { Leagues } from './pages/Leagues';
import { useAuth } from './state';

const client = new QueryClient();
const adminBase = ((import.meta as any).env?.VITE_ADMIN_BASE ?? '/admin').replace(/\/$/, '');

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter basename={adminBase}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Navigate to="/courses" replace />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="leagues" element={<Leagues />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

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
const RouterRoutes = Routes as unknown as React.ComponentType<{ children?: React.ReactNode }>;
const RouterRoute = Route as unknown as React.ComponentType<any>;
const RouterNavigate = Navigate as unknown as React.ComponentType<any>;

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.accessToken);
  if (!token) return <RouterNavigate to="/login" replace />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter basename={adminBase}>
        <RouterRoutes>
          <RouterRoute path="/login" element={<Login />} />
          <RouterRoute
            path="/"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <RouterRoute index element={<RouterNavigate to="/courses" replace />} />
            <RouterRoute path="courses" element={<Courses />} />
            <RouterRoute path="courses/:id" element={<CourseDetail />} />
            <RouterRoute path="leagues" element={<Leagues />} />
            <RouterRoute path="users" element={<Users />} />
          </RouterRoute>
        </RouterRoutes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import ScheduleDetail from './pages/ScheduleDetail';
import Schedule from './pages/Schedule';
import NotionIntegration from './pages/NotionIntegration';

// Context Providers
import { SportConfigProvider } from './contexts/SportConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider maxSnack={3}>
        <SportConfigProvider defaultSportId={1}>
          <ThemeProvider>
            <CssBaseline />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="schedules" element={<Schedules />} />
                  <Route path="schedules/:id" element={<ScheduleDetail />} />
                  <Route path="schedule" element={<Schedule />} />
                  {/* Integrations */}
                  <Route path="integrations/notion" element={<NotionIntegration />} />
                  {/* Add more routes as needed */}
                  <Route path="teams" element={<div>Teams Page (Coming Soon)</div>} />
                  <Route path="venues" element={<div>Venues Page (Coming Soon)</div>} />
                  <Route path="analytics" element={<div>Analytics Page (Coming Soon)</div>} />
                  <Route path="settings" element={<div>Settings Page (Coming Soon)</div>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </SportConfigProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}

export default App;

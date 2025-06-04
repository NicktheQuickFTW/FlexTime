import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import Schedule from './pages/Schedule';
import ScheduleDetail from './pages/ScheduleDetail';
import SportsPage from './pages/SportsPage';
import NotionIntegration from './pages/NotionIntegration';
import FootballProfiles from './pages/FootballProfiles';
import MensBasketballProfiles from './pages/MensBasketballProfiles';
import WomensBasketballProfiles from './pages/WomensBasketballProfiles';
import BaseballProfiles from './pages/BaseballProfiles';
import SoftballProfiles from './pages/SoftballProfiles';
import SoccerProfiles from './pages/SoccerProfiles';
import VolleyballProfiles from './pages/VolleyballProfiles';
import GymnasticsProfiles from './pages/GymnasticsProfiles';
import WrestlingProfiles from './pages/WrestlingProfiles';
import MensTennisProfiles from './pages/MensTennisProfiles';
import WomensTennisProfiles from './pages/WomensTennisProfiles';
import LacrosseProfiles from './pages/LacrosseProfiles';
import FTBuilderDemo from './pages/FTBuilderDemo';

function App() {
  return (
    <ThemeProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/schedule/:id" element={<ScheduleDetail />} />
          <Route path="/sports" element={<SportsPage />} />
          <Route path="/notion" element={<NotionIntegration />} />
          <Route path="/sports/football" element={<FootballProfiles />} />
          <Route path="/sports/mens-basketball" element={<MensBasketballProfiles />} />
          <Route path="/sports/womens-basketball" element={<WomensBasketballProfiles />} />
          <Route path="/sports/baseball" element={<BaseballProfiles />} />
          <Route path="/sports/softball" element={<SoftballProfiles />} />
          <Route path="/sports/soccer" element={<SoccerProfiles />} />
          <Route path="/sports/volleyball" element={<VolleyballProfiles />} />
          <Route path="/sports/gymnastics" element={<GymnasticsProfiles />} />
          <Route path="/sports/wrestling" element={<WrestlingProfiles />} />
          <Route path="/sports/mens-tennis" element={<MensTennisProfiles />} />
          <Route path="/sports/womens-tennis" element={<WomensTennisProfiles />} />
          <Route path="/sports/lacrosse" element={<LacrosseProfiles />} />
          <Route path="/builder" element={<FTBuilderDemo />} />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;
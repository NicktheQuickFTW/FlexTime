import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SportsPage } from './pages';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Main content area */}
        <main className="main-content">
          <Routes>
            <Route path="/sports" element={<SportsPage />} />
            <Route path="/sports/:sportId" element={<SportsPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

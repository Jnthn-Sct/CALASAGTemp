import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Components/Pages/Dashboard';
import Messages from './Components/Pages/Messages';
import Report from './Components/Pages/Report';
import Login from './Components/Pages/Login';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/report" element={<Report />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
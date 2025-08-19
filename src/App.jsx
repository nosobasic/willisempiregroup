import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home';
import RevenueRipplePage from './pages/RevenueRipple';
import AuditPage from './pages/Audit';
import CaseStudiesPage from './pages/CaseStudies';
import ResourcesPage from './pages/Resources';
import PrivacyPage from './pages/Privacy';
import TermsPage from './pages/Terms';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/revenue-ripple" element={<RevenueRipplePage />} />
      <Route path="/audit" element={<AuditPage />} />
      <Route path="/case-studies" element={<CaseStudiesPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
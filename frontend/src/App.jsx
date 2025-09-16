import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import RolesPage from "./components/RolesPage";
import AuthPortal from "./components/AuthPortal";
import SupervisorDashboard from "./components/Supervisor/SupervisorDashboard";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== "supervisor") return <Navigate to="/auth?role=supervisor" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/auth" element={<AuthPortal />} />
        <Route
          path="/dashboard/supervisor"
          element={
            <ProtectedRoute>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div style={{ padding: 16, fontWeight: 700 }}>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}
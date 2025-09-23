import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import RolesPage from "./components/RolesPage";
import Auth from "./components/Auth/Auth";
import SupervisorDashboard from "./components/Supervisor/SupervisorDashboard";
import StudentDashboard from "./components/Student/StudentDashboard.jsx";
import ToastContainer from "./components/ToastService/ToastContainer.jsx";

// Updated ProtectedRoute component
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== allowedRole) return <Navigate to={`/auth?role=${allowedRole}`} replace />;
  return children;
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard/supervisor"
            element={
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<div style={{ padding: 16, fontWeight: 700 }}>404 Not Found</div>} />
        </Routes>
      </Router>
    </>
  );
}
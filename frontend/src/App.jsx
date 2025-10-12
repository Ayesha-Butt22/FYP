import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Auth from "./components/Auth/Auth";
import SupervisorDashboard from "./components/Supervisor/SupervisorDashboard";
import CoordinatorDashboard from "./components/ProjectCoordinator/CoordinatorDashboard.jsx"
import StudentDashboard from "./components/Student/StudentDashboard.jsx";
import AdminDashboard from "./components/Admin/AdminDashboard"; 
import ToastContainer from "./components/ToastService/ToastContainer.jsx";
import getUserInfoFromStorage from "./components/Auth/UserInfo.jsx";
import ProtectedAuthRoute from "./components/Auth/ProtectedAuthRoute.jsx";
import ChangePassword from "./components/Auth/ChangePassword.jsx";
import {ConfirmService} from "./components/ConfirmService/ConfirmService.jsx";

function ProtectedRoute({ children, allowedRole }) {
  const user = getUserInfoFromStorage();
  const token = user.token;
  const role = user.role;
  const mustChangePass = user.mustChangePassword;
  if (!token || role !== allowedRole) return <Navigate to={`/auth`} replace />;
    console.log(mustChangePass);
  if (mustChangePass === 'true') return <Navigate to={`/user-changepassword`} replace />;
  return children;
}

function IsAllowed({children}){
    const user = getUserInfoFromStorage();
    const token = user.token;
    const email = user.email;
    if (!token || email === "") return <Navigate to={`/auth`} replace />;
    return children;
}

export default function App() {
  return (
    <>
      <ToastContainer />
        <ConfirmService />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
            <Route
               path="/user-changepassword"
               element={
                <IsAllowed>
                <ChangePassword />
                </IsAllowed>
                }
            />
          <Route path="/auth" element={
              <ProtectedAuthRoute>
                  <Auth />
              </ProtectedAuthRoute>
          } />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/supervisor"
            element={
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/coordinator"
            element={
              <ProtectedRoute allowedRole="coordinator">
                <CoordinatorDashboard/>
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
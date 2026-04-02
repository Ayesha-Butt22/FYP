import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../Api/authService";
import { toastService } from "../ToastService/ToastService.jsx";
import "../../styles/AuthPortal.css";

const STUDENT_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "studentId", label: "SAP ID", type: "text", required: true },
  { name: "department", label: "Department", type: "text", required: true },
  { name: "email", label: "University Email", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true },
];

const DEPARTMENT_OPTIONS = ["CS", "SE", "CA", "CyberSec"];

const useQuery = () => new URLSearchParams(useLocation().search);

export default function Auth() {
  const query = useQuery();
  const navigate = useNavigate();

  const [mode, setMode] = useState("register"); // initial UI state uses classes to show login/register panes
  const [registerData, setRegisterData] = useState({});
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // NEW: forgot-password UI state (stays on same page, doesn't call APIs)
  // forgotState: null | "askEmail" | "showResetFields"
  const [forgotState, setForgotState] = useState(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Only student registration allowed
  const selectedRole = "student";

  // Handle field changes
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      if (prev[fieldName]) {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleRegisterChange = useCallback((fieldName, value) => {
    setRegisterData(prev => ({ ...prev, [fieldName]: value }));
    clearFieldError(fieldName);
  }, [clearFieldError]);

  const handleLoginChange = useCallback((fieldName, value) => {
    setLoginData(prev => ({ ...prev, [fieldName]: value }));
    clearFieldError(fieldName);
  }, [clearFieldError]);

  // Dashboard route
  const getDashboardRoute = (role) => {
    const routes = {
      admin: "/dashboard/admin",
      coordinator: "/dashboard/coordinator",
      supervisor: "/dashboard/supervisor",
      student: "/dashboard/student"
    };
    return routes[role] || "/dashboard";
  };

  // Validate registration fields
  const validateRegister = (data) => {
    const errs = {};
    if (!data.name?.trim()) errs.name = "Name is required.";
    if (!/^\d{5}$/.test(data.studentId || "")) errs.studentId = "SAP ID must be 5 digits.";
    if (!data.department?.trim()) errs.department = "Department is required.";
    if (!/^[0-9]{5}@students\.riphah\.edu\.pk$/.test(data.email || "")) errs.email = "Email must be 5 digits (e.g. 48288@students.riphah.edu.pk)";
    if (!data.password || data.password.length < 8) errs.password = "Password must be at least 8 characters.";
    return errs;
  };

  // Validate login fields
  const validateLogin = (data) => {
    const errs = {};
    if (!data.email) errs.email = "Please enter your email.";
    if (!data.password) errs.password = "Please enter your password.";
    return errs;
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    // If forgot flow active, do not submit login
    if (forgotState) return;
    const validation = validateLogin(loginData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toastService.error("Please fix the errors and try again.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await authService.login(loginData);
      if (result.success) {
        toastService.success("Login successful! Welcome back.");
        const userData = authService.getUserData();
        const dashboardRoute = getDashboardRoute(userData.role);
        setTimeout(() => { navigate(dashboardRoute); }, 1000);
      } else {
        const errorMessage = result.data?.error || result.error || "Login failed";
        toastService.error(errorMessage);
      }
    } catch (error) {
      toastService.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();
    const validation = validateRegister(registerData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toastService.error("Please fix the errors and try again.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...registerData,
        role: "student"
      };
      const result = await authService.register(payload);
      if (result.success) {
        toastService.success("Registration successful! Please login with your credentials.");
        setRegisterData({});
        setMode("login");
        setTimeout(() => {
          navigate("/auth");
        }, 1500);
      } else {
        const errorMessage = result.data?.error || result.error || "Registration failed";
        if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("exists")) {
          toastService.error("An account with this email already exists. Please login instead.");
        } else if (errorMessage.toLowerCase().includes("student id") && errorMessage.toLowerCase().includes("exists")) {
          toastService.error("This Student ID is already registered. Please use a different ID.");
        } else {
          toastService.error(errorMessage);
        }
      }
    } catch (error) {
      toastService.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Student registration fields (department rendered as a dropdown)
  const renderStudentFields = () => (
    <>
      {STUDENT_FIELDS.map(field => (
        <div className="input-box" key={field.name} style={{ position: "relative" }}>
          {field.name === "department" ? (
            <>
              <select
                name="department"
                aria-label="Department"
                required={field.required}
                value={registerData.department || ""}
                onChange={e => handleRegisterChange("department", e.target.value)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--input-border)",
                  background: "var(--input-bg)",
                  fontSize: "1.14rem",
                  fontWeight: 500,
                }}
              >
                <option value="">Select Department</option>
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.department && <div className="error-msg">{errors.department}</div>}
            </>
          ) : (
            <>
              <input
                type={field.type}
                name={field.name}
                placeholder={field.label}
                required={field.required}
                value={registerData[field.name] || ""}
                onChange={e => handleRegisterChange(field.name, e.target.value)}
                disabled={isLoading}
                style={{ paddingRight: field.type === "password" ? "16px" : "16px" }}
              />
              {errors[field.name] && (
                <div className="error-msg">{errors[field.name]}</div>
              )}
            </>
          )}
        </div>
      ))}
    </>
  );

  // ---- Forgot password flow (local UI only) ----
  const openForgot = () => {
    // show the "Enter your email address" step
    setForgotState("askEmail");
    // ensure login pane visible
    setMode("login");
    // clear previous values
    setForgotEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({});
  };

  const cancelForgot = () => {
    setForgotState(null);
    setForgotEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({});
  };
// Replace handleForgotEmailSubmit with this:
const handleForgotEmailSubmit = async (e) => {
  e.preventDefault();
  if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
    setErrors({ forgotEmail: "Enter a valid email address." });
    toastService.error("Enter a valid email address.");
    return;
  }
  setIsLoading(true);
  
  try {
    const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const data = await res.json();
    if (data.resetUrl) {
      toastService.success("Reset link generated! Opening reset page…");
      cancelForgot();
      // Open the reset URL — same tab (since it's local demo)
      window.location.href = data.resetUrl;
    } else {
      toastService.info("If that email exists, a reset link was generated.");
      cancelForgot();
    }
  } catch {
    toastService.error("Network error. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    // validate new password entries locally
    const errs = {};
    if (!newPassword || newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters.";
    if (newPassword !== confirmNewPassword) errs.confirmNewPassword = "Passwords do not match.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toastService.error("Please fix the errors before submitting.");
      return;
    }
    // Do NOT call any API (user request). Just show confirmation and reset UI.
    toastService.success("Password fields accepted. (No API call made — demo only.)");
    // Reset forgot flow and keep user on login pane
    setForgotState(null);
    setForgotEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  return (
    <>
      <div className={`auth-container${mode === "register" ? " active" : ""}`}>
        <div className="form-box login">
          {/* If forgotState active, we still show login pane but render forgot UI above the login form */}
          {forgotState === "askEmail" ? (
            <form onSubmit={handleForgotEmailSubmit} noValidate>
              <h1>Forgot Password</h1>
              <div className="input-box">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); clearFieldError("forgotEmail"); }}
                  disabled={isLoading}
                />
              </div>
              {errors.forgotEmail && <div className="error-msg">{errors.forgotEmail}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn main-btn" disabled={isLoading}>Continue</button>
                <button
  type="button"
  className="btn"
  onClick={cancelForgot}
  disabled={isLoading}
  style={{
    background: "#2563eb",
    color: "#fff",
    border: "none"
  }}
>
  Cancel
</button>
              </div>
            </form>
          ) : forgotState === "showResetFields" ? (
            <form onSubmit={handleResetPasswordSubmit} noValidate>
              <h1>Reset Password</h1>
              <div className="input-box">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); clearFieldError("newPassword"); }}
                  disabled={isLoading}
                />
                {errors.newPassword && <div className="error-msg">{errors.newPassword}</div>}
              </div>
              <div className="input-box">
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => { setConfirmNewPassword(e.target.value); clearFieldError("confirmNewPassword"); }}
                  disabled={isLoading}
                />
                {errors.confirmNewPassword && <div className="error-msg">{errors.confirmNewPassword}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn main-btn" disabled={isLoading}>Reset Password</button>
                <button type="button" className="btn alt-btn" onClick={cancelForgot} disabled={isLoading}>Cancel</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} noValidate>
              <h1>Sign in to Portal</h1>
              <div className="input-box">
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={loginData.email}
                  onChange={e => handleLoginChange("email", e.target.value)}
                  disabled={isLoading}
                />
                <span className="input-icon" role="img" aria-label="mail">📧</span>
              </div>
              {errors.email && <div className="error-msg">{errors.email}</div>}

              <div className="input-box">
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={loginData.password}
                  onChange={e => handleLoginChange("password", e.target.value)}
                  disabled={isLoading}
                />
                <span className="input-icon" role="img" aria-label="lock">🔒</span>
              </div>
              {errors.password && <div className="error-msg">{errors.password}</div>}

              <button
                type="submit"
                className="btn main-btn"
                disabled={isLoading}
              >
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
              </button>

              {/* NEW: Forgot password link - opens local forgot flow on same page */}
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button
                  type="button"
                  className="btn link-btn"
                  onClick={openForgot}
                  disabled={isLoading}
                  style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer", padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="form-box register">
          <div className="register-content">
            <form onSubmit={handleRegister} noValidate>
              <h1>Student Registration</h1>
              <div style={{
                background: "#e0e7ff",
                color: "#01337a",
                borderRadius: "8px",
                padding: "12px 18px",
                marginBottom: "18px",
                fontWeight: 700,
                fontSize: "1.13rem",
                textAlign: "center",
                border: "1.5px solid #2563eb77",
                letterSpacing: ".3px"
              }}>
                This registration is <b>only available for students</b>.
              </div>
              {renderStudentFields()}
              <button
                type="submit"
                className="btn main-btn"
                disabled={isLoading}
              >
                {isLoading ? "REGISTERING..." : "REGISTER"}
              </button>
            </form>
          </div>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button
              className="btn alt-btn"
              onClick={() => setMode("register")}
              disabled={isLoading}
            >
              Register
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button
              className="btn alt-btn"
              onClick={() => { setMode("login"); setForgotState(null); }}
              disabled={isLoading}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
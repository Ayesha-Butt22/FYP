import React, { useState, useCallback } from "react";
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

  const [mode, setMode] = useState("register");
  const [registerData, setRegisterData] = useState({});
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <>
      <div className={`auth-container${mode === "register" ? " active" : ""}`}>
        <div className="form-box login">
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
          </form>
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
              onClick={() => setMode("login")}
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
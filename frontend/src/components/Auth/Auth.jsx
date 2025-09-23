//components/Auth/Auth.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ROLE_FIELDS,
    REGISTER_INFO,
    validateAllRegisterFields,
    validateAllLoginFields
} from "./validation.jsx";
import { authService } from "../Api/authService";
import { toastService } from "../ToastService/ToastService.jsx";
import "../../styles/AuthPortal.css";

const useQuery = () => new URLSearchParams(useLocation().search);

export default function Auth() {
    const query = useQuery();
    const navigate = useNavigate();
    const selectedRole = query.get("role");


    const [mode, setMode] = useState(selectedRole ? "register" : "login");
    const [registerData, setRegisterData] = useState({});
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);


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

        if (fieldName === "password") {
            clearFieldError("confirmPassword");
        }

        if (fieldName === "email" && selectedRole === "student") {
            clearFieldError("studentId");
        }
    }, [selectedRole, clearFieldError]);


    const handleLoginChange = useCallback((fieldName, value) => {
        setLoginData(prev => ({ ...prev, [fieldName]: value }));
        clearFieldError(fieldName);
    }, [clearFieldError]);


    useEffect(() => {
        if (selectedRole) setMode("register");
    }, [selectedRole]);


    const getDashboardRoute = (role) => {
        const routes = {
            admin: "/dashboard/admin",
            coordinator: "/dashboard/coordinator",
            supervisor: "/dashboard/supervisor",
            student: "/dashboard/student"
        };
        return routes[role] || "/dashboard";
    };


    const handleLogin = async (e) => {
        e.preventDefault();


        const validation = validateAllLoginFields(loginData, selectedRole);
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


                setTimeout(() => {
                    navigate(dashboardRoute);
                }, 1000);
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


    const handleRegister = async (e) => {
        e.preventDefault();

        const validation = validateAllRegisterFields(registerData, selectedRole);
        setErrors(validation);

        if (Object.keys(validation).length > 0) {
            toastService.error("Please fix the errors and try again.");
            return;
        }

        setIsLoading(true);

        try {
            const payload = authService.buildRegisterPayload(registerData, selectedRole);
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


    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setErrors({});

        if (newMode === "login") {
            setRegisterData({});
        } else {
            setLoginData({ email: "", password: "" });
        }
    };


    const renderFormFields = () => {
        if (!selectedRole || !ROLE_FIELDS[selectedRole]) {
            return (
                <>
                    <div className="input-box">
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            value={registerData.username || ""}
                            onChange={(e) => handleRegisterChange("username", e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={registerData.email || ""}
                            onChange={(e) => handleRegisterChange("email", e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type={showPwd ? "text" : "password"}
                            placeholder="Password"
                            required
                            value={registerData.password || ""}
                            onChange={(e) => handleRegisterChange("password", e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="show-btn"
                            tabIndex={-1}
                            onClick={() => setShowPwd(prev => !prev)}
                            disabled={isLoading}
                        >
                            {showPwd ? "Hide" : "Show"}
                        </button>
                    </div>
                </>
            );
        }

        return ROLE_FIELDS[selectedRole].map(field => (
            <div className="input-box" key={field.name}>
                <input
                    type={
                        field.type === "password"
                            ? field.name === "password"
                                ? showPwd ? "text" : "password"
                                : showConfirmPwd ? "text" : "password"
                            : field.type
                    }
                    name={field.name}
                    placeholder={field.label}
                    required={field.required}
                    value={registerData[field.name] || ""}
                    onChange={(e) => handleRegisterChange(field.name, e.target.value)}
                    disabled={isLoading}
                />
                {field.type === "password" && (
                    <button
                        type="button"
                        className="show-btn"
                        tabIndex={-1}
                        onClick={() =>
                            field.name === "password"
                                ? setShowPwd(prev => !prev)
                                : setShowConfirmPwd(prev => !prev)
                        }
                        disabled={isLoading}
                    >
                        {(field.name === "password" ? showPwd : showConfirmPwd) ? "Hide" : "Show"}
                    </button>
                )}
                {errors[field.name] && (
                    <div className="error-msg">{errors[field.name]}</div>
                )}
            </div>
        ));
    };

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
                                onChange={(e) => handleLoginChange("email", e.target.value)}
                                disabled={isLoading}
                            />
                            <span className="input-icon" role="img" aria-label="mail">📧</span>
                        </div>
                        {errors.email && <div className="error-msg">{errors.email}</div>}

                        <div className="input-box">
                            <input
                                type={showPwd ? "text" : "password"}
                                placeholder="Password"
                                required
                                value={loginData.password}
                                onChange={(e) => handleLoginChange("password", e.target.value)}
                                disabled={isLoading}
                            />
                            <span className="input-icon" role="img" aria-label="lock">🔒</span>
                            <button
                                type="button"
                                className="show-btn"
                                tabIndex={-1}
                                aria-label={showPwd ? "Hide password" : "Show password"}
                                onClick={() => setShowPwd(prev => !prev)}
                                disabled={isLoading}
                            >
                                {showPwd ? "Hide" : "Show"}
                            </button>
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
                            <h1>
                                Register
                                {selectedRole && (
                                    <>
                                        {" "}as{" "}
                                        <span style={{ color: "#01337a" }}>
                                            {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                                        </span>
                                    </>
                                )}
                            </h1>
                            {selectedRole && REGISTER_INFO[selectedRole]}
                            {renderFormFields()}
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
                            onClick={() => handleModeSwitch("register")}
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
                            onClick={() => handleModeSwitch("login")}
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
//ResetPassword
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toastService } from "../ToastService/ToastService.jsx";
import "../../styles/AuthPortal.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  // Countdown: token valid for 5 minutes
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);

  useEffect(() => {
    if (!token || !email) {
      toastService.error("Invalid reset link.");
      navigate("/auth");
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setExpired(true);
          toastService.error("Reset link has expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [token, email, navigate]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newPassword || newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters.";
    if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toastService.error("Please fix the errors before submitting.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toastService.success("Password reset successfully! Please log in.");
        setTimeout(() => navigate("/auth"), 1500);
      } else {
        toastService.error(data.error || "Reset failed. The link may have expired.");
        if (data.error?.toLowerCase().includes("expired")) setExpired(true);
      }
    } catch {
      toastService.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-box login">
        {expired ? (
          <div style={{ width: "100%" }}>
            <h1 style={{ color: "#dc2626" }}>Link Expired</h1>

            <div
              style={{
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderRadius: "10px",
                padding: "14px",
                marginTop: "10px",
                marginBottom: "20px",
                color: "#7f1d1d",
                fontWeight: "500",
              }}
            >
              This reset link has expired. Please request a new one.
            </div>

            <button
              className="btn main-btn"
              onClick={() => navigate("/auth")}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form className="reset-form-login" onSubmit={handleSubmit} noValidate>
            <h1>Reset Password</h1>

            {/* Email Info Box */}
            <div
              style={{
                background: "#e0e7ff",
                border: "1.5px solid #2563eb55",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "15px",
                fontSize: "0.95rem",
                color: "#1e3a8a",
                fontWeight: "500",
              }}
            >
              Resetting for: <b>{decodeURIComponent(email || "")}</b>
            </div>

            {/* Countdown Box */}
            <div
              style={{
                display: "block",
                textAlign: "center",
                background: secondsLeft < 60 ? "#fef2f2" : "#eff6ff",
                color: secondsLeft < 60 ? "#dc2626" : "#2563eb",
                borderRadius: "8px",
                padding: "8px 12px",
                fontWeight: "700",
                fontSize: "0.95rem",
                marginBottom: "18px",
                border: `1.5px solid ${secondsLeft < 60 ? "#fecaca" : "#bfdbfe"
                  }`,
              }}
            >
              ⏱ Link expires in {formatTime(secondsLeft)}
            </div>

            {/* New Password */}
            <div className="input-box">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((p) => ({ ...p, newPassword: undefined }));
                }}
                disabled={isLoading}
              />
              <span className="input-icon">🔒</span>
            </div>
            {errors.newPassword && (
              <div className="error-msg">{errors.newPassword}</div>
            )}

            {/* Confirm Password */}
            <div className="input-box">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((p) => ({
                    ...p,
                    confirmPassword: undefined,
                  }));
                }}
                disabled={isLoading}
              />
              <span className="input-icon">🔒</span>
            </div>
            {errors.confirmPassword && (
              <div className="error-msg">{errors.confirmPassword}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn main-btn"
              disabled={isLoading}
               style={{
    width: "65%",
    marginRight: "auto",
    marginTop: "12px",
    display: "block"
  }}
            >
              {isLoading ? "RESETTING..." : "RESET PASSWORD"}
            </button>

            {/* Back Link */}
            <div style={{ marginTop: "14px", textAlign: "center" }}>
              <button
                type="button"
                className="btn link-btn"
                onClick={() => navigate("/auth")}
                style={{
    width: "100%",
    marginRight: "auto",
    marginTop: "12px",
    display: "block",
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    borderRadius: "10px",
    padding: "14px 22px",
    fontSize: "1.05rem",
    boxSizing: "border-box"
  }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* OPTIONAL RIGHT PANEL (same feel as login/register) */}
      <div className="toggle-box">
        <div className="toggle-panel toggle-left">
          <h1>Password Reset</h1>
          <p style={{ fontSize: "0.85rem", color: "white", margin: "6px 0 12px 0", lineHeight: 1.4 }}>
            Enter a new secure password to regain access to your account.
          </p>
        </div>
      </div>
    </div>
  )
};
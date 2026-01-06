import React, { useState, useRef, useEffect } from "react";
import { Camera, Mail, BookOpen, Calendar, Eye, EyeOff, User as UserIcon } from "lucide-react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { authService } from "../Api/AuthService"; // <-- authService import
import "./StudentProfile.css";

export default function StudentProfile() {
  const timeoutRef = useRef(null);

  const [student, setStudent] = useState({
    name: "Eman",
    role: "Student",
    sapId: "46188",
    email: "46188@students.riphah.edu.pk",
    department: "Computer Science",
    fypYear: "2024-2025",
    supervisor: "Dr. Faraz Khan",
    avatar:
      "https://ui-avatars.com/api/?name=Ayesha&size=200&background=01337a&color=fff&bold=true&font-size=0.4"
  });

  const [passwords, setPasswords] = useState({
    changePassword: "",
    confirmPassword: ""
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleUpdateProfile = async () => {
    const { changePassword, confirmPassword } = passwords;

    // Client-side validation
    if (!changePassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required!" });
      return;
    }
    if (changePassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long!" });
      return;
    }
    if (changePassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      return;
    }

    try {
      // Call authService API for password change
      const result = await authService.makeAPICall("change-password-email", {
        email: student.email,
        newPassword: changePassword,
        confirmPassword
      });

      if (result.success) {
        setMessage({ type: "success", text: "✓ Password updated successfully!" });
        setPasswords({ changePassword: "", confirmPassword: "" });
      } else {
        setMessage({
          type: "error",
          text: result.data?.error || result.error || "Failed to update password"
        });
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <>
      <DashboardSectionHeader description="Students can view their own profile.">
        Student Profile
      </DashboardSectionHeader>

      <div className="student-profile-root min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="decorative-top">
              <div className="overlay" aria-hidden="true" />
              <svg viewBox="0 0 1440 120" className="wave" aria-hidden="true">
                <path
                  fill="#ffffff"
                  d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
                />
              </svg>
            </div>

            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img src={student.avatar} alt={student.name} className="avatar" />
                <button className="avatar-camera-btn" aria-label="Change avatar" title="Change avatar">
                  <Camera className="icon" />
                </button>
              </div>
            </div>

            <div className="text-center heading-area">
              <h1 className="student-name">{student.name}</h1>

              <div className="role-sap-wrap">
                <div className="role-badge">
                  <UserIcon className="role-icon" />
                  <span>{student.role}</span>
                </div>
                <div className="sap-badge">SAP ID: {student.sapId}</div>
              </div>
            </div>

            <div className="content px-8">
              <div className="section-header">
                <label>Personal Information</label>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon bg-blue">
                    <Mail className="icon-white" />
                  </div>
                  <div className="info-label">Email</div>
                  <div className="info-value break-all">{student.email}</div>
                </div>

                <div className="info-card">
                  <div className="info-icon bg-green">
                    <Calendar className="icon-white" />
                  </div>
                  <div className="info-label">FYP Year</div>
                  <div className="info-value">{student.fypYear}</div>
                </div>

                <div className="info-card">
                  <div className="info-icon bg-purple">
                    <BookOpen className="icon-white" />
                  </div>
                  <div className="info-label">Supervised By</div>
                  <div className="info-value">{student.supervisor}</div>
                </div>
              </div>

              <div className="divider" />

              {/* Password Update Section */}
              <div className="password-area">
                <div className="password-header">
                  <label>Change Password</label>
                </div>

                {message.text && (
                  <div className={`message ${message.type === "success" ? "success" : "error"}`}>
                    {message.text}
                  </div>
                )}

                <div className="password-grid">
                  <div className="password-field">
                    <label htmlFor="changePassword">New Password</label>
                    <div className="password-input">
                      <input
                        id="changePassword"
                        name="changePassword"
                        type={showChangePassword ? "text" : "password"}
                        value={passwords.changePassword}
                        onChange={handlePasswordChange}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowChangePassword((s) => !s)}
                        aria-label={showChangePassword ? "Hide new password" : "Show new password"}
                      >
                        {showChangePassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <div className="password-field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="password-input">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter password again"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="actions-row">
                  <button className="update-btn" onClick={handleUpdateProfile}>
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

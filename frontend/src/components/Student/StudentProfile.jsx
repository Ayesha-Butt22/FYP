//StudentProfile.jsx
import React, { useState, useEffect, useRef } from "react";
import { Camera, Mail, BookOpen, Calendar, Eye, EyeOff, User as UserIcon } from "lucide-react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { authService } from "../Api/AuthService";
import "./StudentProfile.css";

export default function StudentProfile() {
  const timeoutRef = useRef(null);

  const [student, setStudent] = useState({
    name: "",
    role: "",
    sapId: "",
    email: "",
    department: "",
    fypYear: "2024-2025",
    supervisor: "",
    avatar: "https://ui-avatars.com/api/?name=Student&size=200&background=01337a&color=fff&bold=true&font-size=0.4"
  });

  const [passwords, setPasswords] = useState({ changePassword: "", confirmPassword: "" });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleUpdateProfile = async () => {
    const { changePassword, confirmPassword } = passwords;
    if (!changePassword || !confirmPassword) return setMessage({ type: "error", text: "All fields are required!" });
    if (changePassword.length < 8) return setMessage({ type: "error", text: "Password must be at least 8 characters long!" });
    if (changePassword !== confirmPassword) return setMessage({ type: "error", text: "Passwords do not match!" });

    const result = await authService.changePasswordByEmail({
      email: student.email,
      newPassword: changePassword,
      confirmPassword
    });

    if (result.success) {
      setMessage({ type: "success", text: "✓ Password updated successfully!" });
      setPasswords({ changePassword: "", confirmPassword: "" });
    } else {
      setMessage({ type: "error", text: result.data?.error || result.error || "Failed to update password" });
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const fetchProfile = async () => {
      const res = await authService.getUserByEmail(email);
      if (res.success) {
        const u = res.data.user;
        setStudent(prev => ({
          ...prev,
          name: u.name,
          email: u.email,
          sapId: u.studentId,
          department: u.department || "N/A",
          role: u.role,
          specialization: u.specialization || "",
          isGroupMade: u.isGroupMade || false,
          IsApproved: u.IsApproved || false
        }));
      }
    };

    fetchProfile();
  }, []);

  return (
    <>
      <DashboardSectionHeader description="Students can view their own profile.">Student Profile</DashboardSectionHeader>
      <div className="student-profile-root min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            {/* Avatar */}
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img src={student.avatar} alt={student.name} className="avatar" />
                <button className="avatar-camera-btn"><Camera /></button>
              </div>
            </div>

            {/* Name + Role + SAP */}
            <div className="text-center heading-area">
              <h1 className="student-name">{student.name}</h1>
              <div className="role-sap-wrap">
                <div className="role-badge"><UserIcon /> {student.role}</div>
                <div className="sap-badge">SAP ID: {student.sapId}</div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="content px-8">
              <div className="section-header"><label>Personal Information</label></div>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon bg-blue"><Mail /></div>
                  <div className="info-label">Email</div>
                  <div className="info-value">{student.email}</div>
                </div>
                <div className="info-card">
                  <div className="info-icon bg-green"><Calendar /></div>
                  <div className="info-label">FYP Year</div>
                  <div className="info-value">{student.fypYear}</div>
                </div>
                <div className="info-card">
                  <div className="info-icon bg-purple"><BookOpen /></div>
                  <div className="info-label">Supervisor</div>
                  <div className="info-value">{student.supervisor}</div>
                </div>
              </div>

              <div className="divider" />

              {/* Password Section */}
              <div className="password-area">
                <div className="password-header"><label>Change Password</label></div>
                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
                <div className="password-grid">
                  <div className="password-field">
                    <label>New Password</label>
                    <div className="password-input">
                      <input type={showChangePassword ? "text" : "password"} name="changePassword"
                             value={passwords.changePassword} onChange={handlePasswordChange} placeholder="At least 8 characters" />
                      <button type="button" onClick={() => setShowChangePassword(s => !s)}>
                        {showChangePassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <div className="password-field">
                    <label>Confirm Password</label>
                    <div className="password-input">
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                             value={passwords.confirmPassword} onChange={handlePasswordChange} placeholder="Enter password again" />
                      <button type="button" onClick={() => setShowConfirmPassword(s => !s)}>
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="actions-row">
                  <button className="update-btn" onClick={handleUpdateProfile}>Update Password</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
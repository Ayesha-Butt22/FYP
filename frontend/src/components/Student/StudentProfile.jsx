// StudentProfile.jsx
import React, { useState, useEffect, useRef } from "react";
import { Camera, Mail, BookOpen, User as UserIcon, Eye, EyeOff } from "lucide-react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { authService } from "../Api/AuthService";
import "./StudentProfile.css";
import {FaUserTie} from "react-icons/fa";

export default function StudentProfile() {
  const timeoutRef = useRef(null);

  const [student, setStudent] = useState({
    name: "",
    role: "",
    sapId: "",
    email: "",
    department: "",
    fypYear: "2024-2025",
    avatar: "https://ui-avatars.com/api/?name=Student&size=200&background=01337a&color=fff&bold=true&font-size=0.4",
  });

  const [passwords, setPasswords] = useState({ changePassword: "", confirmPassword: "" });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePic , setProfilePic ] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });


  useEffect(() => {
      return () => clearTimeout(timeoutRef.current);
  }, []);

    useEffect(() => {
        const url = localStorage.getItem('imageurl');
        if (!url || url === "null") return;
        setProfilePic(url);

    }, []);

  // Handle password inputs
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  // Update password API call
  const handleUpdatePassword = async () => {
    const { changePassword, confirmPassword } = passwords;

    if (!changePassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required!" });
      return;
    }

    if (changePassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters!" });
      return;
    }

    if (changePassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      return;
    }

    try {
      const result = await authService.makeAPICall("change-password-email", {
        email: student.email,
        newPassword: changePassword,
        confirmPassword,
      });

      if (result.success) {
        setMessage({ type: "success", text: "✓ Password updated successfully!" });
        setPasswords({ changePassword: "", confirmPassword: "" });
      } else {
        setMessage({ type: "error", text: result.data?.error || result.error || "Failed to update password" });
      }

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Fetch student profile from API
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const fetchProfile = async () => {
      try {
        const res = await authService.getUserByEmail(email);
        if (res.success && res.data?.user) {
          const u = res.data.user;
          setStudent({
            name: u.name,
            email: u.email,
            sapId: u.studentId || "N/A",
            role: u.role || "Student",
            department: u.department || "N/A",
            fypYear: u.fypYear || "2024-2025",
            avatar:
              u.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=200&background=01337a&color=fff&bold=true&font-size=0.4`,
          });
        } else {
          console.error("Profile fetch failed:", res.data?.error || res.error);
        }
      } catch (err) {
        console.error("Error fetching profile:", err.message);
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
                  {profilePic ? (
                      <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                  ) : (
                      <img src={student.avatar} alt={student.name} className="avatar" />
                  )}
              </div>
            </div>

            {/* Name + Role + SAP */}
            <div className="text-center heading-area">
              <h1 className="student-name">{student.name}</h1>
             
              
            </div>

            {/* Info Grid */}
            <div className="content px-8">
              <div className="section-header">
                <label>Personal Information</label>
              </div>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon bg-white">
                    <Mail />
                  </div>
                  <div className="info-label">Email</div>
                  <div className="info-value">{student.email}</div>
                </div>
                <div className="info-card">
                  <div className="info-icon bg-white">
                    <BookOpen />
                  </div>
                  <div className="info-label">SAP ID</div>
                  <div className="info-value">{student.sapId}</div>
                </div>
                <div className="info-card">
                  <div className="info-icon bg-white">
                    <UserIcon />
                  </div>
                  <div className="info-label">Role</div>
                  <div className="info-value">{student.role}</div>
                </div>
              </div>

              <div className="divider" />

              {/* Password Section */}
              <div className="password-area">
                <div className="password-header">
                  <label>Change Password</label>
                </div>
                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
                <div className="password-grid">
                  <div className="password-field">
                    <label>New Password</label>
                    <div className="password-input">
                      <input
                        type={showChangePassword ? "text" : "password"}
                        name="changePassword"
                        value={passwords.changePassword}
                        onChange={handlePasswordChange}
                        placeholder="At least 8 characters"
                      />
                      <button type="button" onClick={() => setShowChangePassword((s) => !s)}>
                        {showChangePassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <div className="password-field">
                    <label>Confirm Password</label>
                    <div className="password-input">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter password again"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword((s) => !s)}>
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="actions-row">
                  <button className="update-btn" onClick={handleUpdatePassword}>
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

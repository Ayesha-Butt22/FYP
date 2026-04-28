// ProjectCoordinator/Profile.jsx
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Eye, EyeOff, Camera } from 'lucide-react';
import DashboardSectionHeader from './DashboardSectionHeader';
import { authService } from '../Api/AuthService';
import './Profile.css';
import {FaUserTie} from "react-icons/fa";
import { formatRoleLabel } from "../../utils/roleLabel.js";

export default function Profile() {
  const timeoutRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "",
    role: "Project Coordinator",
    department: "",
    email: "",
    avatar: "https://ui-avatars.com/api/?name=Project+Coordinator&size=200&background=0891b2&color=fff&bold=true&font-size=0.4"
  });
  const [profilePic , setProfilePic] = useState(null)

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });


  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

    useEffect(() => {
        const url = localStorage.getItem('imageurl');
        if (!url) return;
        setProfilePic(url);
    }, []);


  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const fetchProfile = async () => {
      try {
        const res = await authService.getUserByEmail(email);
        if (res.success && res.data?.user) {
          const u = res.data.user;
          setProfile({
            name: u.name,
            role: formatRoleLabel({
              role: u.role || "Project Coordinator",
              department: u.department || "",
              isProjectHead: !!u.isProjectHead,
            }),
            department: u.department || "N/A",
            email: u.email,
            avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=200&background=0891b2&color=fff&bold=true&font-size=0.4`
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ type: '', text: '' });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleUpdatePassword = async () => {
    const { newPassword, confirmPassword } = passwords;

    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required!' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    try {
      const result = await authService.makeAPICall('change-password-email', {
        email: profile.email,
        newPassword,
        confirmPassword
      });

      if (result.success) {
        setMessage({ type: 'success', text: '✓ Password updated successfully!' });
        setPasswords({ newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.data?.error || result.error || 'Failed to update password' });
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      <DashboardSectionHeader description="Project Coordinator can view their own Profile.">
        Profile
      </DashboardSectionHeader>

      <div className="admin-profile-container">
        <div className="admin-profile-card" role="region" aria-label="Project Coordinator profile">
          <div className="profile-avatar-section-sup">
            <div className="avatar-wrapper">
                {profilePic ? (
                    <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                ) : (
                    <img src={profile.avatar} alt={profile.name} className="avatar" />
                )}
            </div>
          </div>

          {/* Name & Role */}
          <div className="profile-name-role">
            <h1>{profile.name}</h1>
       
          </div>

          {/* Personal Info */}
          <div className="personal-info-section">
            <label>Personal Information</label>
            <div className="personal-info-grid">
              <div className="info-card email-card"><Mail className="icon" /> {profile.email}</div>
              <div className="info-card department-card"><User className="icon" /> {profile.department}</div>
              <div className="info-card role-card"><User className="icon" /> {profile.role}</div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Password Update */}
          <div className="password-update-section">
            <label>Update Password</label>
            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <div className="password-grid">
              <div className="password-field">
                <label>New Password</label>
                <div className="password-input">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="At least 8 characters"
                  />
                  <button onClick={() => setShowNewPassword(s => !s)}>
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="password-field">
                <label>Confirm Password</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter password again"
                  />
                  <button onClick={() => setShowConfirmPassword(s => !s)}>
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>

            <button className="update-btn" onClick={handleUpdatePassword}>Update Password</button>
          </div>
        </div>
      </div>
    </>
  );
}

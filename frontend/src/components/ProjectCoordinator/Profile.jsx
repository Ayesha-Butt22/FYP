import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Eye, EyeOff, Camera } from 'lucide-react';
import './Profile.css';
import DashboardSectionHeader from "./DashboardSectionHeader"

export default function Profile() {
  const [adminData] = useState({
    name: 'Aleeha',
    role: 'Project Coordinator',
    department: 'Computer Science (CS)',
    email: 'aleeha@riphah.edu.pk',
    gender: 'Female',
    contact: '+92 300 1234567',
    avatar:
      'https://ui-avatars.com/api/?name=Muhammad+Ahmed&size=200&background=0891b2&color=fff&bold=true&font-size=0.4'
  });

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ type: '', text: '' });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const handleUpdatePassword = () => {
    const { newPassword, confirmPassword } = passwords;

    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required!' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    setMessage({ type: 'success', text: '✓ Password updated successfully!' });
    setPasswords({ newPassword: '', confirmPassword: '' });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setMessage({ type: '', text: '' });
      timeoutRef.current = null;
    }, 4000);
  };

  return (
    <>
    <DashboardSectionHeader description={"Project Coordinator can view their own  Profile."}>
        Profile
      </DashboardSectionHeader>
  
    <div className="admin-profile-container">
      <div className="admin-profile-card" role="region" aria-label="Profile">
        {/* Top Decorative Section */}
        <div className="profile-decorative-bg">
          <div className="overlay" aria-hidden="true"></div>
          <svg viewBox="0 0 1440 120" className="wave" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>

        {/* Profile Picture */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <img src={adminData.avatar} alt={adminData.name} className="avatar" />
            <button
              type="button"
              className="avatar-camera-btn"
              aria-label="Change avatar"
              title="Change avatar"
            >
              <Camera className="icon" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Name, Role & Department */}
        <div className="profile-name-role">
          <h1>{adminData.name}</h1>

          <div className="role-and-dept">
            <div className="role-badge">
              <User className="icon" aria-hidden="true" />
              <span>{adminData.role}</span>
            </div>

            <div className="department-badge" aria-label={`Department ${adminData.department}`}>
              {adminData.department}
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="personal-info-section">
          <div>
            <label>Personal Information</label>
          </div>

          <div className="personal-info-grid">
            <div className="info-card email-card">
              <Mail className="icon" aria-hidden="true" />
              <span>{adminData.email}</span>
            </div>
            <div className="info-card gender-card">
              <User className="icon" aria-hidden="true" />
              <span>{adminData.gender}</span>
            </div>
            <div className="info-card contact-card">
              <Phone className="icon" aria-hidden="true" />
              <span>{adminData.contact}</span>
            </div>
          </div>
        </div>

   
        <div className="divider" aria-hidden="true"></div>

        {/* Password Update */}
        <div className="password-update-section">
          <div className="password-header">
            <label>Update Password</label>
          </div>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          <div className="password-grid">
            <div className="password-field">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  aria-label="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((s) => !s)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  title={showNewPassword ? 'Hide' : 'Show'}
                >
                  {showNewPassword ? <EyeOff className="icon" aria-hidden="true" /> : <Eye className="icon" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="password-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  title={showConfirmPassword ? 'Hide' : 'Show'}
                >
                  {showConfirmPassword ? <EyeOff className="icon" aria-hidden="true" /> : <Eye className="icon" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>

          <button type="button" className="update-btn" onClick={handleUpdatePassword}>
            Update Password
          </button>
        </div>
      </div>
    </div>
      </>
  );
}
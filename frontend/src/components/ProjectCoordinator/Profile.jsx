import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Camera, User, Mail, Phone } from 'lucide-react';
import { authService } from '../Api/AuthService'; // Ensure the path is correct
import './Profile.css';
import DashboardSectionHeader from "./DashboardSectionHeader";

export default function Profile() {
  const [adminData] = useState({
    name: 'Sobia',
    role: 'Project Coordinator',
    department: 'Computer Science (CS)',
    email: 'Sobia@riphah.edu.pk',
    gender: 'Female',
    contact: '+92 300 1234567',
    avatar: 'https://ui-avatars.com/api/?name=Muhammad+Ahmed&size=200&background=0891b2&color=fff&bold=true&font-size=0.4'
  });

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const timeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Handle input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ type: '', text: '' });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    const { newPassword, confirmPassword } = passwords;

    // Basic validations
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
        email: adminData.email,
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
        <div className="admin-profile-card" role="region" aria-label="Profile">
          
          {/* Profile Avatar */}
          <div className="profile-avatar-section-sup">
            <div className="avatar-wrapper">
              <img src={adminData.avatar} alt={adminData.name} className="avatar" />
              <button type="button" className="avatar-camera-btn" aria-label="Change avatar">
                <Camera className="icon" />
              </button>
            </div>
          </div>

          {/* Name & Role */}
          <div className="profile-name-role">
            <h1>{adminData.name}</h1>
            <div className="role-and-dept">
              <div className="role-badge"><User className="icon" /> {adminData.role}</div>
              <div className="department-badge">{adminData.department}</div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="personal-info-section">
            <label>Personal Information</label>
            <div className="personal-info-grid">
              <div className="info-card email-card"><Mail className="icon" /> {adminData.email}</div>
              <div className="info-card gender-card"><User className="icon" /> {adminData.gender}</div>
              <div className="info-card contact-card"><Phone className="icon" /> {adminData.contact}</div>
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

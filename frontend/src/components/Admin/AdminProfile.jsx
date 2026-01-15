// AdminProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Eye, EyeOff, Camera } from 'lucide-react';
import DashboardSectionHeader from './DashboardSectionHeader';
import { authService } from '../Api/AuthService';
import './AdminProfile.css';

export default function AdminProfile() {
  const timeoutRef = useRef(null);

  const [adminData, setAdminData] = useState({
    name: '',
    role: '',
    email: '',
    contact: '',
    avatar: 'https://ui-avatars.com/api/?name=Admin&size=200&background=0891b2&color=fff&bold=true&font-size=0.4'
  });

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Fetch admin profile from API
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const email = localStorage.getItem('email') || 'admin@riphah.edu.pk'; // fallback email
        const res = await authService.getUserByEmail(email);

        if (res.success && res.data?.user) {
          const u = res.data.user;
          setAdminData({
            name: u.name || 'Admin',
            role: u.role || 'Admin',
            email: u.email || 'admin@riphah.edu.pk',
            contact: u.contactNumber || '+92 300 1234567',
            avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Admin')}&size=200&background=0891b2&color=fff&bold=true&font-size=0.4`
          });
        } else {
          console.error('Failed to fetch admin:', res.data?.error || res.error);
        }
      } catch (err) {
        console.error('Error fetching admin:', err.message);
      }
    };

    fetchAdminProfile();
  }, []);

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ type: '', text: '' });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  // Update password API call
  const handleUpdatePassword = async () => {
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
      <DashboardSectionHeader description="Admins can view their own profile.">
        Profile
      </DashboardSectionHeader>

      <div className="admin-profile-container">
        <div className="admin-profile-card" role="region" aria-label="Admin profile">
          {/* Decorative background */}
          <div className="profile-decorative-bg">
            <div className="overlay" aria-hidden="true"></div>
            <svg viewBox="0 0 1440 120" className="wave" aria-hidden="true">
              <path
                fill="#ffffff"
                d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
              ></path>
            </svg>
          </div>

          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <img src={adminData.avatar} alt={adminData.name} className="avatar" />
             
            </div>
          </div>

          {/* Name & Role */}
          <div className="profile-name-role">
            <h1>{adminData.name}</h1>
           
          </div>

          {/* Personal Info */}
          <div className="personal-info-section">
            <div className="personal-info-header">
              <label>Personal Information</label>
            </div>

            <div className="personal-info-grid">
              <div className="info-card email-card">
                <Mail className="icon" aria-hidden="true" />
                <span>{adminData.email}</span>
              </div>
              <div className="info-card role-card">
                <User className="icon" aria-hidden="true" />
                <span>{adminData.role}</span>
              </div>
              <div className="info-card contact-card">
                <Phone className="icon" aria-hidden="true" />
                <span>{adminData.contact}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
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
                  />
                  <button type="button" onClick={() => setShowNewPassword(s => !s)}>
                    {showNewPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
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
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(s => !s)}>
                    {showConfirmPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
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

import React, {useEffect, useRef, useState} from "react";
import styled, { keyframes } from "styled-components";
import { IconButton, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import Avatar from "@mui/material/Avatar";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import "./DashboardLayout.css";
import ToastService from "./ToastService/ToastService.jsx";
import ProfileService from "./Api/ProfileService.jsx";

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(20px);}
  100% { opacity: 1; transform: translateY(0);}
`;

const DashboardLayoutStyled = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f9faff;
`;

const MainPanel = styled.main`
  flex: 1;
  padding: 32px;
  animation: ${fadeIn} 1s;
  min-height: 100vh;
  @media (max-width: 900px) {
    padding: 16px;
  }
`;

export default function DashboardLayout({
  menu,
  headerTitle,
  roleInfo,
  tabComponents,
  onLogout,
  children, activeTab, setActiveTab,
}) {
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);
  const displayName = localStorage.getItem("name") || roleInfo.name || "User";
  const displayRole = localStorage.getItem("role") || "User";
  const email = localStorage.getItem("email");

  useEffect(() => {
    const loadProfilePic = async () => {
      if (!email) return;
      const imageUrl = await ProfileService.getProfilePic(email);
      if (imageUrl) setProfilePic(imageUrl);
    };
    loadProfilePic();
  }, [email]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await ProfileService.uploadProfilePic(email, file);
      ToastService.success("Profile picture uploaded!");
      const imageUrl = await ProfileService.getProfilePic(email);
      if (imageUrl) setProfilePic(imageUrl);
    } catch {
      ToastService.error("Upload failed!");
    }
  };

  const handleAvatarClick = () => fileInputRef.current.click();

  return (
    <DashboardLayoutStyled>
      <aside className="sidebar">
        <div className="logo-area">
          <img src={roleInfo.logo} alt="Logo" draggable={false} />
          {roleInfo.title}
        </div>
        <ul className="sidebar-menu">
          {menu.map((m) => (
            <li
              className={`sidebar-item${activeTab === m.label ? " active" : ""}`}
              key={m.label}
              onClick={() => setActiveTab(m.label)}
              title={m.label}
            >
              {m.icon} {m.label}
            </li>
          ))}
        </ul>
        <div className="logout-area">
          <Tooltip title="Logout">
            <IconButton
              onClick={onLogout}
              size="medium"
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </div>
      </aside>

      <div className="spacer" />

      <MainPanel>
        <header className="dashboard-header">
          <h1 className="dashboard-title">{headerTitle}</h1>
          <div className="dashboard-profile">
            <Tooltip title="New Notification">
              <NotificationsActiveIcon sx={{
                width: 40,
                height: 40,
                marginRight: "10px",
                color: '#01337a',
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }} />
            </Tooltip>
            <Tooltip title="Click to change profile picture">
              <Avatar
                  src={profilePic || "/default-avatar.png"}
                  alt={displayName}
                  sx={{
                    width: 48,
                    height: 48,
                    marginRight: "10px",
                    cursor: "pointer",
                    border: "2px solid #ddd",
                    transition: "0.3s",
                    "&:hover": {
                      borderColor: "#1976d2",
                      transform: "scale(1.05)",
                    },
                  }}
                  onClick={handleAvatarClick}
              />
            </Tooltip>
            <div className="grid-flow-col">
            <div className="name-text">{displayName}</div>
            <div className="name-text"><span>({displayRole}) </span></div>
            </div>
            <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{display: "none"}}
            />
          </div>
        </header>
        {tabComponents[activeTab]}
        {children}
      </MainPanel>
    </DashboardLayoutStyled>
  );
}
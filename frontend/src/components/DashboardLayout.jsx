import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes , css } from "styled-components";
import {IconButton, Tooltip, Dialog, DialogTitle, DialogContent} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import "./DashboardLayout.css";
import ToastService from "./ToastService/ToastService.jsx";
import ProfileService from "./Api/ProfileService.jsx";
import getUserInfoFromStorage from "./Auth/UserInfo.jsx";
import StudentNoticeboard from "./Student/StudentNoticeboard.jsx";
import {useNavigate} from "react-router-dom";


const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(20px);}
  100% { opacity: 1; transform: translateY(0);}
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px #1976d2; }
  50% { box-shadow: 0 0 20px #1976d2; }
  100% { box-shadow: 0 0 5px #1976d2; }
`;

const GlowingIconWrapper = styled.div`
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
  ${(props) =>
    props.$glow &&
    css`
      animation: ${glow} 1.5s infinite;
    `}
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
  children,
  activeTab,
  setActiveTab,
}) {
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);
  const displayName = localStorage.getItem("name") || roleInfo.name || "User";
  const displayRole = localStorage.getItem("role") || "User";
  const allowSwitch = localStorage.getItem("isAlsoCOR") || false;
  const email = localStorage.getItem("email");
  const user = getUserInfoFromStorage();
  const [hasNewNotification, setHasNewNotification] = useState(true);
  const navigate = useNavigate();


    const [noticeboardOpen, setNoticeboardOpen] = useState(false);

  useEffect(() => {
    const loadProfilePic = async () => {
       if (!email) return;
      const imageUrl = await ProfileService.getProfilePic(email);
      localStorage.setItem('imageurl' , imageUrl);
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
      window.location.reload();
      const imageUrl = await ProfileService.getProfilePic(email);
      if (imageUrl) setProfilePic(imageUrl);
    } catch {
      ToastService.error("Upload failed!");
    }
  };

  const handleAvatarClick = () => fileInputRef.current.click();

  const handleLogoClick = () => {
    if (!user || !user.role) {
      navigate("/auth");
      return;
    }
    const dashboards = {
      admin: "/dashboard/admin",
      supervisor: "/dashboard/supervisor",
      coordinator: "/dashboard/coordinator",
      student: "/dashboard/student",
    };
    window.location.href = dashboards[user.role];
  };

  const handleNotificationClick = () => {
    setNoticeboardOpen(true);
    setHasNewNotification(false);
  };

  const HandleAccountSwitch = () => {
      console.log("Account Switching");
      const role = localStorage.getItem("role");
      const switchTo= role ==  "coordinator" ? "supervisor" : "coordinator";
      localStorage.setItem("role", switchTo);
      localStorage.setItem("activeRole", switchTo);
      let roles = ["supervisor", "coordinator"];
      localStorage.setItem("roles", JSON.stringify(roles));
      window.location.reload();
  };

  return (
    <DashboardLayoutStyled>
      <aside className="sidebar">
        <div className="logo-area" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
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
        <div className="logout-area" style={{gap : 5}}>
          <Tooltip title="Logout">
            <IconButton onClick={onLogout} size="medium">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
            {allowSwitch == 'true' && (
                <Tooltip title="SWITCH ACCOUNT">
                    <IconButton onClick={HandleAccountSwitch} size="medium">
                        <SwitchAccountIcon/>
                    </IconButton>
                </Tooltip>
            )}
        </div>
      </aside>

      <div className="spacer" />

      <MainPanel>
        <header className="dashboard-header">
          <h1 className="dashboard-title">{headerTitle}</h1>
          <div className="dashboard-profile">
            <Tooltip title="Notifications">
                <GlowingIconWrapper $glow={hasNewNotification}>
                    <NotificationsActiveIcon
                        sx={{
                            width: 40,
                            height: 40,
                            marginRight: "2px",
                            color: "#01337a",
                            cursor: "pointer",
                            transition: "0.3s",
                            "&:hover": { transform: "scale(1.05)" },
                        }}
                        onClick={handleNotificationClick}
                    />
                </GlowingIconWrapper>
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
                  "&:hover": { borderColor: "#1976d2", transform: "scale(1.05)" },
                }}
                onClick={handleAvatarClick}
              />
            </Tooltip>
            <div className="grid-flow-col">
              <div className="name-text">{displayName}</div>
              <div className="name-text">
                <span>({displayRole}) </span>
              </div>
            </div>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              ref={fileInputRef}
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </div>
        </header>

        {tabComponents[activeTab]}
        {children}
      </MainPanel>

      {/* Noticeboard Modal */}
      <Dialog
        open={noticeboardOpen}
        onClose={() => setNoticeboardOpen(false)}
        fullWidth
        maxWidth="md"
        aria-labelledby="noticeboard-dialog"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <span style={{ fontWeight: 800, color: "#01337a" }}>Noticeboard</span>
          <IconButton onClick={() => setNoticeboardOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <StudentNoticeboard />
        </DialogContent>
      </Dialog>
    </DashboardLayoutStyled>
  );
}

import React from "react";
import styled, { keyframes } from "styled-components";
import { IconButton, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import "./DashboardLayout.css";

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
  defaultTab = "",
  onLogout,
  profileIcon,
  children, activeTab, setActiveTab,
}) {
  // Only show name (no SAP ID)
  const displayName = localStorage.getItem("name") || roleInfo.name || "User";
  // subtitle intentionally disabled
  // const displaySubtitle = "";

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
            {profileIcon}
            <div className="name-text">
              {displayName}
              {/* No SAP ID/subtitle here */}
            </div>
          </div>
        </header>
        {tabComponents[activeTab]}
        {children}
      </MainPanel>
    </DashboardLayoutStyled>
  );
}
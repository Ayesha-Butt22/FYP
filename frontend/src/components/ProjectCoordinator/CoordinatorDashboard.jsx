import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Groups as GroupsIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  Announcement as AnnouncementIcon,
  Description as DescriptionIcon
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";
import OverviewCoordinator from "./OverviewCoordinator";
import ManageDeadlines from "./ManageDeadlines";
import GroupsTab from "./GroupsGrid";
import SupervisorSlots from "./SupervisorSlots";
import ManageTemplates from "./ManageTemplates";
import SupervisorArchive from "../Supervisor/SupervisorArchive";
import Noticeboard from "../Admin/Noticeboard";
import TemplateView from "./TemplateView"; // renamed component import

const menu = [
  // { label: "Overview", icon: <DashboardIcon /> },
  { label: "Manage Deadlines", icon: <CalendarMonthIcon /> },
  { label: "Groups", icon: <GroupsIcon /> },
  { label: "Supervisor Slots", icon: <SettingsIcon /> },
  { label: "Manage Templates", icon: <SettingsIcon /> },
  { label: "Noticeboard", icon: <AnnouncementIcon /> },
  { label: "View Reports", icon: <DescriptionIcon /> }, // NEW: coordinator can view student templates/reports
  { label: "FYP Archive", icon: <ArchiveIcon /> }
];

const coordinatorInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Coordinator",
  subtitle: localStorage.getItem("department") || "Project Coordination",
  email: localStorage.getItem("email") || "coordinator@example.com",
};

export default function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth";
  };

  const tabComponents = {
    "Overview": <OverviewCoordinator onTabChange={setActiveTab} />,
    "Manage Deadlines": <ManageDeadlines />,
    "Groups": <GroupsTab />,
    "Supervisor Slots": <SupervisorSlots />,
    "Manage Templates": <ManageTemplates />,
    "Noticeboard": <Noticeboard />,
    "View Reports": <TemplateView />, // wired here (renamed)
    "FYP Archive": <SupervisorArchive />
  };

  return (
    <DashboardLayout
      menu={menu}
      headerTitle="Coordinator Dashboard"
      roleInfo={coordinatorInfo}
      tabComponents={tabComponents}
      defaultTab="Overview"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    />
  );
}
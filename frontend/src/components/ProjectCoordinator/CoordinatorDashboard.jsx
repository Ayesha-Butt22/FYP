import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  CalendarMonth as CalendarMonthIcon,
  Groups as GroupsIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  Announcement as AnnouncementIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import capImg from "../../assets/rc.png";
import OverviewCoordinator from "./OverviewCoordinator";
import ManageDeadlines from "./ManageDeadlines";
import GroupsTab from "./GroupsGrid";
import SupervisorSlots from "./SupervisorSlots";
import ManageTemplates from "./ManageTemplates";
import SupervisorArchive from "../Supervisor/SupervisorArchive";
import Noticeboard from "../Admin/Noticeboard";
import TemplateView from "./TemplateView";
import Profile from "./Profile";
import CoordinatorCommitteeResults from "./CoordinatorCommitteeResults.jsx"; // added import

const menu = [
  { label: "Manage Deadlines", icon: <CalendarMonthIcon /> },
  { label: "Groups", icon: <GroupsIcon /> },
  { label: "Supervisor Slots", icon: <SettingsIcon /> },
  { label: "Manage Templates", icon: <SettingsIcon /> },
  { label: "Noticeboard", icon: <AnnouncementIcon /> },
  { label: "View Reports", icon: <DescriptionIcon /> },
  { label: "Committee Results", icon: <GroupsIcon /> }, // <-- added menu entry
  { label: "FYP Archive", icon: <ArchiveIcon /> },
  { label: "Analytics", icon: <BarChartIcon /> },
  { label: "Profile", icon: <PersonIcon /> }
];

const coordinatorInfo = {
  logo: capImg,
  title: "RiphahCapstone",
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
    "View Reports": <TemplateView />,
    "Committee Results": <CoordinatorCommitteeResults />, // mapped tab
    "FYP Archive": <SupervisorArchive />,
    "Analytics": <div style={{ padding: 24 }}>Analytics (placeholder)</div>,
    "Profile": <Profile />
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
import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  SupervisorAccount as SupervisorAccountIcon,
  School as SchoolIcon,
  Archive as ArchiveIcon,
  Description as DescriptionIcon,
  Campaign as CampaignIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";

import AdminOverview from "./AdminOverview";
import ManageSupervisors from "./ManageSupervisors";
import ManageAdmin from "./ManageAdmin";
import ManageCoordinators from "./ManageCoordinators";
import ApprovedStudents from "./ApprovedStudents";
import GroupsGrid from "../ProjectCoordinator/GroupsGrid";
import SupervisorArchive from "../Supervisor/SupervisorArchive";
import StudentTemplates from "./StudentTemplates";
import Noticeboard from "./Noticeboard";
import AdminProfile from "./AdminProfile"; // <-- new profile tab

const menu = [
  { label: "Dashboard", icon: <DashboardIcon /> },
  { label: "Manage Admin", icon: <PersonIcon /> },
  { label: "Manage Supervisors", icon: <GroupsIcon /> },
  { label: "Manage Project Coordinators", icon: <SupervisorAccountIcon /> },
  { label: "Approved Students", icon: <SchoolIcon /> },
  { label: "Templates", icon: <DescriptionIcon /> },
  { label: "Noticeboard", icon: <CampaignIcon /> },
  { label: "View Groups", icon: <GroupsIcon /> },
  { label: "FYP Archive", icon: <ArchiveIcon /> },
  { label: "Profile", icon: <AccountCircleIcon /> }, // profile at the end
];

const adminInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Admin",
  subtitle: "FYP Admin",
  email: localStorage.getItem("email") || "admin@riphah.edu.pk",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth";
  };

  const tabComponents = {
    Dashboard: <AdminOverview onTabChange={setActiveTab} />,
    "Manage Admin": <ManageAdmin />,
    "Manage Supervisors": <ManageSupervisors />,
    "Manage Project Coordinators": <ManageCoordinators />,
    "Approved Students": <ApprovedStudents />,
    Templates: <StudentTemplates />,
    Noticeboard: <Noticeboard />,
    "View Groups": <GroupsGrid />,
    "FYP Archive": <SupervisorArchive />,
    Profile: <AdminProfile />, // wired profile component
  };

  return (
    <DashboardLayout
      menu={menu}
      headerTitle="Admin Dashboard"
      roleInfo={adminInfo}
      tabComponents={tabComponents}
      defaultTab="Dashboard"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    />
  );
}
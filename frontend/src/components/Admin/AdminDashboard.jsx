import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  SupervisorAccount as SupervisorAccountIcon,
  School as SchoolIcon,
  Archive as ArchiveIcon,
  Description as DescriptionIcon
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";
import AdminOverview from "./AdminOverview";
import ManageSupervisors from "./ManageSupervisors";
import ManageAdmin from "./ManageAdmin";
import ManageCoordinators from "./ManageCoordinators";
import ApprovedStudents from "./ApprovedStudents";
import GroupsGrid from "../ProjectCoordinator/GroupsGrid";
import SupervisorArchive from "../Supervisor/SupervisorArchive";

// Added: import StudentTemplates so Admin can view Templates tab
import StudentTemplates from "../Student/StudentTemplates.jsx";

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "Manage Admin", icon: <PersonIcon /> },
  { label: "Manage Supervisors", icon: <GroupsIcon /> },
  { label: "Manage Project Coordinators", icon: <SupervisorAccountIcon /> },
  { label: "Approved Students", icon: <SchoolIcon /> },
  // Templates tab inserted after "Approved Students"
  { label: "Templates", icon: <DescriptionIcon /> },
  { label: "View Groups", icon: <GroupsIcon /> },
  { label: "FYP Archive", icon: <ArchiveIcon /> }
];

const adminInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Admin",
  subtitle: "FYP Admin",
  email: localStorage.getItem("email") || "admin@riphah.edu.pk",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth";
  };

  const tabComponents = {
    Overview: <AdminOverview onTabChange={setActiveTab} />,
    "Manage Admin": <ManageAdmin />,
    "Manage Supervisors": <ManageSupervisors />,
    "Manage Project Coordinators": <ManageCoordinators />,
    "Approved Students": <ApprovedStudents />,
    // Templates tab component (uses StudentTemplates component)
    "Templates": <StudentTemplates />,
    "View Groups": <GroupsGrid />,
    "FYP Archive": <SupervisorArchive />
  };

  return (
    <DashboardLayout
      menu={menu}
      headerTitle="Admin Dashboard"
      roleInfo={adminInfo}
      tabComponents={tabComponents}
      defaultTab="Overview"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    />
  );
}
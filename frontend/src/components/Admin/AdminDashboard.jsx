import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  SupervisorAccount as SupervisorAccountIcon,
  School as SchoolIcon
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";
import AdminOverview from "./AdminOverview";
import ManageSupervisors from "./ManageSupervisors";
// Placeholder imports for new tabs
// import ManageAdmin from "./ManageAdmin";
// import ManageCoordinators from "./ManageCoordinators";
// import ApprovedStudents from "./ApprovedStudents";

// Dummy placeholder components for demonstration
const ManageAdmin = () => <div style={{padding:30}}>Manage Admin Component</div>;
const ManageCoordinators = () => <div style={{padding:30}}>Manage Project Coordinators Component</div>;
const ApprovedStudents = () => <div style={{padding:30}}>Approved Students Component</div>;

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "Manage Admin", icon: <PersonIcon /> },
  { label: "Manage Supervisors", icon: <GroupsIcon /> },
  { label: "Manage Project Coordinators", icon: <SupervisorAccountIcon /> },
  { label: "Approved Students", icon: <SchoolIcon /> }
];

const adminInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Admin",
  subtitle: "FYP Admin",
  email: localStorage.getItem("email") || "admin@riphah.edu.pk"
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth";
  };

  const tabComponents = {
    "Overview": <AdminOverview />,
    "Manage Admin": <ManageAdmin />,
    "Manage Supervisors": <ManageSupervisors />,
    "Manage Project Coordinators": <ManageCoordinators />,
    "Approved Students": <ApprovedStudents />
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
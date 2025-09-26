import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  Groups as GroupsIcon
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";
import AdminOverview from "./AdminOverview";
import ManageSupervisors from "./ManageSupervisors";

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "Manage Supervisors", icon: <GroupsIcon /> }
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
    "Manage Supervisors": <ManageSupervisors />
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
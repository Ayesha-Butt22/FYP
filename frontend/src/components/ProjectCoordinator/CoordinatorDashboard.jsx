import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import { Dashboard as DashboardIcon, CalendarMonth as CalendarMonthIcon } from "@mui/icons-material";
import capImg from "../../assets/cap.png";
import OverviewCoordinator from "./OverviewCoordinator";
import ManageDeadlines from "./ManageDeadlines";

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "Manage Deadlines", icon: <CalendarMonthIcon /> },
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
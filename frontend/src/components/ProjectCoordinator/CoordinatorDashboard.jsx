import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Groups as GroupsIcon,
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";
import OverviewCoordinator from "./OverviewCoordinator";
import ManageDeadlines from "./ManageDeadlines";
import GroupsTab from "./GroupsGrid"; 

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "Manage Deadlines", icon: <CalendarMonthIcon /> },
  { label: "Groups", icon: <GroupsIcon /> }, // new Groups tab
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
    "Groups": <GroupsTab />, // render the GroupsTab component here
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
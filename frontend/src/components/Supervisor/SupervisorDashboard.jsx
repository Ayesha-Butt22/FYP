import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  Groups as GroupsIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  EmojiObjects as EmojiObjectsIcon,
  Description as DescriptionIcon,
  CalendarMonth as CalendarMonthIcon,
  Campaign as CampaignIcon,
  LibraryBooks as LibraryBooksIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";
import OverviewSupervisor from "./OverviewSupervisor";
import SupervisorGroups from "./SupervisorGroups";
import SupervisorIdeaReview from "./SupervisorIdeaReview";
import SupervisorMilestones from "./SupervisorMilestones";
import SupervisorWhiteboard from "./SupervisorWhiteboard";
import SupervisorMeetings from "./SupervisorMeetings";
import SupervisorEvaluations from "./SupervisorEvaluations";
import SupervisorReports from "./SupervisorReports";
import SupervisorArchive from "./SupervisorArchive";
import SupervisorAnalytics from "./SupervisorAnalytics";
import SupervisorNotices from "./SupervisorNotices";
import SupervisorProfile from "./SupervisorProfile";

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "Idea & Proposal Review", icon: <AssignmentIcon /> },
  { label: "My Groups", icon: <GroupsIcon /> },
  { label: "Milestones", icon: <StarIcon /> },
  { label: "Whiteboard", icon: <CampaignIcon /> },
  { label: "Meetings", icon: <CalendarMonthIcon /> },
  { label: "Evaluations", icon: <EmojiObjectsIcon /> },
  { label: "Reports", icon: <DescriptionIcon /> },
  { label: "Analytics", icon: <BarChartIcon /> },
  { label: "FYP Archive", icon: <LibraryBooksIcon /> },
  { label: "Profile", icon: <PersonIcon /> }, // Profile tab at end
];

const supervisorInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Supervisor",
  subtitle: localStorage.getItem("specialization") || "AI, ML, Software Engineering",
  email: localStorage.getItem("email") || "supervisor@example.com",
};

export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth?role=supervisor";
  };

  const tabComponents = {
    "Overview": <OverviewSupervisor onTabChange={setActiveTab} />,
    "Idea & Proposal Review": <SupervisorIdeaReview />,
    "My Groups": <SupervisorGroups />,
    "Milestones": <SupervisorMilestones />,
    "Whiteboard": <SupervisorWhiteboard />,
    "Meetings": <SupervisorMeetings />,
    "Evaluations": <SupervisorEvaluations />,
    "Reports": <SupervisorReports />,
    "Analytics": <SupervisorAnalytics />,
    "FYP Archive": <SupervisorArchive />,
    "Profile": <SupervisorProfile supervisorInfo={supervisorInfo} />,
  };

  return (
    <DashboardLayout
      menu={menu}
      headerTitle="Supervisor Dashboard"
      roleInfo={supervisorInfo}
      tabComponents={tabComponents}
      defaultTab="Overview"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      profileIcon={<SupervisorNotices />}
    />
  );
}
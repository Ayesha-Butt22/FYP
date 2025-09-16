import React from "react";
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

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "Idea & Proposal Review", icon: <AssignmentIcon /> },
  { label: "My Groups", icon: <GroupsIcon /> },
  { label: "Milestones", icon: <StarIcon /> },
  { label: "Whiteboard", icon: <CampaignIcon /> },
  { label: "Meetings", icon: <CalendarMonthIcon /> },
  { label: "Evaluations", icon: <EmojiObjectsIcon /> },
  { label: "Reports", icon: <DescriptionIcon /> },
  { label: "Analytics", icon: <BarChartIcon /> },       // <- Analytics before Archive
  { label: "FYP Archive", icon: <LibraryBooksIcon /> }, // <- Archive always last
];

const supervisorInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Supervisor",
  subtitle: localStorage.getItem("specialization") || "",
};

const tabComponents = {
  "Overview": <OverviewSupervisor />,
  "My Groups": <SupervisorGroups />,
  "Idea & Proposal Review": <SupervisorIdeaReview />,
  "Milestones": <SupervisorMilestones />,
  "Whiteboard": <SupervisorWhiteboard />,
  "Meetings": <SupervisorMeetings />,
  "Evaluations": <SupervisorEvaluations />,
  "Reports": <SupervisorReports />,
  "Analytics": <SupervisorAnalytics />,         // <- Analytics before Archive
  "FYP Archive": <SupervisorArchive />,         // <- Archive always last
};

export default function SupervisorDashboard() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth?role=supervisor";
  };

  return (
    <DashboardLayout
      menu={menu}
      headerTitle="Supervisor Dashboard"
      roleInfo={supervisorInfo}
      tabComponents={tabComponents}
      defaultTab="Overview"
      onLogout={handleLogout}
      profileIcon={<SupervisorNotices />}
    />
  );
}
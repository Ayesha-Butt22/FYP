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
import capImg from "../../assets/rc.png";
import OverviewSupervisor from "./OverviewSupervisor";
import SupervisorGroups from "./SupervisorGroups";
import SupervisorIdeaReview from "./SupervisorIdeaReview";
import SupervisorMilestones from "./SupervisorMilestones";
import SupervisorWhiteboard from "./SupervisorWhiteboard";
import SupervisorMeetings from "./SupervisorMeetings";
import SupervisorEvaluations from "./SupervisorEvaluations";
import CommitteeEvaluation from "./CommitteeEvaluation.jsx"; 
import SupervisorCommitteeResults from "./SupervisorCommitteeResults.jsx"; 
import SupervisorReports from "./SupervisorReports";
import SupervisorArchive from "./SupervisorArchive";
import SupervisorAnalytics from "./SupervisorAnalytics";
import SupervisorNotices from "./SupervisorNotices";
import SupervisorProfile from "./SupervisorProfile";
import StudentTemplates from "../Student/StudentTemplates.jsx";

const menu = [
  { label: "Idea & Proposal Review", icon: <AssignmentIcon /> },
  { label: "My Groups", icon: <GroupsIcon /> },
  { label: "Templates", icon: <DescriptionIcon /> },
  { label: "Milestones", icon: <StarIcon /> },
  { label: "Whiteboard", icon: <CampaignIcon /> },
  { label: "Meetings", icon: <CalendarMonthIcon /> },
  { label: "Evaluations", icon: <EmojiObjectsIcon /> },
  { label: "Commitee Eval", icon: <EmojiObjectsIcon /> }, 
  { label: "Committee Results", icon: <GroupsIcon /> }, 
  { label: "Reports", icon: <DescriptionIcon /> },
  { label: "Analytics", icon: <BarChartIcon /> },
  { label: "FYP Archive", icon: <LibraryBooksIcon /> },
  { label: "Profile", icon: <PersonIcon /> },
];

const supervisorInfo = {
  logo: capImg,
  title: "RiphahCapstone",
  name: localStorage.getItem("name") || "Supervisor",
  subtitle: localStorage.getItem("specialization") || "AI, ML, Software Engineering",
  email: localStorage.getItem("email") || "supervisor@example.com",
};

export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth";
  };

  const tabComponents = {
    Overview: <OverviewSupervisor onTabChange={setActiveTab} />,
    "Idea & Proposal Review": <SupervisorIdeaReview />,
    "My Groups": <SupervisorGroups />,
    Templates: <StudentTemplates />,
    Milestones: <SupervisorMilestones />,
    Whiteboard: <SupervisorWhiteboard />,
    Meetings: <SupervisorMeetings />,
    Evaluations: <SupervisorEvaluations />,
    "Commitee Eval": <CommitteeEvaluation />, 
    "Committee Results": <SupervisorCommitteeResults />, 
    Reports: <SupervisorReports />,
    Analytics: <SupervisorAnalytics />,
    "FYP Archive": <SupervisorArchive />,
    Profile: <SupervisorProfile supervisorInfo={supervisorInfo} />,
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
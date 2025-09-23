import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  GroupAdd as GroupAddIcon,
  PersonSearch as PersonSearchIcon,
  Assignment as AssignmentIcon,
  // AutoAwesome as AutoAwesomeIcon, // REMOVED
  Description as DescriptionIcon,
  Star as StarIcon,
  ListAlt as ListAltIcon,
  Campaign as CampaignIcon,
  CalendarMonth as CalendarMonthIcon,
  Checklist as ChecklistIcon,
  Feedback as FeedbackIcon,
  Book as BookIcon,
  LibraryBooks as LibraryBooksIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";

// --- Import all your student tab components below ---
import OverviewStudent from "./OverviewStudent";
import StudentGroup from "./StudentGroup";
import StudentSupervisorSelection from "./StudentSupervisorSelection";
import StudentIdeaProposal from "./StudentIdeaProposal";
import StudentTemplates from "./StudentTemplates";
// import StudentMilestones from "./StudentMilestones"; // REMOVED
import StudentTasks from "./StudentTasks";
import StudentWhiteboard from "./StudentWhiteboard";
import StudentMeetings from "./StudentMeetings";
import StudentChecklist from "./StudentChecklist";
import StudentFeedback from "./StudentFeedback";
import StudentJournal from "./StudentJournal";
import StudentArchive from "./StudentArchive";
import StudentReports from "./StudentReports";
import StudentAnalytics from "./StudentAnalytics";
import StudentProfile from "./StudentProfile"; // optional, if you want a profile tab

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "My Group", icon: <GroupAddIcon /> },
  { label: "Supervisor Selection", icon: <PersonSearchIcon /> },
  { label: "Idea & Proposal", icon: <AssignmentIcon /> },
  // { label: "AI Title Rewriter", icon: <AutoAwesomeIcon /> }, // REMOVED
  { label: "Templates", icon: <DescriptionIcon /> },
  // { label: "Milestones", icon: <StarIcon /> }, // REMOVED
  { label: "Tasks", icon: <ListAltIcon /> },
  { label: "Whiteboard", icon: <CampaignIcon /> },
  { label: "Meetings", icon: <CalendarMonthIcon /> },
  { label: "Checklist", icon: <ChecklistIcon /> },
  { label: "Feedback/Evaluations", icon: <FeedbackIcon /> },
  { label: "Journal", icon: <BookIcon /> },
  { label: "FYP Archive", icon: <LibraryBooksIcon /> },
  { label: "Reports", icon: <DescriptionIcon /> },
  { label: "Analytics", icon: <BarChartIcon /> },
  // { label: "Profile", icon: <PersonIcon /> }, // optional, enable if you want
];

const studentInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Student",
  subtitle: localStorage.getItem("studentId") || "SAP ID",
  email: localStorage.getItem("email") || "student@example.com",
};

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth?role=student";
  };

  const tabComponents = {
    "Overview": <OverviewStudent onTabChange={setActiveTab} />,
    "My Group": <StudentGroup />,
    "Supervisor Selection": <StudentSupervisorSelection />,
    "Idea & Proposal": <StudentIdeaProposal />,
    // "AI Title Rewriter": <StudentIdeaProposal aiOnly={true} />, // REMOVED
    "Templates": <StudentTemplates />,
    // "Milestones": <StudentMilestones />, // REMOVED
    "Tasks": <StudentTasks />,
    "Whiteboard": <StudentWhiteboard />,
    "Meetings": <StudentMeetings />,
    "Checklist": <StudentChecklist />,
    "Feedback/Evaluations": <StudentFeedback />,
    "Journal": <StudentJournal />,
    "FYP Archive": <StudentArchive />,
    "Reports": <StudentReports />,
    "Analytics": <StudentAnalytics />,
    // "Profile": <StudentProfile studentInfo={studentInfo} />, // optional
  };

  return (
    <DashboardLayout
      menu={menu}
      headerTitle="Student Dashboard"
      roleInfo={studentInfo}
      tabComponents={tabComponents}
      defaultTab="Overview"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    />
  );
}
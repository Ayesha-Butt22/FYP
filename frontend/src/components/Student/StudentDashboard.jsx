import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import {
  Dashboard as DashboardIcon,
  GroupAdd as GroupAddIcon,
  PersonSearch as PersonSearchIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  ListAlt as ListAltIcon,
  CalendarMonth as CalendarMonthIcon,
  Checklist as ChecklistIcon,
  Feedback as FeedbackIcon,
  Book as BookIcon,
  LibraryBooks as LibraryBooksIcon,
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";

// --- Import all your student tab components below ---
import OverviewStudent from "./OverviewStudent";
import StudentGroup from "./StudentGroup";
import StudentSupervisorSelection from "./StudentSupervisorSelection";
import StudentIdeaProposal from "./StudentIdeaProposal";
import StudentTemplates from "./StudentTemplates";
import StudentTasks from "./StudentTasks";
import StudentMeetings from "./StudentMeetings";
import StudentChecklist from "./StudentChecklist";
import StudentJournal from "./StudentJournal";
import StudentArchive from "./StudentArchive";
import StudentReports from "./StudentReports";
import StudentNotices from "../Student/StudentNotices"; // <-- Notification bell

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "My Group", icon: <GroupAddIcon /> },
  { label: "Supervisor Selection", icon: <PersonSearchIcon /> },
  { label: "Idea & Proposal", icon: <AssignmentIcon /> },
  { label: "Templates", icon: <DescriptionIcon /> },
  { label: "Tasks", icon: <ListAltIcon /> },
  { label: "Meetings", icon: <CalendarMonthIcon /> },
  { label: "Checklist", icon: <ChecklistIcon /> },
  { label: "Evaluations", icon: <FeedbackIcon /> },
  { label: "Journal", icon: <BookIcon /> },
  { label: "Reports", icon: <DescriptionIcon /> },
  { label: "FYP Archive", icon: <LibraryBooksIcon /> },
];

const studentInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Student",
  // subtitle: "", // Do NOT set subtitle so SAP ID does not show in corner
  // email: localStorage.getItem("email") || "", // (Optional)
};

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth";
  };

  const tabComponents = {
    "Overview": <OverviewStudent onTabChange={setActiveTab} />,
    "My Group": <StudentGroup />,
    "Supervisor Selection": <StudentSupervisorSelection />,
    "Idea & Proposal": <StudentIdeaProposal />,
    "Templates": <StudentTemplates />,
    "Tasks": <StudentTasks />,
    "Meetings": <StudentMeetings />,
    "Checklist": <StudentChecklist />,
    "Evaluations": <StudentJournal />,
    "Journal": <StudentJournal />,
    "Reports": <StudentReports />,
    "FYP Archive": <StudentArchive />,
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
      profileIcon={<StudentNotices />}  // <-- Notification bell in header
    />
  );
}
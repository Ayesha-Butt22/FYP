import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import OverviewStudent from "./OverviewStudent";
import StudentGroup from "./StudentGroup";
import StudentIdeaProposal from "./StudentIdeaProposal";
import SelectedSupervisor from "./SelectedSupervisor";
import StudentTemplates from "./StudentTemplates";
import StudentUploads from "./StudentUploads";
import StudentTasks from "./Tasks";
import StudentMeetings from "./StudentMeetings";
import StudentChecklist from "./StudentChecklist";
import StudentEvaluations from "./StudentEvaluations";
import StudentJournal from "./StudentJournal";
import StudentReports from "./StudentReports";
import SupervisorArchive from "../Supervisor/SupervisorArchive";
import StudentProfile from "./StudentProfile";

import {
  Dashboard as DashboardIcon,
  GroupAdd as GroupAddIcon,
  Assignment as AssignmentIcon,
  PersonSearch as PersonSearchIcon,
  Description as DescriptionIcon,
  CloudUpload as UploadIcon,
  ListAlt as ListAltIcon,
  CalendarMonth as CalendarMonthIcon,
  Checklist as ChecklistIcon,
  Feedback as FeedbackIcon,
  Book as BookIcon,
  LibraryBooks as LibraryBooksIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import capImg from "../../assets/cap.png";

const menu = [
  // { label: "Overview", icon: <DashboardIcon /> },
  { label: "My Group", icon: <GroupAddIcon /> },
  { label: "Idea & Proposal", icon: <AssignmentIcon /> },
  { label: "Selected supervisor", icon: <PersonSearchIcon /> },
  { label: "Templates", icon: <DescriptionIcon /> },
  { label: "Uploads", icon: <UploadIcon /> }, // <-- New tab inserted after Templates
  { label: "Tasks", icon: <ListAltIcon /> },
  { label: "Meetings", icon: <CalendarMonthIcon /> },
  { label: "Checklist", icon: <ChecklistIcon /> },
  { label: "Evaluations", icon: <FeedbackIcon /> },
  { label: "Journal", icon: <BookIcon /> },
  { label: "Reports", icon: <DescriptionIcon /> },
  { label: "FYP Archive", icon: <LibraryBooksIcon /> },
  { label: "Profile", icon: <AccountCircleIcon /> } // added Profile at the end
];

const studentInfo = {
  logo: capImg,
  title: "Auto-FYP",
  name: localStorage.getItem("name") || "Student",
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
    "Idea & Proposal": <StudentIdeaProposal onTabChange={setActiveTab} />,
    "Selected supervisor": <SelectedSupervisor />,
    "Templates": <StudentTemplates />,
    "Uploads": <StudentUploads />, // <-- new mapping
    "Tasks": <StudentTasks />,
    "Meetings": <StudentMeetings />,
    "Checklist": <StudentChecklist />,
    "Evaluations": <StudentEvaluations />,
    "Journal": <StudentJournal />,
    "Reports": <StudentReports />,
    "FYP Archive": <SupervisorArchive />,
    "Profile": <StudentProfile /> // Profile tab wired
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
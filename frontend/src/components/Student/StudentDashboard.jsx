import React, { useState } from "react";
import DashboardLayout from "../DashboardLayout";
import OverviewStudent from "./OverviewStudent";
import StudentGroup from "./StudentGroup";
import StudentIdeaProposal from "./StudentIdeaProposal";
import StudentSupervisorSelection from "./StudentSupervisorSelection";
import StudentTemplates from "./StudentTemplates";
import StudentTasks from "./StudentTasks";
import StudentMeetings from "./StudentMeetings";
import StudentChecklist from "./StudentChecklist";
import StudentEvaluations from "./StudentEvaluations";
import StudentJournal from "./StudentJournal";
import StudentReports from "./StudentReports";
import SupervisorArchive from "../Supervisor/SupervisorArchive";

import {
  Dashboard as DashboardIcon,
  GroupAdd as GroupAddIcon,
  Assignment as AssignmentIcon,
  PersonSearch as PersonSearchIcon,
  Description as DescriptionIcon,
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
  { label: "Supervisor Selection", icon: <PersonSearchIcon /> },
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
    "Idea & Proposal": <StudentIdeaProposal />,
    "Supervisor Selection": <StudentSupervisorSelection />,
    "Templates": <StudentTemplates />,
    "Tasks": <StudentTasks />,
    "Meetings": <StudentMeetings />,
    "Checklist": <StudentChecklist />,
    "Evaluations": <StudentEvaluations />,
    "Journal": <StudentJournal />,
    "Reports": <StudentReports />,
    "FYP Archive": <SupervisorArchive />,
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
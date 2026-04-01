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
/*import StudentEvaluations from "./StudentEvaluations";*/
import StudentJournal from "./StudentJournal";
import StudentReports from "./StudentReports";
import SupervisorArchive from "../Supervisor/SupervisorArchive";
import StudentProfile from "./StudentProfile";
import StudentEvaluationResults from "./StudentEvaluationResults";
import StudentCommitteeResults from "./StudentCommitteeResults.jsx";

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
import capImg from "../../assets/rc.png";

const menu = [
  { label: "Overview", icon: <DashboardIcon /> },
  { label: "My Group", icon: <GroupAddIcon /> },
  { label: "Idea & Proposal", icon: <AssignmentIcon /> },
  { label: "Selected supervisor", icon: <PersonSearchIcon /> },
  { label: "Templates", icon: <DescriptionIcon /> },
  { label: "Uploads", icon: <UploadIcon /> },
  { label: "Tasks", icon: <ListAltIcon /> },
  { label: "Meetings", icon: <CalendarMonthIcon /> },
  { label: "Checklist", icon: <ChecklistIcon /> },
//  { label: "Evaluations", icon: <FeedbackIcon /> },
  // { label: "Committee Result", icon: <FeedbackIcon /> },
  { label: "Final Results", icon: <BookIcon /> },
  { label: "Journal", icon: <BookIcon /> },
  { label: "Reports", icon: <DescriptionIcon /> },
  { label: "FYP Archive", icon: <LibraryBooksIcon /> },
  { label: "Profile", icon: <AccountCircleIcon /> }
];

const studentInfo = {
  logo: capImg,
  title: "RiphahCapstone",
  name: localStorage.getItem("name") || "Student",
};

const getUserInfoFromStorage = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
    return null;
  }
};

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isArchived, setIsArchived] = useState(false);
  const user = getUserInfoFromStorage();

  React.useEffect(() => {
    const checkArchivedStatus = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(`http://localhost:5000/api/auth/user-by-email/${user.email}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            // Actually, let's fetch my profile info which should have isArchived from my group
            const sapId = data.user.studentId || data.user.sapId;
            if (sapId) {
                const sInfo = await fetch(`http://localhost:5000/api/templates/student/${sapId}`);
                if (sInfo.ok) {
                    const info = await sInfo.json();
                    if (info.isArchived) {
                        setIsArchived(true);
                        setActiveTab("FYP Archive");
                    }
                }
            }
          }
        }
      } catch (e) { console.error("Archive status check failed", e); }
    };
    checkArchivedStatus();
  }, [user?.email]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth";
  };

  const filteredMenu = isArchived 
    ? menu.filter(m => m.label === "FYP Archive" || m.label === "Profile")
    : menu;

  const tabComponents = {
    "Overview": <OverviewStudent onTabChange={setActiveTab} />,
    "My Group": <StudentGroup />,
    "Idea & Proposal": <StudentIdeaProposal onTabChange={setActiveTab} />,
    "Selected supervisor": <SelectedSupervisor />,
    "Templates": <StudentTemplates />,
    "Uploads": <StudentUploads />,
    "Tasks": <StudentTasks />,
    "Meetings": <StudentMeetings />,
    "Checklist": <StudentChecklist />,
    //"Evaluations": <StudentEvaluations />,
    // "Committee Result": <StudentCommitteeResults />,
    "Final Results": <StudentEvaluationResults />,
    "Journal": <StudentJournal />,
    "Reports": <StudentReports />,
    "FYP Archive": <SupervisorArchive />,
    "Profile": <StudentProfile />
  };

  return (
    <DashboardLayout
      menu={filteredMenu}
      headerTitle="Student Dashboard"
      roleInfo={studentInfo}
      tabComponents={tabComponents}
      defaultTab={isArchived ? "FYP Archive" : "Overview"}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    />
  );
}
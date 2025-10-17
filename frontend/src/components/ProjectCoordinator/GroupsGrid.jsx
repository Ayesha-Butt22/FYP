import React, { useEffect, useState } from "react";
import GroupInfoCard from "./GroupInfoCard";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./GroupsGrid.css";

/* sample data (replace with API fetch if desired) */
const sampleGroups = [
  {
    id: "G-101",
    title: "Smart Parking System",
    description:
      "Parking guidance using computer vision to detect available parking spaces and notify drivers in real-time through mobile notifications and web dashboard.",
    tools: ["React", "Node.js", "OpenCV", "MongoDB", "Express"],
    members: [
      { name: "Ayesha Butt", sap: "48288", email: "ayesha.butt@riphah.edu.pk" },
      { name: "Madiha Saeed", sap: "48289", email: "madiha.saeed@riphah.edu.pk" },
      { name: "Sara Khan", sap: "48290", email: "sara.khan@riphah.edu.pk" }
    ]
  },
  {
    id: "G-102",
    title: "Campus Chatbot Assistant",
    description:
      "AI-powered conversational assistant for campus services with natural language processing and intent recognition to help students with queries about courses, schedules, and facilities.",
    tools: ["Python", "Rasa", "Docker", "FastAPI", "PostgreSQL"],
    members: [
      { name: "Bilal Ahmed", sap: "48300", email: "bilal.ahmed@riphah.edu.pk" },
      { name: "Zoya Hassan", sap: "48301", email: "zoya.hassan@riphah.edu.pk" },
      { name: "Usman Ali", sap: "48302", email: "usman.ali@riphah.edu.pk" }
    ]
  },
  {
    id: "G-103",
    title: "E-Learning Management Portal",
    description:
      "Comprehensive learning management system featuring video lectures, interactive quizzes, assignment tracking, and real-time collaboration tools for enhanced online education experience.",
    tools: ["React", "Django", "PostgreSQL", "Redis", "AWS"],
    members: [
      { name: "Ahmed Ali", sap: "48310", email: "ahmed.ali@riphah.edu.pk" },
      { name: "Fatima Khan", sap: "48311", email: "fatima.khan@riphah.edu.pk" },
      { name: "Hira Ahmed", sap: "48312", email: "hira.ahmed@riphah.edu.pk" }
    ]
  }
];

export default function GroupsGrid() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // replace with API call if needed
    setGroups(sampleGroups);
  }, []);

  return (
    <div className="groups-page">
      <div className="groups-container">
        <div className="header-row">
          <div className="header-left">
            <DashboardSectionHeader>Groups</DashboardSectionHeader>
            <div className="section-desc">
              View all department groups, check members, project details and manage them from here.
            </div>
          </div>
          <div className="header-right">
            <button className="add-group-btn" onClick={() => console.log("Add Group")}>
              + Add Group
            </button>
          </div>
        </div>

        <div className="groups-grid">
          {groups.map((g) => (
            <div key={g.id}>
              <GroupInfoCard
                group={g}
                onOpen={(grp) => console.log("Open", grp.id)}
                onEdit={(grp) => console.log("Edit", grp.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
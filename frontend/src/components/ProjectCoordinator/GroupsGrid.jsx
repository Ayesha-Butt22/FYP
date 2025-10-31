import React, { useEffect, useState } from "react";
import GroupInfoCard from "./GroupInfoCard";
import DashboardSectionHeader from "./DashboardSectionHeader";

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
      { name: "Sara Khan", sap: "48290", email: "sara.khan@riphah.edu.pk" },
    ],
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
      { name: "Usman Ali", sap: "48302", email: "usman.ali@riphah.edu.pk" },
    ],
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
      { name: "Hira Ahmed", sap: "48312", email: "hira.ahmed@riphah.edu.pk" },
    ],
  },
];

export default function GroupsGrid() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // Attempt to fetch real data from backend and map it to the same shape as sampleGroups.
    // If the API call fails or data shape is unexpected, keep using sampleGroups (no UI change).
    let mounted = true;

    const mapApiGroupToUi = (g) => {
      // g expected shape from GroupsInfoController:
      // { _id, groupId, members: [{ role, name, email, sapId }], proposals: [ { projectTitle, projectDescription, projectTools, ... } ] }
      const id = g.groupId || (g._id ? String(g._id) : "unknown");
      // pick first proposal if available
      const p = Array.isArray(g.proposals) && g.proposals.length > 0 ? g.proposals[0] : null;
      const title = (p && p.projectTitle) || "Untitled Project";
      const description = (p && p.projectDescription) || "";
      // projectTools may be stored as a comma-separated string; convert to array
      let tools = [];
      if (p && p.projectTools) {
        if (Array.isArray(p.projectTools)) {
          tools = p.projectTools;
        } else if (typeof p.projectTools === "string") {
          tools = p.projectTools.split(",").map((t) => t.trim()).filter(Boolean);
        }
      }

      // members come from controller as array with fields name, email, sapId
      const members =
        Array.isArray(g.members) && g.members.length > 0
          ? g.members.map((m) => ({
              name: m.name || (m.email ? m.email.split("@")[0] : "Student"),
              sap: m.sapId || m.sap || "",
              email: m.email || "",
            }))
          : [];

      return {
        id,
        title,
        description,
        tools,
        members,
      };
    };

    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token"); // include token if available
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const resp = await fetch("http://localhost:5173/api/groups/info", { method: "GET", headers });
        if (!mounted) return;

        if (!resp.ok) {
          // server error or not available -- keep sample data
          console.warn("Failed to fetch groups/info, status:", resp.status);
          setGroups(sampleGroups);
          return;
        }

        const json = await resp.json().catch(() => null);
        if (!json || !json.success || !Array.isArray(json.data)) {
          // Unexpected response shape -- keep sample
          console.warn("Unexpected groups/info response shape, falling back to sampleGroups", json);
          setGroups(sampleGroups);
          return;
        }

        const mapped = json.data.map(mapApiGroupToUi);
        setGroups(mapped);
      } catch (err) {
        console.error("Error fetching groups/info:", err);
        // fallback to sample groups (do not break UI)
        setGroups(sampleGroups);
      }
    };

    fetchGroups();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <DashboardSectionHeader description={"View all department groups, check members, project details and manage them from here"}>
        Groups
      </DashboardSectionHeader>
      <GroupInfoCard groups={groups} />
    </div>
  );
}
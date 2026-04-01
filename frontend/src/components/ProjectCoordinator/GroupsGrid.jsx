import React, { useEffect, useState } from "react";
import GroupInfoCard from "./GroupInfoCard";
import DashboardSectionHeader from "./DashboardSectionHeader";
import groupsInfoApi from "../Api/ProjectCoordinator/GroupsInfoApi";


const sampleGroups = [
  {
    id: "G-101",
    title: "Smart Parking System",
    description:
      "Parking guidance using computer vision to detect available parking spaces and notify drivers in real-time.",
    tools: ["React", "Node.js", "OpenCV", "MongoDB", "Express"],
    members: [
      { name: "Ayesha Butt", sap: "48288", email: "ayesha.butt@riphah.edu.pk" },
      { name: "Madiha Saeed", sap: "48289", email: "madiha.saeed@riphah.edu.pk" },
      { name: "Sara Khan", sap: "48290", email: "sara.khan@riphah.edu.pk" },
    ],
  },
];

export default function GroupsGrid() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const emailToName = (email) => {
      if (!email) return "";
      const local = email.split("@")[0] || "";
      const parts = local.split(/[._-]+/).filter(Boolean);
      if (parts.length === 0) return local;
      return parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ");
    };

    const maskGroupId = (id) => {
      if (!id) return "group-unknown";
      const str = String(id);
      if (/^[0-9a-fA-F]{24}$/.test(str)) {
        return "Group-" + str.slice(-5);
      }
      return str;
    };

 
    const mapApiGroupToUi = (g) => {
      const rawId = g.groupId || (g._id ? String(g._id) : "unknown");
      const id = maskGroupId(rawId); 

      const firstProposal =
        Array.isArray(g.proposals) && g.proposals.length > 0
          ? g.proposals[0]
          : null;

      const title =
        (firstProposal && firstProposal.projectTitle) ||
        g.title ||
        "Untitled Project";

      const description =
        (firstProposal && firstProposal.projectDescription) ||
        g.description ||
        "No project description provided.";

      let tools = [];
      if (firstProposal && firstProposal.projectTools) {
        if (Array.isArray(firstProposal.projectTools)) {
          tools = firstProposal.projectTools;
        } else if (typeof firstProposal.projectTools === "string") {
          tools = firstProposal.projectTools
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }

      const members =
        Array.isArray(g.members) && g.members.length > 0
          ? g.members.map((m) => ({
              name: m.name || (m.email ? emailToName(m.email) : "Student"),
              sap: m.sapId || m.sap || "",
              email: m.email || "",
            }))
          : [];

      return { id, title, description, tools, members };
    };

    
    const fetchGroups = async () => {
      setLoading(true);
      const res = await groupsInfoApi.fetchGroupsInfo();

      if (!mounted) return;

      if (!res.success || !Array.isArray(res.data)) {
        console.warn("⚠️ Using fallback sample data...");
        setGroups(sampleGroups);
      } else {
        setGroups(res.data.map(mapApiGroupToUi));
      }

      setLoading(false);
    };

    fetchGroups();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <DashboardSectionHeader description="View all department groups, members, and project information.">
        Groups
      </DashboardSectionHeader>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "20px" }}>Loading groups...</p>
      ) : (
        <GroupInfoCard groups={groups} />
      )}
    </div>
  );
}

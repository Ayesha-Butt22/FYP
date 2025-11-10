import React, { useEffect, useState } from "react";
import GroupInfoCard from "./GroupInfoCard";
import DashboardSectionHeader from "./DashboardSectionHeader";
import groupsInfoApi from "../Api/ProjectCoordinator/GroupsInfoApi";

// ✅ Fallback sample data (untouched)
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

    // ✅ Email → Name converter
    const emailToName = (email) => {
      if (!email) return "";
      const local = email.split("@")[0] || "";
      const parts = local.split(/[._-]+/).filter(Boolean);
      if (parts.length === 0) return local;
      return parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ");
    };

    // ✅ NEW: Masking function → group-12345
    const maskGroupId = (id) => {
      if (!id) return "group-unknown";
      const str = String(id);
      const last5 = str.slice(-5); 
      return "group-" + last5;
    };

    // ✅ Mapping API response to UI-safe object
    const mapApiGroupToUi = (g) => {
      const rawId = g.groupId || (g._id ? String(g._id) : "unknown");
      const id = maskGroupId(rawId); // ✅ Masked ID used here

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

    // ✅ Fetch groups from API
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

import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { FaUsers, FaArrowRight, FaTimes } from "react-icons/fa";
import DonutChart from "./DonutChart";
import "./SupervisorGroups.css";

// ----- Dummy Data -----
const assignedGroups = [
  {
    groupNo: 1,
    groupId: "G-101",
    title: "Smart Attendance System",
    proposalStatus: "Approved",
    program: "Software Engineering",
    milestonesTotal: 5,
    milestonesCompleted: 4,
    progress: 80,
    members: [
      { name: "Ali Raza", sapId: "2021001" },
      { name: "Sana Tariq", sapId: "2021002" },
      { name: "Bilal Khan", sapId: "2021003" },
    ],
    milestones: [
      { name: "Proposal", score: 95, level: "Completed", timeSpent: "0:45:00", totalTime: "1:00:00", color: "#2563eb" },
      { name: "Mid Evaluation", score: 70, level: "In Progress", timeSpent: "0:30:00", totalTime: "1:00:00", color: "#22c55e" },
      { name: "Final Report", score: 35, level: "Not Started", timeSpent: "0:00:00", totalTime: "1:00:00", color: "#f43f5e" }
    ]
  },
  {
    groupNo: 2,
    groupId: "G-102",
    title: "AI-Based Disease Prediction",
    proposalStatus: "Pending",
    program: "Computer Science",
    milestonesTotal: 5,
    milestonesCompleted: 3,
    progress: 60,
    members: [
      { name: "Ayesha Butt", sapId: "2021004" },
      { name: "Madiha Sumbal", sapId: "2021005" },
      { name: "Saad Farooq", sapId: "2021006" },
    ],
    milestones: [
      { name: "Proposal", score: 80, level: "Completed", timeSpent: "0:40:00", totalTime: "1:00:00", color: "#2563eb" },
      { name: "Mid Evaluation", score: 45, level: "In Progress", timeSpent: "0:20:00", totalTime: "1:00:00", color: "#22c55e" },
      { name: "Final Report", score: 0, level: "Not Started", timeSpent: "0:00:00", totalTime: "1:00:00", color: "#f43f5e" }
    ]
  },
  {
    groupNo: 3,
    groupId: "G-103",
    title: "Online Exam Proctoring",
    proposalStatus: "Rejected",
    program: "Information Technology",
    milestonesTotal: 5,
    milestonesCompleted: 2,
    progress: 35,
    members: [
      { name: "Fatima Noor", sapId: "2021007" },
      { name: "Usman Ghani", sapId: "2021008" },
      { name: "Hira Qureshi", sapId: "2021009" },
    ],
    milestones: [
      { name: "Proposal", score: 55, level: "Completed", timeSpent: "0:32:00", totalTime: "1:00:00", color: "#2563eb" },
      { name: "Mid Evaluation", score: 25, level: "In Progress", timeSpent: "0:11:00", totalTime: "1:00:00", color: "#22c55e" },
      { name: "Final Report", score: 0, level: "Not Started", timeSpent: "0:00:00", totalTime: "1:00:00", color: "#f43f5e" }
    ]
  },
];

export default function SupervisorGroups() {
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedGroup(null);
    };
    if (selectedGroup) {
      window.addEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedGroup]);

  return (
    <div className="supervisor-page-container">
      <DashboardSectionHeader
        description="Here you can view all FYP groups assigned to you. Click 'View Group Details' to see members, milestones, and progress analytics."
      >
        My Groups
      </DashboardSectionHeader>

      <div className="supervisor-group-cards-row">
        {assignedGroups.map(group => (
          <div className="supervisor-group-card" key={group.groupId}>
            <div className="supervisor-group-icon"><FaUsers /></div>
            <div className="supervisor-group-no">Group {group.groupNo}</div>
            <div className="supervisor-group-title" title={group.title}>{group.title}</div>
            <button className="supervisor-view-btn" onClick={() => setSelectedGroup(group)}>
              View Group Details <FaArrowRight />
            </button>
          </div>
        ))}
      </div>

      {/* ----- Modal for group details ----- */}
      {selectedGroup && (
        <div className="supervisor-modal-overlay" role="dialog" aria-modal="true" aria-label={`Details for ${selectedGroup.title}`}>
          <div className="supervisor-modal-card">
            <button className="supervisor-modal-close" aria-label="Close" onClick={() => setSelectedGroup(null)}>
              <FaTimes />
            </button>

            <div className="supervisor-modal-title">{selectedGroup.title}</div>

            {/* ----- Details Section ----- */}
            <div className="supervisor-group-details-form">
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Group Number:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.groupNo}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Group ID:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.groupId}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Program:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.program}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Proposal/Idea Status:</span>
                <span className={`supervisor-status-badge supervisor-status-${selectedGroup.proposalStatus.toLowerCase()}`}>
                  {selectedGroup.proposalStatus}
                </span>
              </div>

              {/* ----- Progress Section ----- */}
              <div className="supervisor-progress-row">
                <div style={{display: "flex", alignItems: "center", gap: 12, width: "100%", flexWrap: "wrap"}}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 18 }}>Progress:</b>
                    <span style={{ color: "#15803d", fontWeight: 800, fontSize: 18 }}>
                      {Math.round((selectedGroup.milestonesCompleted / selectedGroup.milestonesTotal) * 100)}%
                    </span>
                  </div>
                  <div className="supervisor-progress-subtext">
                    ({selectedGroup.milestonesCompleted} of {selectedGroup.milestonesTotal} milestones)
                  </div>
                </div>
              </div>
              <div className="supervisor-progress-bar-bg supervisor-progress-bar-bg-large">
                <div
                  className="supervisor-progress-bar-fill"
                  style={{
                    width: `${Math.round((selectedGroup.milestonesCompleted / selectedGroup.milestonesTotal) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* ----- Members Table ----- */}
            <div className="supervisor-modal-label">Group Members:</div>
            <table className="supervisor-member-table supervisor-member-table-large">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>SAP ID</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroup.members.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.name}</td>
                    <td>{m.sapId}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ----- Donut Chart Analytics ----- */}
            <div className="supervisor-analytics-card supervisor-analytics-card-large">
              <h3 className="supervisor-chart-title">Progress Tracking</h3>
              <DonutChart
                data={selectedGroup.milestones.map(m => ({
                  label: m.name,
                  value: m.score,
                  color: m.color
                }))}
                size={360}
                donutWidth={90}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
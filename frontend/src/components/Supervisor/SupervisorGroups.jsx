import React, { useState } from "react";
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
      { name: "Proposal", score: 95, level: "Completed", timeSpent: "0:45:00", totalTime: "1:00:00", color: "#3b82f6" },
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
      { name: "Proposal", score: 80, level: "Completed", timeSpent: "0:40:00", totalTime: "1:00:00", color: "#3b82f6" },
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
      { name: "Proposal", score: 55, level: "Completed", timeSpent: "0:32:00", totalTime: "1:00:00", color: "#3b82f6" },
      { name: "Mid Evaluation", score: 25, level: "In Progress", timeSpent: "0:11:00", totalTime: "1:00:00", color: "#22c55e" },
      { name: "Final Report", score: 0, level: "Not Started", timeSpent: "0:00:00", totalTime: "1:00:00", color: "#f43f5e" }
    ]
  },
];

export default function SupervisorGroups() {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <div className="page-container">
      <h2 className="groups-heading">My Groups</h2>
      <div className="section-desc">
        Here you can view all the FYP groups assigned to you. Click "View Group Details" to see team members, program, milestones, and progress analytics.
      </div>
      <div className="group-cards-row">
        {assignedGroups.map(group => (
          <div className="group-card" key={group.groupId}>
            <div className="group-icon"><FaUsers /></div>
            <div className="group-no">Group {group.groupNo}</div>
            <div className="group-title">{group.title}</div>
            <button className="view-btn" onClick={() => setSelectedGroup(group)}>
              View Group Details <FaArrowRight />
            </button>
          </div>
        ))}
      </div>
      {/* Modal for group details */}
      {selectedGroup && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close" aria-label="Close" onClick={() => setSelectedGroup(null)}>
              <FaTimes />
            </button>
            <h3 className="modal-title">{selectedGroup.title}</h3>
            <div className="modal-row"><b>Group Number:</b> {selectedGroup.groupNo}</div>
            <div className="modal-row"><b>Group ID:</b> {selectedGroup.groupId}</div>
            <div className="modal-row"><b>Program:</b> {selectedGroup.program}</div>
            <div className="modal-row">
              <b>Proposal/Idea Status:</b>
              <span className={`status-badge status-${selectedGroup.proposalStatus.toLowerCase()}`}>
                {selectedGroup.proposalStatus}
              </span>
            </div>
            <div className="progress-section">
              <div className="progress-text">
                Progress:&nbsp;
                <span style={{color:"#15803d"}}>{
                  selectedGroup.milestonesTotal && selectedGroup.milestonesCompleted
                  ? Math.round((selectedGroup.milestonesCompleted / selectedGroup.milestonesTotal) * 100)
                  : selectedGroup.progress || 0
                }%</span>
                &nbsp;({selectedGroup.milestonesCompleted} of {selectedGroup.milestonesTotal} milestones)
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill"
                  style={{
                    width: `${
                      selectedGroup.milestonesTotal && selectedGroup.milestonesCompleted
                        ? Math.round((selectedGroup.milestonesCompleted / selectedGroup.milestonesTotal) * 100)
                        : selectedGroup.progress || 0
                    }%`
                  }}
                />
              </div>
            </div>
            <div className="modal-label">Group Members:</div>
            <table className="member-table">
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
            {/* Donut Analytics Panel */}
            <div className="analytics-card">
              <h3 className="chart-title">Progress Tracking</h3>
              <DonutChart
                data={selectedGroup.milestones.map(m => ({
                  label: m.name,
                  value: m.score,
                  color: m.color
                }))}
                size={290}
                donutWidth={80}
                centerTitle=""
                centerValue=""
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
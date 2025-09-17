import React, { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./SupervisorMilestones.css";

Chart.register(ArcElement, Tooltip, Legend);

const GROUPS = [
  {
    group: "Group 1",
    title: "Smart Attendance System",
    department: "Software Engineering",
    templateLink: "https://drive.google.com/drive/folders/1hoi4pinQmXyC6hO0js786KTWTKKmxIMs",
    milestones: [
      { name: "Proposal", status: "completed", due: "2025-09-10" },
      { name: "SRS", status: "pending", due: "2025-09-20" },
      { name: "Design", status: "pending", due: "2025-09-28" },
      { name: "Report", status: "pending", due: "2025-10-10" },
      { name: "Defense", status: "pending", due: "2025-10-25" }
    ],
    members: ["Ali Raza", "Sana Tariq", "Bilal Khan"]
  },
  {
    group: "Group 2",
    title: "AI-Based Disease Prediction",
    department: "Computer Science",
    templateLink: "https://drive.google.com/drive/folders/CS-TEMPLATES-URL",
    milestones: [
      { name: "Proposal", status: "completed", due: "2025-09-11" },
      { name: "SRS", status: "completed", due: "2025-09-19" },
      { name: "Design", status: "overdue", due: "2025-09-29" },
      { name: "Report", status: "pending", due: "2025-10-11" },
      { name: "Defense", status: "pending", due: "2025-10-28" }
    ],
    members: ["Ayesha Butt", "Madiha Sumbal", "Saad Farooq"]
  },
  {
    group: "Group 3",
    title: "Online Exam Proctoring",
    department: "Computer Arts",
    templateLink: "https://drive.google.com/drive/folders/CA-TEMPLATES-URL",
    milestones: [
      { name: "Proposal", status: "completed", due: "2025-09-12" },
      { name: "SRS", status: "completed", due: "2025-09-21" },
      { name: "Design", status: "completed", due: "2025-09-30" },
      { name: "Report", status: "pending", due: "2025-10-13" },
      { name: "Defense", status: "pending", due: "2025-10-27" }
    ],
    members: ["Fatima Noor", "Usman Ghani", "Hira Qureshi"]
  }
];

const STATUS = {
  completed: { color: "#22c55e", bg: "#d1fadf", text: "Completed", icon: "✅" },
  pending: { color: "#2563eb", bg: "#fef7aa", text: "Pending", icon: "⏳" },
  overdue: { color: "#ef4444", bg: "#fee2e2", text: "Overdue", icon: "❌" }
};

export default function SupervisorMilestones() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="milestone-dashboard-container">
      <DashboardSectionHeader style={{ marginLeft: "101px" , marginBottom: "45px", marginTop: "-5px"
 }}>Milestones & Timeline</DashboardSectionHeader>
      <div className="milestone-groups-row">
        {GROUPS.map((group) => {
          const completed = group.milestones.filter(m => m.status === "completed").length;
          const pending = group.milestones.filter(m => m.status === "pending").length;
          const overdue = group.milestones.filter(m => m.status === "overdue").length;
          const total = group.milestones.length;
          const percent = Math.round((completed / total) * 100);

          const doughnutData = {
            labels: ["Completed", "Pending", "Overdue"],
            datasets: [
              {
                data: [completed, pending, overdue],
                backgroundColor: [
                  STATUS.completed.color,
                  STATUS.pending.color,
                  STATUS.overdue.col43eor
                ],
                borderWidth: 1
              }
            ]
          };

          return (
            <div className="milestone-group-card" key={group.group}>
              <div className="milestone-card-header">
                <div>
                  <div className="milestone-card-group">{group.group}</div>
                  <div className="milestone-card-title">{group.title}</div>
                  <div className="milestone-card-department">
                    <b>Department:</b> {group.department}
                  </div>
                  <div className="milestone-card-members">
                    <b>Members:</b> {group.members.join(", ")}
                  </div>
                  <a
                    href={group.templateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="milestone-template-link"
                  >
                    📂 {group.department} Templates
                  </a>
                </div>
                <div className="milestone-card-progress">
                  <div className="milestone-doughnut">
                    <Doughnut
                      data={doughnutData}
                      options={{
                        cutout: "74%",
                        plugins: { legend: { display: false } }
                      }}
                    />
                  </div>
                  <div className="milestone-percent-complete">
                    {percent}% Complete
                  </div>
                </div>
              </div>

              <button
                className="milestone-toggle-btn"
                onClick={() =>
                  setExpanded(expanded === group.group ? null : group.group)
                }
              >
                {expanded === group.group ? "Hide Timeline" : "Show Timeline"}
              </button>

              {expanded === group.group && (
                <div className="milestone-timeline-table-wrap">
                  <table className="milestone-timeline-table">
                    <thead>
                      <tr>
                        <th className="milestone-th">Milestone</th>
                        <th className="milestone-th">Due Date</th>
                        <th className="milestone-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.milestones.map((m) => (
                        <tr key={m.name}>
                          <td className="milestone-td">{m.name}</td>
                          <td className="milestone-td">{m.due}</td>
                          <td className="milestone-td">
                            <span
                              className={`milestone-status milestone-status-${m.status}`}
                            >
                              <span className="milestone-status-icon">
                                {STATUS[m.status].icon}
                              </span>
                              {STATUS[m.status].text}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

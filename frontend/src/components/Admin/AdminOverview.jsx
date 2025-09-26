import React from "react";
import { FaUsers, FaUserTie, FaClipboardList, FaUserPlus, FaArrowRight } from "react-icons/fa";
import "./AdminOverview.css";

const activities = [
  { type: "supervisor", text: "Added Supervisor Dr. Ali Raza", time: "1 hour ago" },
  { type: "group", text: "Assigned Group G-106 to Supervisor", time: "Yesterday" },
  { type: "coordinator", text: "Promoted Ms. Sana as Coordinator", time: "2 days ago" }
];

const stats = [
  { label: "Total Supervisors", value: 8, icon: <FaUserTie />, color: "#2563eb" },
  { label: "Active Groups", value: 24, icon: <FaUsers />, color: "#16a34a" },
  { label: "Pending Approvals", value: 3, icon: <FaClipboardList />, color: "#fbc73d" },
  { label: "New Registrations", value: 2, icon: <FaUserPlus />, color: "#f43f5e" }
];

export default function AdminOverview({ onTabChange }) {
  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div className="banner-title">Welcome, Admin!</div>
        <div className="banner-desc">
          Manage supervisors, coordinators, student registrations, group assignments, and overall FYP workflow from a single dashboard.
        </div>
        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="quick-links">
          <button
            className="quick-link-btn"
            onClick={() => onTabChange && onTabChange("Manage Supervisors")}
          >
            <FaUserTie /> Manage Supervisors <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange && onTabChange("Manage Coordinators")}
            disabled
          >
            <FaUserTie /> Manage Coordinators <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange && onTabChange("Registrations")}
            disabled
          >
            <FaUserPlus /> Registrations <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="section-chip">Overview</div>
      <div className="card-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon-circle" style={{background: s.color}}>{s.icon}</div>
            <div className="stat-title">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="progress-section-gap"></div>
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        <div className="timeline">
          {activities.map((act, i) => (
            <div className="activity-item" key={i}>
              {act.text}
              <span className="time">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fyp-tip">
        <span role="img" aria-label="bulb">💡</span>
        <span>Admin Tip: Keep supervisor and group data updated for smooth FYP management!</span>
      </div>
    </div>
  );
}
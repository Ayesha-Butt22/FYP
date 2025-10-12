import React from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaStar, FaArrowRight, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./OverviewCoordinator.css";

/**
 * Coordinator Overview
 * - Layout and style follow Supervisor overview you provided.
 * - Quick links and cards are adapted for the Coordinator role.
 * - onTabChange prop is used to switch to other tabs (e.g., "Idea & Proposal Review", "Manage Deadlines", "Supervisor Allocation").
 */

const activities = [
  { type: "deadline", text: "Created department deadline: Proposal Submission", time: "1 hour ago" },
  { type: "assignment", text: "Assigned Dr. Khan to Group G-205", time: "Yesterday" },
  { type: "notice", text: "Posted notice: Midterm demo schedule", time: "3 days ago" },
];

const progress = [
  { label: "Proposal Reviews Completed", percent: 40, color: "#2563eb" },
  { label: "Deadlines Met", percent: 82, color: "#16a34a" },
  { label: "Supervisor Allocation", percent: 60, color: "#fbc73d" },
];

export default function OverviewCoordinator({ onTabChange }) {
  const navigate = useNavigate();

  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div className="banner-title">Welcome, Coordinator!</div>

        <div className="banner-desc">
          Oversee your department's FYP activity — review proposals, set deadlines, assign supervisors and monitor progress.
        </div>

        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="quick-links">
          <button
            className="quick-link-btn"
            onClick={() => onTabChange && onTabChange("Idea & Proposal Review")}
            title="Go to proposal review"
          >
            <FaClipboardCheck /> Review Proposals <FaArrowRight />
          </button>

          <button
            className="quick-link-btn"
            onClick={() => onTabChange && onTabChange("Manage Deadlines")}
            title="Create or manage deadlines"
          >
            <FaCalendarCheck /> Manage Deadlines <FaArrowRight />
          </button>

          <button
            className="quick-link-btn"
            onClick={() => onTabChange && onTabChange("Supervisor Allocation")}
            title="Assign supervisors"
          >
            <FaUserTie /> Allocate Supervisors <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="section-chip">Overview</div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#2563eb" }}>
            <FaUsers />
          </div>
          <div className="stat-title">Department Projects</div>
          <div className="stat-value">—</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#fbc73d" }}>
            <FaClipboardCheck />
          </div>
          <div className="stat-title">Pending Proposals</div>
          <div className="stat-value">—</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#16a34a" }}>
            <FaUserTie />
          </div>
          <div className="stat-title">Supervisors</div>
          <div className="stat-value">—</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#f43f5e" }}>
            <FaStar />
          </div>
          <div className="stat-title">Overdue Milestones</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="progress-section-gap" />

      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        {progress.map((p, i) => (
          <div key={i}>
            <div className="progress-label">
              <span>{p.label}</span>
              <span>{p.percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${p.percent}%`, background: p.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="progress-section-gap" />

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
        <span>
          Tip: Use "Manage Deadlines" to keep the department on schedule and use "Allocate Supervisors" to balance workloads.
        </span>
      </div>
    </div>
  );
}
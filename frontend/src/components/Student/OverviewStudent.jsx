import React from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaCheckCircle, FaStar, FaArrowRight, FaBookOpen, FaTasks, FaLightbulb } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./OverviewSupervisor.css";

// Dummy Data
const activities = [
  { type: "group", text: "Invited Ali Raza to your group", time: "2 hours ago" },
  { type: "proposal", text: "Submitted Project Proposal", time: "Yesterday" },
  { type: "meeting", text: "Booked meeting with Dr. Khan", time: "3 days ago" },
  { type: "feedback", text: "Received feedback on SRS", time: "4 days ago" },
];
const progress = [
  { label: "Milestones Completed", percent: 60, color: "#2563eb" },
  { label: "Tasks Completed", percent: 45, color: "#fbc73d" },
  { label: "Meetings Attended", percent: 80, color: "#16a34a" },
  { label: "Templates Uploaded", percent: 35, color: "#f43f5e" },
];

export default function OverviewStudent({ onTabChange }) {
  const navigate = useNavigate();

  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div className="banner-title">Welcome, Student!</div>
        <div className="banner-desc">
          All your FYP progress, group, supervisor, and tasks — in one place.<br />
          Stay organized, keep your group on track, and never miss a deadline.
        </div>
        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="quick-links">
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("My Group")}
          >
            <FaUsers /> My Group <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("Idea & Proposal")}
          >
            <FaClipboardCheck /> Submit Proposal <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("Supervisor Selection")}
          >
            <FaStar /> Supervisor <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("Tasks")}
          >
            <FaTasks /> Tasks <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="section-chip">Overview</div>
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#2563eb"}}><FaUsers /></div>
          <div className="stat-title">Group Status</div>
          <div className="stat-value">Draft</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#fbc73d"}}><FaClipboardCheck /></div>
          <div className="stat-title">Proposal</div>
          <div className="stat-value">Submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#16a34a"}}><FaCalendarCheck /></div>
          <div className="stat-title">Next Meeting</div>
          <div className="stat-value">25 Sep</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#f43f5e"}}><FaCheckCircle /></div>
          <div className="stat-title">Checklist</div>
          <div className="stat-value">5/8</div>
        </div>
      </div>

      <div className="progress-section-gap"></div>
      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        {progress.map((p, i) => (
          <div key={i}>
            <div className="progress-label">
              <span>{p.label}</span>
              <span>{p.percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${p.percent}%`, background: p.color}} />
            </div>
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
        <FaLightbulb style={{color: "#ffbf00"}}/>
        <span>Tip: Complete your checklist and upload all templates before final submission!</span>
      </div>
    </div>
  );
}
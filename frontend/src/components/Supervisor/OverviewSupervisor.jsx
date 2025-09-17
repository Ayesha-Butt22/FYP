import React from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaStar, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./OverviewSupervisor.css";

// Dummy Data
const activities = [
  { type: "proposal", text: "Reviewed Proposal for Group G-101", time: "2 hours ago" },
  { type: "meeting", text: "Scheduled meeting with Group G-102", time: "Yesterday" },
  { type: "evaluation", text: "Evaluated Milestone for G-101", time: "3 days ago" },
];
const progress = [
  { label: "Proposal Reviews", percent: 50, color: "#2563eb" },
  { label: "Meetings Booked", percent: 75, color: "#fbc73d" },
  { label: "Evaluations Done", percent: 25, color: "#16a34a" },
];

export default function OverviewSupervisor() {
  const navigate = useNavigate();

  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div className="banner-title">Welcome, Supervisor!</div>
        <div className="banner-desc">
          Stay on top of your assigned FYP groups, review proposals, track progress, schedule meetings, and manage evaluations — all in one place.
        </div>
        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="quick-links">
          <button
            className="quick-link-btn"
            onClick={() => navigate("/review")}
          >
            <FaClipboardCheck /> Review Proposals <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => navigate("/meeting")}
          >
            <FaCalendarCheck /> Schedule Meeting <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => navigate("/groups")}
          >
            <FaUsers /> My Groups <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="section-chip">Overview</div>
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#2563eb"}}><FaUsers /></div>
          <div className="stat-title">Groups Assigned</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#fbc73d"}}><FaClipboardCheck /></div>
          <div className="stat-title">Pending Proposals</div>
          <div className="stat-value">2</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#16a34a"}}><FaCalendarCheck /></div>
          <div className="stat-title">Upcoming Meetings</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#f43f5e"}}><FaStar /></div>
          <div className="stat-title">Evaluations Due</div>
          <div className="stat-value">1</div>
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
        <span role="img" aria-label="bulb">💡</span>
        <span>FYP Tip: Giving clear, constructive feedback helps students deliver high quality projects!</span>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaStar, FaArrowRight, FaUserTie } from "react-icons/fa";
import "./OverviewCoordinator.css";

const getTimeAgo = (date) => {
  if (!date) return "Recently";
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  return "Just now";
};

export default function OverviewCoordinator({ onTabChange }) {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [statsRes, activitiesRes] = await Promise.all([
          fetch(`http://localhost:5000/api/coordinator/stats`, { headers }),
          fetch(`http://localhost:5000/api/coordinator/recent-activities`, { headers })
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) setStats(statsData.stats);
        }

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          if (activitiesData.success) setActivities(activitiesData.activities || []);
        }
      } catch (err) {
        console.error("Error fetching overview data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div className="banner-title">Coordinator Workspace!</div>

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
            onClick={() => onTabChange && onTabChange("Groups")}
            title="Go to groups and proposals"
          >
            <FaClipboardCheck /> Groups & Proposals <FaArrowRight />
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
            onClick={() => onTabChange && onTabChange("Supervisor Slots")}
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
          <div className="stat-value">{stats ? stats.totalGroups : "..."}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#fbc73d" }}>
            <FaClipboardCheck />
          </div>
          <div className="stat-title">Current Week</div>
          <div className="stat-value">{stats ? stats.currentWeek : "..."}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#16a34a" }}>
            <FaUserTie />
          </div>
          <div className="stat-title">Supervisors</div>
          <div className="stat-value">{stats ? stats.totalSupervisors : "..."}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#f43f5e" }}>
            <FaStar />
          </div>
          <div className="stat-title">Overdue Groups</div>
          <div className="stat-value">{stats ? stats.overdueCount : "..."}</div>
        </div>
      </div>

      <div className="progress-section-gap" />

      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
          <div>
            <div className="progress-label">
              <span>Overall Progress</span>
              <span>75%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `75%`, background: "#2563eb" }} />
            </div>
          </div>
      </div>

      <div className="progress-section-gap" />

      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        <div className="timeline">
          {activities.length > 0 ? activities.map((act, i) => (
            <div className="activity-item" key={i}>
              {act.text}
              <span className="time">{getTimeAgo(act.time)}</span>
            </div>
          )) : (
            <div className="activity-item">No recent activity</div>
          )}
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

import React, { useState, useEffect } from "react";
import { FaUserTie, FaUserPlus, FaArrowRight, FaUserGraduate } from "react-icons/fa";
import "./AdminOverview.css";
import toastService from "../ToastService/ToastService.jsx";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import { FaPeopleGroup, FaUserPen } from "react-icons/fa6";

export default function AdminOverview({ onTabChange }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSupervisors: 0,
    totalCoordinators: 0,
    totalGroups: 0,
  });
  const [loading,           setLoading]           = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [recentActivities,  setRecentActivities]  = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await adminSupervisorApi.getstats();
        if (response.data?.success) setStats(response.data.stats);
      } catch (error) {
        toastService.error("Error fetching system stats");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        setActivitiesLoading(true);
        const response = await adminSupervisorApi.getRecentActivities();
        if (response.data?.success) {
          setRecentActivities(response.data.activities || []);
        }
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        setRecentActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchStats();
    fetchRecentActivities();
  }, []);

  const statsCards = [
    { label: "Total Students",     value: stats.totalStudents,     icon: <FaUserGraduate />, color: "#2563eb" },
    { label: "Total Groups",       value: stats.totalGroups,       icon: <FaPeopleGroup />,  color: "#f43f5e" },
    { label: "Total Supervisors",  value: stats.totalSupervisors,  icon: <FaUserPen />,      color: "#16a34a" },
    { label: "Total Coordinators", value: stats.totalCoordinators, icon: <FaUserTie />,      color: "#fbc73d" },
  ];

  return (
    <div className="overview-container">
      {/* ── Banner ── */}
      <div className="welcome-banner">
        <div className="banner-title">Admin Workspace!</div>
        <div className="banner-desc">
          Manage supervisors, coordinators, student registrations, group assignments,
          and overall FYP workflow from a single dashboard.
        </div>
        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="quick-links" style={{ marginTop: 20 }}>
          <button className="quick-link-btn" onClick={() => onTabChange?.("Manage Supervisors")}>
            <FaUserTie /> Manage Supervisors <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange?.("Manage Project Coordinators")}>
            <FaUserTie /> Manage Coordinators <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange?.("Approved Students")}>
            <FaUserPlus /> Approve Students <FaArrowRight />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="section-chip">Overview</div>
      <div className="card-grid">
        {statsCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon-circle" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-title">{s.label}</div>
            <div className="stat-value">{loading ? "..." : s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <div className="progress-section-gap" />
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        {activitiesLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 18, borderRadius: 8, marginBottom: 14,
              background: "linear-gradient(90deg,#e0e7ef 25%,#f0f4fa 50%,#e0e7ef 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }} />
          ))
        ) : recentActivities.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "1rem", padding: "12px 0" }}>
            No recent activity yet.
          </p>
        ) : (
          <div className="timeline">
            {recentActivities.map((act, i) => (
              <div className="activity-item" key={i}>
                {act.text}
                <span className="time">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fyp-tip">
        <span role="img" aria-label="bulb">💡</span>
        <span>Admin Tip: Keep supervisor and group data updated for smooth FYP management!</span>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
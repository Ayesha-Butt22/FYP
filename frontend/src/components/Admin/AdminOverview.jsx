import React, { useState, useEffect } from "react";
import {FaUserTie, FaUserPlus, FaArrowRight, FaUserGraduate} from "react-icons/fa";
import "./AdminOverview.css";
import toastService from "../ToastService/ToastService.jsx";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import {FaPeopleGroup, FaUserPen} from "react-icons/fa6";

async function getSystemStats() {
    const response = await adminSupervisorApi.getstats();
    if (response.status !== 200) {
        throw new Error('Failed to fetch stats from the server.');
    }
    const data = response.data; // response.data is already an object
    if (!data.success) {
        throw new Error(data.message || 'API returned an error.');
    }
    return data;
}

// NEW: Function to fetch recent activities
async function getRecentActivities() {
    const response = await adminSupervisorApi.getRecentActivities();
    console.log("Recent Activities API Response:", response);
    if (response.status !== 200) {
        throw new Error('Failed to fetch recent activities from the server.');
    }
    const data = response.data; // response.data is already an object
    if (!data.success) {
        throw new Error(data.message || 'API returned an error.');
    }
    return data;
}

export default function AdminOverview({ onTabChange }) {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSupervisors: 0,
        totalCoordinators: 0,
        totalGroups: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState([]);
    const [apiError, setApiError] = useState(false); // NEW: Error state

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await getSystemStats();
                setStats(response.stats);
            } catch (error) {
                toastService.error("Error fetching system stats:", error);
            } finally {
                setLoading(false);
            }
        };

        // NEW: Fetch recent activities from API
        const fetchRecentActivities = async () => {
            try {
                setApiError(false);
                const response = await getRecentActivities();
                console.log("Activities data:", response.activities); // DEBUG
                setRecentActivities(response.activities);
            } catch (error) {
                console.error("Error fetching recent activities:", error);
                setApiError(true);
                // API fail hone par fallback activities
                setRecentActivities([
                    { type: "supervisor", text: "Added Supervisor Dr. Ali Raza", time: "1 hour ago" },
                    { type: "group", text: "Assigned Group G-106 to Supervisor", time: "Yesterday" },
                    { type: "coordinator", text: "Promoted Ms. Sana as Coordinator", time: "2 days ago" }
                ]);
            }
        };

        fetchStats();
        fetchRecentActivities(); // NEW: Call the API
    }, []);

    const statsCards = [
        { label: "Total Students", value: stats.totalStudents, icon: <FaUserGraduate />, color: "#2563eb" },
        { label: "Total Groups", value: stats.totalGroups, icon: <FaPeopleGroup />, color: "#f43f5e" },
        { label: "Total Supervisors", value: stats.totalSupervisors, icon: <FaUserPen />, color: "#16a34a" },
        { label: "Total Coordinators", value: stats.totalCoordinators, icon: <FaUserTie />, color: "#fbc73d" }
    ];

    return (
        <div className="overview-container">
            <div className="welcome-banner">
                <div className="banner-title">Admin Workspace!</div>
                <div className="banner-desc">
                    Manage admins , supervisors, coordinators, student registrations and overall FYP workflow from a single dashboard.
                </div>
                <div className="banner-meta">
                    <span>Semester: Fall 2025</span>
                    <span style={{ marginLeft: 18 }}>|</span>
                    <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="quick-links" style={{ marginTop: 20 }}>
                    <button
                        className="quick-link-btn"
                        onClick={() => onTabChange && onTabChange("Manage Supervisors")}
                    >
                        <FaUserTie /> Manage Supervisors <FaArrowRight />
                    </button>
                    <button
                        className="quick-link-btn"
                        onClick={() => onTabChange && onTabChange("Manage Project Coordinators")}
                    >
                        <FaUserTie /> Manage Coordinators <FaArrowRight />
                    </button>
                    <button
                        className="quick-link-btn"
                        onClick={() => onTabChange && onTabChange("Approved Students")}
                    >
                        <FaUserPlus /> Approve Students <FaArrowRight />
                    </button>
                </div>
            </div>

            <div className="section-chip">Overview</div>
            <div className="card-grid">
                {statsCards.map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-icon-circle" style={{background: s.color}}>{s.icon}</div>
                        <div className="stat-title">{s.label}</div>
                        <div className="stat-value">{loading ? "..." : s.value}</div>
                    </div>
                ))}
            </div>

            <div className="progress-section-gap"></div>
            <div className="section-chip">Recent Activity {apiError && "(Using Fallback Data)"}</div>
            <div className="activity-list">
                <div className="timeline">
                    {recentActivities.map((act, i) => (
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
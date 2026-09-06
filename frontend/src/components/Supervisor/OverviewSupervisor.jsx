//Supervisor Overview
import React, {useEffect, useRef, useState} from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaStar, FaArrowRight } from "react-icons/fa";
import "./OverviewSupervisor.css";
import ToastService from "../ToastService/ToastService.jsx";



export default function OverviewSupervisor({ onTabChange }) {
  const [stats, setStats] = useState({ groupsAssigned: 0, pendingProposals: 0, upcomingMeetings: 0, evaluationsDue: 0 });
  const [activitiesList, setActivitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const ranOnce = useRef(false);

  useEffect(() => {
    const fetchSupervisorData = async () => {
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');
      if (!email || !token) return;

      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/supervisor/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!statsRes.ok) {
          const errorText = await statsRes.text();
          console.error(`Stats Fetch Failed (${statsRes.status}):`, errorText);
          throw new Error(`Stats Fetch Failed: ${statsRes.status}`);
        }
        
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);

        // Fetch activities
        const actRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/supervisor/recent-activities`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (actRes.ok) {
          const actData = await actRes.json();
          if (actData.success) setActivitiesList(actData.activities);
        }

      } catch (err) {
        console.error("Error fetching supervisor data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisorData();
  }, []);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    const fetchFacultyStatus = async () => {
      const email = localStorage.getItem('email');
      if (!email) return false;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/evaluation/checkFaculty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
          }),
        });
        const data = await response.json();
        const lastSchedule = Array.isArray(data.data) ? data.data?.[data.data.length - 1] : data.data;
        const groups = data.groupsSupervised;
        if (lastSchedule && lastSchedule._id) {
          const slot = lastSchedule.slots[0];
          const slotTime = new Date(slot.startTime);
          const now = new Date();
          if (slotTime > now) {
            const msg = `You are listed as a panel member for ${
                lastSchedule.week || "this week"
            } at venue ${lastSchedule.venue || "TBD"} — be ready!`;
            ToastService.info(msg);
          }
        }
        if (groups && Array.isArray(groups)) {
          groups.forEach((group) => {
            if (group.bookedSlot) {
              const startDate = new Date(group.bookedSlot.startTime);
              const now = new Date();

              if (startDate > now) {
                const formattedGroupId = `grp-${group.displayId.slice(-5)}`;
                const endDate = new Date(group.bookedSlot.endTime);

                const timeFormatter = new Intl.DateTimeFormat('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'UTC'
                });
                const dateFormatter = new Intl.DateTimeFormat('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'UTC'
                });

                const formattedStartTime = timeFormatter.format(startDate);
                const formattedEndTime = timeFormatter.format(endDate);
                const formattedDate = dateFormatter.format(startDate).toLowerCase();

                const msg = `Your Group ${formattedGroupId} has booked a slot from ${formattedStartTime} to ${formattedEndTime} on ${formattedDate}!`;
                ToastService.success(msg);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error fetching faculty status:", error);
      }
    };

    fetchFacultyStatus();
  }, []);

  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div className="banner-title">Supervisor Workspace!</div>
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
            onClick={() => onTabChange("Idea & Proposal Review")}
          >
            <FaClipboardCheck /> Review Proposals <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("Meetings")}
          >
            <FaCalendarCheck /> Schedule Meeting <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("My Groups")}
          >
            <FaUsers /> My Groups <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="section-chip">Overview</div>
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#2563eb" }}>
            <FaUsers />
          </div>
          <div className="stat-title">Groups Assigned</div>
          <div className="stat-value">{stats.groupsAssigned}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#fbc73d" }}>
            <FaClipboardCheck />
          </div>
          <div className="stat-title">Pending Proposals</div>
          <div className="stat-value">{stats.pendingProposals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#16a34a" }}>
            <FaCalendarCheck />
          </div>
          <div className="stat-title">Upcoming Meetings</div>
          <div className="stat-value">{stats.upcomingMeetings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#f43f5e" }}>
            <FaStar />
          </div>
          <div className="stat-title">Evaluations Due</div>
          <div className="stat-value">{stats.evaluationsDue}</div>
        </div>
      </div>

      <div className="progress-section-gap"></div>
      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        <div className="progress-item-wrapper">
          <div className="progress-label">
            <span>Overall Milestone Completion</span>
            <span>{stats.milestoneProgress || 0}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.milestoneProgress || 0}%`, background: "#2563eb" }}
            />
          </div>
        </div>

        <div className="progress-item-wrapper" style={{ marginTop: 15 }}>
          <div className="progress-label">
            <span>Proposal Review Efficiency</span>
            <span>{Math.min(100, Math.round(( (stats.groupsAssigned - stats.pendingProposals) / (stats.groupsAssigned || 1) ) * 100))}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.round(( (stats.groupsAssigned - stats.pendingProposals) / (stats.groupsAssigned || 1) ) * 100))}%`, background: "#16a34a" }}
            />
          </div>
        </div>
      </div>

      <div className="progress-section-gap"></div>
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        <div className="timeline">
          {activitiesList.length > 0 ? (
            activitiesList.map((act, i) => (
              <div className="activity-item" key={i}>
                {act.text}
                <span className="time">{act.time}</span>
              </div>
            ))
          ) : (
            <div className="activity-item">No recent activity</div>
          )}
        </div>
      </div>
      <div className="fyp-tip">
        <span role="img" aria-label="bulb">
          💡
        </span>
        <span>
          FYP Tip: Giving clear, constructive feedback helps students deliver high
          quality projects!
        </span>
      </div>
    </div>
  );
}

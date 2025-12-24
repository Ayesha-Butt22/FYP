import React, { useEffect, useRef, useState } from "react";
import {
  FaUsers,
  FaClipboardCheck,
  FaCalendarCheck,
  FaStar,
  FaArrowRight,
} from "react-icons/fa";
import "./OverviewSupervisor.css";
import ToastService from "../ToastService/ToastService.jsx";

export default function OverviewSupervisor({ onTabChange }) {
  const ranOnce = useRef(false);

  /* -------------------- COUNTS -------------------- */
  const [stats, setStats] = useState({
    groups: 0,
    pendingProposals: 0,
    meetings: 0,
    evaluations: 1, // static (jab tak API nahi)
  });

  /* -------------------- EXISTING TOAST LOGIC -------------------- */
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const fetchFacultyStatus = async () => {
      const email = localStorage.getItem("email");
      if (!email) return;

      try {
        const response = await fetch(
          "http://localhost:5000/api/evaluation/checkFaculty",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );

        const data = await response.json();
        const lastSchedule = data.data?.[data.data.length - 1];
        const groups = data.groupsSupervised;

        if (lastSchedule?._id) {
          const slot = lastSchedule.slots[0];
          const slotTime = new Date(slot.startTime);
          const now = new Date();

          if (slotTime > now) {
            ToastService.info(
              `You are listed as a panel member for ${
                lastSchedule.week || "this week"
              } at venue ${lastSchedule.venue || "TBD"}`
            );
          }
        }

        if (Array.isArray(groups)) {
          groups.forEach((group) => {
            if (group.bookedSlot) {
              const startDate = new Date(group.bookedSlot.startTime);
              if (startDate > new Date()) {
                ToastService.success(
                  `Group ${group.displayId} has an upcoming meeting`
                );
              }
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchFacultyStatus();
  }, []);

  /* -------------------- NEW DASHBOARD APIs -------------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchDashboardCounts = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [proposalRes, groupRes, meetingRes] = await Promise.all([
          fetch("http://localhost:5000/api/proposals/pending", { headers }),
          fetch("http://localhost:5000/api/supervisor/my-groups", { headers }),
          fetch("http://localhost:5000/api/meetings/upcoming", { headers }),
        ]);

        const proposals = await proposalRes.json();
        const groups = await groupRes.json();
        const meetings = await meetingRes.json();

        setStats({
          groups: groups?.length || 0,
          pendingProposals: proposals?.length || 0,
          meetings: meetings?.length || 0,
          evaluations: 1,
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      }
    };

    fetchDashboardCounts();
  }, []);

  /* -------------------- UI -------------------- */
  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <div className="banner-title">Supervisor Workspace!</div>
        <div className="banner-desc">
          Stay on top of your assigned FYP groups, review proposals, track
          progress, schedule meetings, and manage evaluations — all in one place.
        </div>
        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>
            Date: {new Date().toLocaleDateString()}
          </span>
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
          <div className="stat-value">{stats.groups}</div>
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
          <div className="stat-value">{stats.meetings}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#f43f5e" }}>
            <FaStar />
          </div>
          <div className="stat-title">Evaluations Due</div>
          <div className="stat-value">{stats.evaluations}</div>
        </div>
      </div>

      <div className="fyp-tip">
        💡 Giving timely feedback improves proposal quality and reduces rework.
      </div>
    </div>
  );
}

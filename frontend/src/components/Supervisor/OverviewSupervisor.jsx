//Supervisor Overview
import React, {useEffect, useRef, useState} from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaStar, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./OverviewSupervisor.css";
import ToastService from "../ToastService/ToastService.jsx";

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

export default function OverviewSupervisor({ onTabChange }) {
  const ranOnce = useRef(false);
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    const fetchFacultyStatus = async () => {
      const email = localStorage.getItem('email');
      if (!email) return false;
      try {
        const response = await fetch(`http://localhost:5000/api/evaluation/checkFaculty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
          }),
        });
        const data = await response.json();
        const lastSchedule = data.data?.[data.data.length - 1];
        const groups = data.groupsSupervised;
        if (lastSchedule._id) {
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
              } else {
                console.log(
                    `Skipping toast for ${group.displayId}: slot has already passed.`
                );
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
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#fbc73d" }}>
            <FaClipboardCheck />
          </div>
          <div className="stat-title">Pending Proposals</div>
          <div className="stat-value">2</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#16a34a" }}>
            <FaCalendarCheck />
          </div>
          <div className="stat-title">Upcoming Meetings</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#f43f5e" }}>
            <FaStar />
          </div>
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
              <div
                className="progress-fill"
                style={{ width: `${p.percent}%`, background: p.color }}
              />
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

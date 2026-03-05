// OverviewStudent.jsx
import React, { useEffect, useState } from "react";
import {
  FaUsers, FaClipboardCheck, FaCalendarCheck, FaCheckCircle,
  FaStar, FaArrowRight, FaBookOpen, FaTasks, FaLightbulb,
} from "react-icons/fa";
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StudentWhiteboard from "./StudentWhiteboard";
import "./OverviewStudent.css";
import ToastService from "../ToastService/ToastService.jsx";
import SlotBookingModal from "./Modal/SlotsBookingModal.jsx";
import styled, { css, keyframes } from "styled-components";

const BASE_URL = "http://localhost:5000/api";

// ─── Token helper ─────────────────────────────
const getToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  if (direct) return direct;
  for (const key of ["user", "auth", "userData", "currentUser"]) {
    try {
      const obj = JSON.parse(localStorage.getItem(key) || "{}");
      const tok = obj?.token || obj?.accessToken || obj?.data?.token || obj?.user?.token;
      if (tok) return tok;
    } catch {}
  }
  return "";
};

const authFetch = (path) =>
  fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

// ─── Glow animation ───────────────────────────
const glow = keyframes`
  0%   { box-shadow: 0 0 5px #2196f3, 0 0 10px #2196f3, 0 0 20px #2196f3; transform: scale(1); }
  50%  { box-shadow: 0 0 20px #64b5f6, 0 0 40px #2196f3, 0 0 60px #1976d2; transform: scale(1.1); }
  100% { box-shadow: 0 0 5px #2196f3, 0 0 10px #2196f3, 0 0 20px #2196f3; transform: scale(1); }
`;
const GlowingIconWrapper = styled.div`
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
  ${(props) => props.glow && css`animation: ${glow} 1.5s infinite;`}
`;

// ─── Time ago ─────────────────────────────────
function getTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs  / 24);
  if (days === 1) return "Yesterday";
  if (days > 1)  return `${days} days ago`;
  if (hrs  > 0)  return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  if (mins > 0)  return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "Just now";
}

// ─── Skeleton ─────────────────────────────────
function Skeleton({ height = 18, width = "100%", radius = 8 }) {
  return (
    <div style={{
      height, width, borderRadius: radius, marginBottom: 10,
      background: "linear-gradient(90deg,#e0e7ef 25%,#f0f4fa 50%,#e0e7ef 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ─── Main ─────────────────────────────────────
export default function OverviewStudent({ onTabChange }) {
  const studentEmail = localStorage.getItem("email");

  const [whiteboardOpen,      setWhiteboardOpen]      = useState(false);
  const [slotModalOpen,       setSlotModalOpen]        = useState(false);
  const [availableSlots,      setAvailableSlots]       = useState([]);
  const [hasNewNotification,  setHasNewNotification]   = useState(true);

  // ── data state ──
  const [group,      setGroup]      = useState(null);
  const [proposal,   setProposal]   = useState(null);
  const [meetings,   setMeetings]   = useState([]);
  const [templates,  setTemplates]  = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  // ── fetch all data ──
  useEffect(() => {
    const IsApproved = localStorage.getItem("IsApproved");
    if (IsApproved !== "true") {
      ToastService.error("Your account is not approved yet contact admin...Logging out");
      setTimeout(() => { localStorage.clear(); window.location.href = "/auth"; }, 3000);
      return;
    }

    if (!studentEmail) return;

    // slot booking check
    const checkSlotBooking = async () => {
      try {
        const res  = await fetch(`${BASE_URL}/deadlineSchedule/getSlots/${studentEmail}`);
        const data = await res.json();
        if (!data.success) return;

        if (!data.alreadyBooked && data.availableSlots?.length > 0) {
          const lastSlot = data.availableSlots[data.availableSlots.length - 1];
          if (new Date(lastSlot.startTime) < new Date()) return;
        }

        if (!data.alreadyBooked && data.availableSlots?.length > 0) {
          ToastService.info("Please Book a slot");
          setAvailableSlots(data);
          setSlotModalOpen(true);
        }
        if (data.alreadyBooked && data.details) {
          ToastService.success(
            `Your slot is booked for ${data.details?.week || "this week"} at venue ${data.details?.venue || "TBD"} — be ready!`
          );
        }
      } catch (err) {
        console.error("Slot check error:", err);
      }
    };

    checkSlotBooking();

    const loadData = async () => {
      try {
        setLoading(true);

        // ── 1. Group ──
        let grp = null;
        try {
          const gRes  = await authFetch(`/groups/by-email/${studentEmail}`);
          const gData = await gRes.json();
          grp = gRes.ok && gData?._id ? gData : null;
          setGroup(grp);
        } catch (e) { console.error("Group fetch error:", e); }

        if (grp?._id) {
          // ── 2. Proposal ──
          try {
            const pRes  = await fetch(`${BASE_URL}/proposals/${grp._id}`);
            const pData = await pRes.json();
            // Backend returns array — take latest
            if (Array.isArray(pData) && pData.length > 0) {
              setProposal(pData[pData.length - 1]);
            } else if (pData && !Array.isArray(pData) && pData._id) {
              setProposal(pData);
            }
          } catch (e) { console.error("Proposal fetch error:", e); }

          // ── 3. Templates ──
          // Backend: GET /api/student-templates/group/:groupId
          // Response: { success, data: [ { templateCode, status, uploadedAt, ... } ] }
          try {
            const tRes  = await authFetch(`/student-templates/group/${grp._id}`);
            const tData = await tRes.json();
            if (tData.success) setTemplates(tData.data || []);
          } catch (e) { console.error("Templates fetch error:", e); }
        }

        // ── 4. Meetings ──
        // Backend: GET /api/meetings/student/:email
        // Response: { success, meetings: [ { date, time, status(1=booked,2=done), ... } ] }
        try {
          const mRes  = await fetch(`${BASE_URL}/meetings/student/${studentEmail}`);
          const mData = await mRes.json();
          if (mData.success) setMeetings(mData.meetings || []);
        } catch (e) { console.error("Meetings fetch error:", e); }

        // ── 5. Tasks assigned to me ──
        // Backend: GET /api/tasks (protect - returns tasks assigned to logged-in user)
        // Response: { success, tasks: [ { id, title, status, progress, createDate, ... } ] }
        try {
          const tkRes  = await authFetch(`/tasks`);
          const tkData = await tkRes.json();
          if (tkData.success) setTasks(tkData.tasks || []);
        } catch (e) { console.error("Tasks fetch error:", e); }

      } catch (err) {
        console.error("Overview data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentEmail]);

  // ── Derived values ──────────────────────────

  // Group status
  const groupStatus = group
    ? (group.member2?.email || group.member3?.email ? "Active" : "Solo")
    : "Not Created";

  // Proposal status label
  // Backend status: 0=Pending, 1=Under Review (Supervisor Approved), 2=Rejected, 3=Rejected
  const proposalStatusMap = {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
    3: "Rejected",
  };
  const proposalLabel = proposal
    ? proposalStatusMap[proposal.projectStatus] ?? "Submitted"
    : "Not Submitted";

  // Next meeting — status 1 = booked (not done yet)
  // No future-date filter — show latest booked meeting regardless of time
  const upcomingMeetings = meetings
    .filter((m) => m.status === 1)
    .sort((a, b) => {
      const aDate = new Date(`${a.date || ""}T${a.time || "00:00"}`);
      const bDate = new Date(`${b.date || ""}T${b.time || "00:00"}`);
      return aDate - bDate;
    });
  const nextMeeting = upcomingMeetings[0];
  const nextMeetingLabel = nextMeeting
    ? (() => {
        const d = new Date(`${nextMeeting.date}T${nextMeeting.time || "00:00"}`);
        return isNaN(d.getTime())
          ? nextMeeting.date
          : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      })()
    : "None";

  // Templates progress — backend stores templateCode like "t01","t02"...t09
  // total expected = 9 templates (t01-t09)
  const totalTemplates    = 9;
  const uploadedTemplates = templates.filter(
    (t) => t.status === "Approved" || t.status === "Submitted" || t.status === "Pending Review"
  ).length;

  // Tasks progress — backend returns { status: "Pending"/"In Progress"/"Completed", progress: 0-100 }
  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "Completed" || t.progress === 100
  ).length;
  const taskLabel = totalTasks > 0 ? `${completedTasks}/${totalTasks}` : "0/0";

  // Meetings attended (status=2 means done)
  const attendedMeetings = meetings.filter((m) => m.status === 2).length;

  // Proposal progress percent
  const proposalProgressPct = proposal
    ? proposal.projectStatus === 1 ? 100   // approved
    : proposal.projectStatus === 0 ? 40    // pending
    : proposal.projectStatus === 2 ? 10    // rejected
    : 10
    : 0;

  // Progress bars
  const progressBars = [
    {
      label:   `Templates Uploaded (${uploadedTemplates}/${totalTemplates})`,
      percent: totalTemplates > 0 ? Math.round((uploadedTemplates / totalTemplates) * 100) : 0,
      color:   "#2563eb",
    },
    {
      label:   `Tasks Completed (${completedTasks}/${totalTasks || 0})`,
      percent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      color:   "#fbc73d",
    },
    {
      label:   `Meetings Attended (${attendedMeetings}/${meetings.length || 0})`,
      percent: meetings.length > 0 ? Math.round((attendedMeetings / meetings.length) * 100) : 0,
      color:   "#16a34a",
    },
    {
      label:   `Proposal: ${proposalLabel}`,
      percent: proposalProgressPct,
      color:   proposal?.projectStatus === 1 ? "#16a34a"
             : proposal?.projectStatus === 2 || proposal?.projectStatus === 3 ? "#ef4444"
             : "#f43f5e",
    },
  ];

  // ── Recent Activity (last 3 real actions) ──
  const activityItems = [];

  // Tasks (most recent first)
  tasks.slice(0, 3).forEach((t) => {
    activityItems.push({
      text:     `Task "${(t.title || "Untitled").slice(0, 35)}" — ${t.status || "Pending"}`,
      date:     t.createDate || t.createdAt,
      sortDate: new Date(t.createDate || t.createdAt || 0).getTime(),
    });
  });

  // Meetings
  meetings.slice(0, 3).forEach((m) => {
    const label =
      m.status === 2 ? "Meeting attended" :
      m.status === 1 ? "Meeting booked" :
      "Meeting slot available";
    activityItems.push({
      text:     `${label} on ${m.date || ""}`,
      date:     m.createdAt || m.date,
      sortDate: new Date(m.createdAt || m.date || 0).getTime(),
    });
  });

  // Proposal
  if (proposal) {
    activityItems.push({
      text:     `Proposal "${(proposal.projectTitle || "Untitled").slice(0, 32)}" — ${proposalLabel}`,
      date:     proposal.updatedAt || proposal.createdAt,
      sortDate: new Date(proposal.updatedAt || proposal.createdAt || 0).getTime(),
    });
  }

  // Templates (most recent uploads)
  templates.slice(0, 2).forEach((t) => {
    activityItems.push({
      text:     `Template ${(t.templateCode || "").toUpperCase()} uploaded — ${t.status || ""}`,
      date:     t.uploadedAt,
      sortDate: new Date(t.uploadedAt || 0).getTime(),
    });
  });

  // Sort newest first → take 3
  const recentActivity = activityItems
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 3);

  return (
    <div className="overview-container">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      {/* ── Banner ── */}
      <div className="welcome-banner">
        <Tooltip title="Read instructions from supervisor" arrow>
          <button
            aria-label="Supervisor Notes"
            className="whiteboard-fab"
            onClick={() => { setWhiteboardOpen(true); setHasNewNotification(false); }}
          >
            <GlowingIconWrapper glow={hasNewNotification}>
              <FaBookOpen />
            </GlowingIconWrapper>
          </button>
        </Tooltip>

        <div className="banner-title">Student Workspace!</div>
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
          <button className="quick-link-btn" onClick={() => onTabChange("My Group")}>
            <FaUsers /> My Group <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange("Idea & Proposal")}>
            <FaClipboardCheck /> Submit Proposal <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange("Selected supervisor")}>
            <FaStar /> Supervisor <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange("Tasks")}>
            <FaTasks /> Tasks <FaArrowRight />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="section-chip">Overview</div>
      <div className="card-grid">
        {loading ? (
          [1,2,3,4].map((i) => (
            <div className="stat-card" key={i}>
              <Skeleton height={52} width={52} radius={50} />
              <Skeleton height={16} width="55%" />
              <Skeleton height={28} width="40%" />
            </div>
          ))
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon-circle" style={{ background: "#2563eb" }}><FaUsers /></div>
              <div className="stat-title">Group Status</div>
              <div className="stat-value-studentonly">{groupStatus}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-circle" style={{ background: "#fbc73d" }}><FaClipboardCheck /></div>
              <div className="stat-title">Proposal</div>
              <div className="stat-value-studentonly">{proposalLabel}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-circle" style={{ background: "#16a34a" }}><FaCalendarCheck /></div>
              <div className="stat-title">Next Meeting</div>
              <div className="stat-value-studentonly">{nextMeetingLabel}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-circle" style={{ background: "#f43f5e" }}><FaTasks /></div>
              <div className="stat-title">Tasks</div>
              <div className="stat-value-studentonly">{taskLabel}</div>
            </div>
          </>
        )}
      </div>

      {/* ── Progress Overview ── */}
      <div className="progress-section-gap" />
      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        {loading ? (
          [1,2,3,4].map((i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <Skeleton height={14} width="50%" />
              <Skeleton height={18} />
            </div>
          ))
        ) : (
          progressBars.map((p, i) => (
            <div key={i}>
              <div className="progress-label">
                <span>{p.label}</span>
                <span>{p.percent}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${p.percent}%`, background: p.color }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Recent Activity ── */}
      <div className="progress-section-gap" />
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        {loading ? (
          [1,2,3].map((i) => <div key={i} style={{ marginBottom: 14 }}><Skeleton height={16} /></div>)
        ) : recentActivity.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "1rem", padding: "12px 0" }}>
            Abhi koi activity nahi hai.
          </p>
        ) : (
          <div className="timeline">
            {recentActivity.map((act, i) => (
              <div className="activity-item" key={i}>
                {act.text}
                <span className="time">{getTimeAgo(act.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tip ── */}
      <div className="fyp-tip">
        <FaLightbulb style={{ color: "#ffbf00" }} />
        <span>Tip: Complete your checklist and upload all templates before final submission!</span>
      </div>

      {/* ── Whiteboard Dialog ── */}
      <Dialog
        open={whiteboardOpen}
        onClose={() => setWhiteboardOpen(false)}
        fullWidth maxWidth="md"
        aria-labelledby="supervisor-notes-dialog"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
          <span style={{ fontWeight: 800, color: "#01337a" }}>Supervisor Instructions</span>
          <IconButton aria-label="close" onClick={() => setWhiteboardOpen(false)} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <StudentWhiteboard />
        </DialogContent>
      </Dialog>

      {/* ── Slot Booking Modal ── */}
      {slotModalOpen && (
        <SlotBookingModal
          open={slotModalOpen}
          onClose={() => setSlotModalOpen(false)}
          slots={availableSlots.availableSlots}
          groupId={availableSlots.groupId}
          scheduleId={availableSlots.scheduleId}
          data={availableSlots.wholeData}
        />
      )}
    </div>
  );
}
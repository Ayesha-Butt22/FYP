// OverviewSupervisor.jsx - Backend Connected
import React, { useEffect, useRef, useState } from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaStar, FaArrowRight } from "react-icons/fa";
import "./OverviewSupervisor.css";
import ToastService from "../ToastService/ToastService.jsx";

const BASE_URL = "http://localhost:5000/api";

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

function getTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days > 1)  return `${days} days ago`;
  if (hrs  > 0)  return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  if (mins > 0)  return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "Just now";
}

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

export default function OverviewSupervisor({ onTabChange }) {
  const ranOnce = useRef(false);
  const supervisorEmail = localStorage.getItem("email");

  // ── State ──
  // groups: from GET /api/supervisor/my-groups
  //   { success, groups: [{ _id, groupId, title, proposalStatus, members[], proposalId, ... }] }
  const [groups,    setGroups]    = useState([]);

  // meetings: from GET /api/meetings/supervisor/:email
  //   { success, futureSlots, todayMeetings, history }
  //   todayMeetings = status===1 AND date>=today  ← upcoming booked meetings
  const [meetings,  setMeetings]  = useState([]);

  // proposals: from GET /api/proposals/supervisor
  //   { success, data: [{ projectStatus(0=pending,1=approved,2=rejected), groupId, projectTitle, updatedAt }] }
  const [proposals, setProposals] = useState([]);

  // templates/submissions: from GET /api/supervisor/group/:groupId/submissions per group
  //   { submissions: [{ templateCode, status("Pending Review"/"Approved"/"Rejected"), uploadedAt }] }
  const [templates, setTemplates] = useState([]);

  const [loading, setLoading] = useState(true);

  // ── Existing toast logic (untouched) ──
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    const fetchFacultyStatus = async () => {
      const email = localStorage.getItem("email");
      if (!email) return;
      try {
        const response = await fetch(`${BASE_URL}/evaluation/checkFaculty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        const lastSchedule = data.data?.[data.data.length - 1];
        const grps = data.groupsSupervised;
        if (lastSchedule?._id) {
          const slot = lastSchedule.slots?.[0];
          if (slot && new Date(slot.startTime) > new Date()) {
            ToastService.info(
              `You are listed as a panel member for ${lastSchedule.week || "this week"} at venue ${lastSchedule.venue || "TBD"} — be ready!`
            );
          }
        }
        if (grps && Array.isArray(grps)) {
          grps.forEach((group) => {
            if (group.bookedSlot) {
              const startDate = new Date(group.bookedSlot.startTime);
              if (startDate > new Date()) {
                const formattedGroupId = `grp-${group.displayId?.slice(-5)}`;
                const endDate = new Date(group.bookedSlot.endTime);
                const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
                const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
                ToastService.success(
                  `Your Group ${formattedGroupId} has booked a slot from ${timeFormatter.format(startDate)} to ${timeFormatter.format(endDate)} on ${dateFormatter.format(startDate).toLowerCase()}!`
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

  // ── Fetch all data ──
  useEffect(() => {
    if (!supervisorEmail) return;

    const loadData = async () => {
      setLoading(true);
      let fetchedGroups = [];

      try {
        // ── 1. Groups ──
        // GET /api/supervisor/my-groups  (protect + isSupervisor)
        // supervisorController.getSupervisorGroupsWithDetails
        // Finds proposals where projectSupervisor===email, populates groupId
        // Returns groups with members, proposalStatus, title, _id
        try {
          const res  = await authFetch("/supervisor/my-groups");
          const data = await res.json();
          if (data.success) {
            fetchedGroups = data.groups || [];
            setGroups(fetchedGroups);
          }
        } catch (e) { console.error("Groups fetch error:", e); }

        // ── 2. Meetings ──
        // GET /api/meetings/supervisor/:email  (no auth needed)
        // meetingController.getSupervisorMeetings
        // Returns: { futureSlots, todayMeetings, history }
        // todayMeetings = status===1 (booked) AND date>=today  ← UPCOMING
        try {
          const res  = await fetch(`${BASE_URL}/meetings/supervisor/${supervisorEmail}`);
          const data = await res.json();
          if (data.success) {
            setMeetings(data.todayMeetings || []);
          }
        } catch (e) { console.error("Meetings fetch error:", e); }

        // ── 3. Proposals ──
        // GET /api/proposals/supervisor  (protect + isSupervisor)
        // studentproposalController.getMyProposals
        // Returns all proposals where projectSupervisor===email
        // projectStatus: 0=Pending, 1=Approved, 2=Rejected
        try {
          const res  = await authFetch("/proposals/supervisor");
          const data = await res.json();
          if (data.success) setProposals(data.data || []);
        } catch (e) { console.error("Proposals fetch error:", e); }

        // ── 4. Submissions (per group) ──
        // GET /api/supervisor/group/:groupId/submissions  (no auth)
        // supervisorController.getGroupSubmission: Template.find({groupId})
        // groupId in DB is ObjectId → use g._id (MongoDB _id)
        // Returns { submissions: [{ templateCode, status, supervisorRemarks, uploadedAt }] }
        // status values: "Pending Review" / "Approved" / "Rejected" / "Submitted"
        if (fetchedGroups.length > 0) {
          const allSubs = [];
          await Promise.all(
            fetchedGroups.map(async (g) => {
              try {
                // g._id is the MongoDB ObjectId of the group document
                const groupMongoId = g._id;
                const res  = await fetch(`${BASE_URL}/supervisor/group/${groupMongoId}/submissions`);
                const data = await res.json();
                console.log(`Submissions for group ${groupMongoId}:`, data);
                if (Array.isArray(data.submissions)) {
                  data.submissions.forEach((s) =>
                    allSubs.push({ ...s, _groupId: groupMongoId, _groupTitle: g.title })
                  );
                }
              } catch (e) {
                console.error("Submission fetch error for group:", g._id, e);
              }
            })
          );
          console.log("All submissions fetched:", allSubs);
          setTemplates(allSubs);
        }

      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supervisorEmail]);

  // ─── Derived Stats ────────────────────────────────────────────────────────

  // 1. Groups Assigned = total groups from /supervisor/my-groups
  const totalGroups = groups.length;

  // 2. Pending Proposals
  //    = proposals jinka projectStatus === 0 (submitted lekin supervisor ne review nahi kiya)
  const pendingProposals = proposals.filter((p) => p.projectStatus === 0).length;

  // 3. Upcoming Meetings
  //    = todayMeetings (status===1, date>=today) — already filtered in meetingController
  const upcomingMeetings = meetings.length;

  // 4. Evaluations Due
  //    = templates jinka status "Pending Review" ya "Submitted" hai
  //    Matlab student ne upload kiya lekin supervisor ne abhi approve/reject nahi kiya
  const evaluationsDue = templates.filter(
    (t) =>
      t.status === "Under Review" ||
      t.status === "Pending Review" ||
      t.status === "Submitted" ||
      t.status === "submitted" ||
      t.status === "pending"
  ).length;

  // ─── Progress Bars ────────────────────────────────────────────────────────

  const totalProposals    = proposals.length;
  const reviewedProposals = proposals.filter((p) => p.projectStatus === 1 || p.projectStatus === 2).length;
  const proposalPct       = totalProposals > 0 ? Math.round((reviewedProposals / totalProposals) * 100) : 0;

  const meetingsPct = totalGroups > 0
    ? Math.min(Math.round((upcomingMeetings / totalGroups) * 100), 100)
    : 0;

  const totalSubs    = templates.length;
  const approvedSubs = templates.filter((t) => t.status === "Approved" || t.status === "approved").length;
  const evalPct      = totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0;

  const progressBars = [
    { label: `Proposal Reviews (${reviewedProposals}/${totalProposals})`, percent: proposalPct,  color: "#2563eb" },
    { label: `Meetings Booked (${upcomingMeetings} upcoming)`,            percent: meetingsPct,  color: "#fbc73d" },
    { label: `Evaluations Done (${approvedSubs}/${totalSubs})`,           percent: evalPct,      color: "#16a34a" },
  ];

  // ─── Recent Activity ──────────────────────────────────────────────────────
  const activityItems = [];

  proposals.slice(0, 3).forEach((p) => {
    const statusLabel =
      p.projectStatus === 0 ? "Pending Review" :
      p.projectStatus === 1 ? "Approved" : "Rejected";
    const grpLabel = p.groupId?.groupId
      ? `group-${String(p.groupId.groupId).slice(-5)}`
      : "a group";
    activityItems.push({
      text:     `Proposal of ${grpLabel} — ${statusLabel}`,
      date:     p.updatedAt || p.createdAt,
      sortDate: new Date(p.updatedAt || p.createdAt || 0).getTime(),
    });
  });

  meetings.slice(0, 2).forEach((m) => {
    activityItems.push({
      text:     `Meeting booked on ${m.date || ""} at ${m.time || ""}`,
      date:     m.createdAt,
      sortDate: new Date(m.createdAt || 0).getTime(),
    });
  });

  templates
    .filter((t) => t.status === "Approved" || t.status === "Rejected")
    .slice(0, 2)
    .forEach((t) => {
      activityItems.push({
        text:     `Template ${(t.templateCode || "").toUpperCase()} ${t.status}`,
        date:     t.uploadedAt || t.updatedAt,
        sortDate: new Date(t.uploadedAt || t.updatedAt || 0).getTime(),
      });
    });

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
          <button className="quick-link-btn" onClick={() => onTabChange("Idea & Proposal Review")}>
            <FaClipboardCheck /> Review Proposals <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange("Meetings")}>
            <FaCalendarCheck /> Schedule Meeting <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange("My Groups")}>
            <FaUsers /> My Groups <FaArrowRight />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="section-chip">Overview</div>
      <div className="card-grid">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
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
              <div className="stat-title">Groups Assigned</div>
              <div className="stat-value">{totalGroups}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-circle" style={{ background: "#fbc73d" }}><FaClipboardCheck /></div>
              <div className="stat-title">Pending Proposals</div>
              <div className="stat-value">{pendingProposals}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-circle" style={{ background: "#16a34a" }}><FaCalendarCheck /></div>
              <div className="stat-title">Upcoming Meetings</div>
              <div className="stat-value">{upcomingMeetings}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-circle" style={{ background: "#f43f5e" }}><FaStar /></div>
              <div className="stat-title">Evaluations Due</div>
              <div className="stat-value">{evaluationsDue}</div>
            </div>
          </>
        )}
      </div>

      {/* ── Progress Overview ── */}
      <div className="progress-section-gap"></div>
      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        {loading ? (
          [1, 2, 3].map((i) => (
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
      <div className="progress-section-gap"></div>
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 14 }}><Skeleton height={16} /></div>
          ))
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
        <span role="img" aria-label="bulb">💡</span>
        <span>FYP Tip: Giving clear, constructive feedback helps students deliver high quality projects!</span>
      </div>
    </div>
  );
}
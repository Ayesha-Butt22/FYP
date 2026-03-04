import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaClipboardCheck,
  FaCalendarCheck,
  FaStar,
  FaArrowRight,
  FaUserTie,
  FaLayerGroup,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
} from "react-icons/fa";
import "./OverviewCoordinator.css";

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

// ─── Time ago ─────────────────────────────────
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

// ─── Build last 3 activities in timeline style ─
function buildActivity(groups) {
  const all = [];

  groups.forEach((g) => {
    const proposals = g.proposals || [];

    if (proposals.length === 0) {
      all.push({
        sortDate: new Date(g.createdAt || 0).getTime(),
        text: `New group registered: ${g.groupId || "—"}`,
        time: getTimeAgo(g.createdAt),
      });
    } else {
      const latest   = proposals[proposals.length - 1];
      const status   = latest?.projectStatus;
      const title    = latest?.projectTitle || "Untitled";
      const short    = title.length > 32 ? title.slice(0, 32) + "…" : title;
      const actDate  = latest?.updatedAt || latest?.createdAt || g.updatedAt || g.createdAt;

      const actionMap = {
        0: `Proposal submitted: ${short}`,
        1: `Proposal under review: ${short}`,
        2: `Approved proposal: ${short}`,
        3: `Rejected proposal: ${short}`,
      };

      all.push({
        sortDate: new Date(actDate || 0).getTime(),
        text: actionMap[status] ?? `Proposal updated: ${short}`,
        time: getTimeAgo(actDate),
      });
    }
  });

  return all
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 3);
}

// ─── Sub-components ───────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-circle" style={{ background: color }}>{icon}</div>
      <div className="stat-title">{label}</div>
      <div className="stat-value">{value ?? "—"}</div>
    </div>
  );
}

function ProgressBar({ label, percent, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div className="progress-label">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
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

// ─── Main ─────────────────────────────────────
export default function OverviewCoordinator({ onTabChange }) {
  const [statsData,     setStatsData]     = useState(null);
  const [groupsData,    setGroupsData]    = useState(null);
  const [supervisors,   setSupervisors]   = useState(null);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSup,    setLoadingSup]    = useState(true);
  const [apiErrors,     setApiErrors]     = useState({});

  useEffect(() => {
    authFetch("/admin/stats")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d.success) setStatsData(d.stats); })
      .catch((e) => setApiErrors((p) => ({ ...p, Stats: e.message })))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    authFetch("/groupsinfo/info")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d.success) setGroupsData(d.data || []); })
      .catch((e) => { setApiErrors((p) => ({ ...p, Groups: e.message })); setGroupsData([]); })
      .finally(() => setLoadingGroups(false));
  }, []);

  useEffect(() => {
    authFetch("/admin/supervisors-for-coordinator")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d.success) setSupervisors(d.data || []); })
      .catch((e) => { setApiErrors((p) => ({ ...p, Supervisors: e.message })); setSupervisors([]); })
      .finally(() => setLoadingSup(false));
  }, []);

  const groups = groupsData  || [];
  const sups   = supervisors || [];

  const totalGroups   = statsData?.totalGroups       ?? groups.length;
  const totalStudents = statsData?.totalStudents     ?? "—";
  const totalSups     = statsData?.totalSupervisors  ?? sups.length;
  const totalCoords   = statsData?.totalCoordinators ?? "—";

  const approvedCount = groups.filter((g) => (g.proposals||[]).at?.(-1)?.projectStatus === 2).length;
  const pendingCount  = groups.filter((g) => !(g.proposals||[]).length || (g.proposals||[]).at?.(-1)?.projectStatus === 0).length;
  const rejectedCount = groups.filter((g) => (g.proposals||[]).at?.(-1)?.projectStatus === 3).length;

  const total       = groups.length || 1;
  const approvedPct = Math.round((approvedCount / total) * 100);
  const pendingPct  = Math.round((pendingCount  / total) * 100);
  const supAllocPct = sups.length
    ? Math.round((sups.filter((s) => (s.bookedSlots||0) > 0).length / sups.length) * 100)
    : 0;

  const recentActivity = buildActivity(groups);
  const hasError = Object.keys(apiErrors).length > 0;

  return (
    <div className="overview-container">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .chip-row {
          display: flex; gap: 12px; flex-wrap: wrap;
          margin: 14px auto 20px auto;
          width: 100%; max-width: 1120px;
        }
        .chip {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 20px;
          font-size: 13px; font-weight: 700;
        }
        .chip-approved { background: #dcfce7; color: #15803d; }
        .chip-pending  { background: #fef9c3; color: #b45309; }
        .chip-rejected { background: #fee2e2; color: #b91c1c; }
        .api-error-box {
          background: #fff1f2; border: 1px solid #fca5a5;
          color: #b91c1c; border-radius: 10px;
          padding: 10px 16px; font-size: 13px;
          margin: 8px auto 12px auto;
          width: 100%; max-width: 1120px;
        }
        .no-activity { color: #94a3b8; font-size: 1rem; padding: 12px 0; }
      `}</style>

      {/* ── Banner ── */}
      <div className="welcome-banner">
        <div className="banner-title">Coordinator Workspace!</div>
        <div className="banner-desc">
          Oversee your department's FYP activity — review proposals, set
          deadlines, assign supervisors and monitor progress.
        </div>
        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="quick-links">
          <button className="quick-link-btn" onClick={() => onTabChange?.("Idea & Proposal Review")}>
            <FaClipboardCheck /> Review Proposals <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange?.("Manage Deadlines")}>
            <FaCalendarCheck /> Manage Deadlines <FaArrowRight />
          </button>
          <button className="quick-link-btn" onClick={() => onTabChange?.("Supervisor Allocation")}>
            <FaUserTie /> Allocate Supervisors <FaArrowRight />
          </button>
        </div>
      </div>

      {/* ── Errors ── */}
      {hasError && (
        <div className="api-error-box">
          {Object.entries(apiErrors).map(([k, v]) => (
            <div key={k}>⚠️ <strong>{k}:</strong> {v}</div>
          ))}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="section-chip">Overview</div>
      <div className="card-grid">
        {loadingStats || loadingGroups ? (
          [1,2,3,4].map((i) => (
            <div className="stat-card" key={i}>
              <Skeleton height={56} width={56} radius={50} />
              <Skeleton height={18} width="60%" />
              <Skeleton height={36} width="40%" />
            </div>
          ))
        ) : (
          <>
            <StatCard icon={<FaLayerGroup />} label="Total Groups"   value={totalGroups}   color="#2563eb" />
            <StatCard icon={<FaUsers />}       label="Total Students" value={totalStudents}  color="#7c3aed" />
            <StatCard icon={<FaUserTie />}     label="Supervisors"    value={totalSups}      color="#16a34a" />
            <StatCard icon={<FaStar />}         label="Coordinators"   value={totalCoords}    color="#f43f5e" />
          </>
        )}
      </div>

      {/* ── Proposal Chips ── */}
      {!loadingGroups && groups.length > 0 && (
        <div className="chip-row">
          <div className="chip chip-approved"><FaCheckCircle /> Approved: {approvedCount}</div>
          <div className="chip chip-pending"><FaHourglassHalf /> Pending: {pendingCount}</div>
          <div className="chip chip-rejected"><FaTimesCircle /> Rejected: {rejectedCount}</div>
        </div>
      )}

      {/* ── Progress ── */}
      <div className="progress-section-gap" />
      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        {loadingGroups || loadingSup ? (
          [1,2,3].map((i) => (
            <div key={i} style={{ marginBottom: 22 }}>
              <Skeleton height={14} width="50%" />
              <Skeleton height={18} />
            </div>
          ))
        ) : (
          <>
            <ProgressBar label="Proposals Approved"    percent={approvedPct} color="#16a34a" />
            <ProgressBar label="Proposals Pending"     percent={pendingPct}  color="#f59e0b" />
            <ProgressBar label="Supervisor Allocation" percent={supAllocPct} color="#2563eb" />
          </>
        )}
      </div>

      {/* ── Recent Activity — timeline style like image ── */}
      <div className="progress-section-gap" />
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        {loadingGroups ? (
          [1,2,3].map((i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <Skeleton height={16} />
            </div>
          ))
        ) : recentActivity.length === 0 ? (
          <p className="no-activity">Abhi koi activity nahi hai.</p>
        ) : (
          <div className="timeline">
            {recentActivity.map((act, i) => (
              <div className="activity-item" key={i}>
                {act.text}
                <span className="time">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tip ── */}
      <div className="fyp-tip">
        <span role="img" aria-label="bulb">💡</span>
        <span>
          Tip: Use "Manage Deadlines" to keep the department on schedule and
          "Allocate Supervisors" to balance workloads.
        </span>
      </div>
    </div>
  );
}
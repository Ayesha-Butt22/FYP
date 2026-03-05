import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaClipboardCheck,
  FaCalendarCheck,
  FaStar,
  FaArrowRight,
  FaUserTie,
  FaLayerGroup,
  FaCircleCheck,
  FaHourglass,
  FaCircleXmark,
  FaFileLines,
  FaClockRotateLeft,
} from "react-icons/fa6";
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

// ─── Category icon + color map ────────────────
const CATEGORY_CONFIG = {
  supervisor: { icon: <FaUserTie />,          color: "#2563eb", bg: "#dbeafe" },
  template:   { icon: <FaFileLines />,        color: "#7c3aed", bg: "#ede9fe" },
  deadline:   { icon: <FaCalendarCheck />,    color: "#16a34a", bg: "#dcfce7" },
};

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

// ─── Activity Item — dot timeline style ──────
function ActivityItem({ log }) {
  return (
    <div className="activity-item">
      {log.description}
      <span className="time">{getTimeAgo(log.createdAt)}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────
export default function OverviewCoordinator({ onTabChange }) {
  const [statsData,      setStatsData]      = useState(null);
  const [groupsData,     setGroupsData]     = useState(null);
  const [supervisors,    setSupervisors]     = useState(null);
  const [activityLogs,   setActivityLogs]   = useState(null);

  const [loadingStats,    setLoadingStats]    = useState(true);
  const [loadingGroups,   setLoadingGroups]   = useState(true);
  const [loadingSup,      setLoadingSup]      = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [apiErrors, setApiErrors] = useState({});

  // ── Fetch stats ──
  useEffect(() => {
    authFetch("/admin/stats")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d.success) setStatsData(d.stats); })
      .catch((e) => setApiErrors((p) => ({ ...p, Stats: e.message })))
      .finally(() => setLoadingStats(false));
  }, []);

  // ── Fetch groups ──
  useEffect(() => {
    authFetch("/groupsinfo/info")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        if (d.success) {
          setGroupsData(d.data || []);
          // DEBUG
          console.log("=== GROUPS DEBUG ===");
          (d.data || []).forEach((g, i) => {
            const lastProp = g.proposals?.at(-1);
            console.log(`Group ${i+1} [${g.groupId}]: proposalsCount=${g.proposals?.length}, lastStatus=${lastProp?.projectStatus ?? "NO PROPOSAL"}, title=${lastProp?.projectTitle ?? "none"}`);
          });
        }
      })
      .catch((e) => { setApiErrors((p) => ({ ...p, Groups: e.message })); setGroupsData([]); })
      .finally(() => setLoadingGroups(false));
  }, []);

  // ── Fetch supervisors ──
  useEffect(() => {
    authFetch("/admin/supervisors-for-coordinator")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d.success) setSupervisors(d.data || []); })
      .catch((e) => { setApiErrors((p) => ({ ...p, Supervisors: e.message })); setSupervisors([]); })
      .finally(() => setLoadingSup(false));
  }, []);

  // ── Fetch recent activity logs (NEW) ──
  useEffect(() => {
    authFetch("/activity/recent")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d.success) setActivityLogs(d.data || []); })
      .catch((e) => { setApiErrors((p) => ({ ...p, Activity: e.message })); setActivityLogs([]); })
      .finally(() => setLoadingActivity(false));
  }, []);

  // ── Derived values ──
  const groups = groupsData  || [];
  const sups   = supervisors || [];
  const logs   = activityLogs || [];

  const totalGroups   = statsData?.totalGroups       ?? groups.length;
  const totalStudents = statsData?.totalStudents     ?? "—";
  const totalSups     = statsData?.totalSupervisors  ?? sups.length;
  const totalCoords   = statsData?.totalCoordinators ?? "—";

  // ── Proposal counts from groupsData ──
  // Status: 0=Pending, 1=Approved by Supervisor, 2=Rejected by Supervisor, 3=Rejected

  const approvedCount = groups.filter((g) => {
    const last = (g.proposals || []).at?.(-1);
    return last?.projectStatus === 1;
  }).length;

  const rejectedCount = groups.filter((g) => {
    const last = (g.proposals || []).at?.(-1);
    return last?.projectStatus === 2 || last?.projectStatus === 3;
  }).length;

  const pendingCount = groups.filter((g) => {
    const last = (g.proposals || []).at?.(-1);
    return !last || last.projectStatus === 0;
  }).length;

  const underReviewCount = 0; // not used separately

  // ── Progress percentages ──
  const totalForPct    = groups.length || 1;
  const approvedPct    = Math.round((approvedCount  / totalForPct) * 100);
  const underReviewPct = 0;
  const rejectedPct    = Math.round((rejectedCount  / totalForPct) * 100);
  const pendingPct     = Math.round((pendingCount   / totalForPct) * 100);
  const supAllocPct    = sups.length
    ? Math.round((sups.filter((s) => (s.bookedSlots || 0) > 0).length / sups.length) * 100)
    : 0;

  const hasError = Object.keys(apiErrors).length > 0;

  // ── Last 3 activity logs ──
  const recentLogs = logs.slice(0, 3);

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
        .no-activity {
          color: #94a3b8; font-size: 1rem; padding: 16px 0;
          display: flex; align-items: center; gap: 8px;
        }
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
          <div className="chip chip-approved"><FaCircleCheck /> Approved (by Supervisor): {approvedCount}</div>
          <div className="chip chip-rejected"><FaCircleXmark /> Rejected: {rejectedCount}</div>
        </div>
      )}

      {/* ── Progress Overview ── */}
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
        ) : groups.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Abhi koi group registered nahi hai.</p>
        ) : (
          <>
            <ProgressBar
              label={`Proposals Approved (${approvedCount} / ${groups.length})`}
              percent={approvedPct}
              color="#16a34a"
            />
            <ProgressBar
              label={`Proposals Rejected (${rejectedCount} / ${groups.length})`}
              percent={rejectedPct}
              color="#ef4444"
            />

            <ProgressBar
              label={`Supervisor Slots Filled (${sups.filter(s => (s.bookedSlots||0) > 0).length} / ${sups.length})`}
              percent={supAllocPct}
              color="#2563eb"
            />
          </>
        )}
      </div>

      {/* ── Recent Activity (from real API) ── */}
      <div className="progress-section-gap" />
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        {loadingActivity ? (
          [1,2,3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0" }}>
              <Skeleton height={36} width={36} radius={50} />
              <div style={{ flex: 1 }}>
                <Skeleton height={14} width="60%" />
                <Skeleton height={12} width="80%" />
              </div>
            </div>
          ))
        ) : recentLogs.length === 0 ? (
          <p className="no-activity">
            <FaClockRotateLeft style={{ fontSize: 18 }} />
            Abhi koi activity nahi hui. Jab aap deadlines, supervisor slots ya templates manage karein ge to yahan show hoga.
          </p>
        ) : (
          <div className="timeline">
            {recentLogs.map((log) => (
              <ActivityItem key={log._id} log={log} />
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
import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { FaUsers, FaArrowRight, FaTimes } from "react-icons/fa";
import supervisorGroupsService from "../Api/supervisorGroupsService.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorGroups.css";

async function fetchGroupSubmissions(groupId) {
  try {
    const res = await fetch(`/api/supervisor/group/${groupId}/submissions`);
    const data = await res.json();
    return data.submissions || [];
  } catch {
    return [];
  }
}

function normalizeProposalStatus(raw) {
  if (raw === 1 || raw === "1" || raw === "Approved") return "Approved";
  if (raw === 2 || raw === "2" || raw === "Rejected") return "Rejected";
  return "Pending";
}

function buildFillFractions(proposalStatus, submissions) {
  const status = normalizeProposalStatus(proposalStatus);
  let blueFill = 0;
  if (status === "Approved")     blueFill = 1.0;
  else if (status === "Pending") blueFill = 0.5;
  else                           blueFill = 0.0;

  const middleCodes = ["t01", "t02", "t03", "t04", "t05"];
  const approvedMiddle = submissions.filter(
    (s) => middleCodes.includes(s.templateCode) && s.status === "Approved"
  ).length;
  const greenFill = approvedMiddle / middleCodes.length;

  const finalCodes = ["t06", "t07"];
  const uploadedFinal = submissions.filter((s) =>
    finalCodes.includes(s.templateCode)
  ).length;
  const redFill = uploadedFinal / finalCodes.length;

  return { blueFill, greenFill, redFill };
}

// ─── Donut Chart — exact match to screenshot ───────────────────────────────
function MilestoneDonut({ blueFill, greenFill, redFill }) {
  const size = 220;
  const cx   = size / 2;
  const cy   = size / 2;
  const R    = 90;
  const r    = 54;
  const GAP  = 3;

  const SEGMENTS = [
    { fill: blueFill,  color: "#3b82f6", bg: "#bfdbfe", label: "Proposal" },
    { fill: greenFill, color: "#22c55e", bg: "#bbf7d0", label: "Mid Evaluation" },
    { fill: redFill,   color: "#f43f5e", bg: "#fecdd3", label: "Final Report" },
  ];

  function toRad(deg) { return (deg * Math.PI) / 180; }
  function pt(angleDeg, radius) {
    const a = toRad(angleDeg);
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }
  function donutArc(startDeg, endDeg, outerR, innerR) {
    const span = endDeg - startDeg;
    if (span <= 0) return "";
    const large = span > 180 ? 1 : 0;
    const o1 = pt(startDeg, outerR);
    const o2 = pt(endDeg,   outerR);
    const i2 = pt(endDeg,   innerR);
    const i1 = pt(startDeg, innerR);
    return (
      `M${o1.x},${o1.y} A${outerR},${outerR} 0 ${large},1 ${o2.x},${o2.y}` +
      ` L${i2.x},${i2.y} A${innerR},${innerR} 0 ${large},0 ${i1.x},${i1.y} Z`
    );
  }

  const EACH  = 120;
  const START = -90;

  return (
    // Outer wrapper — light blue card background like screenshot
    <div style={{
      background:    "#f0f6ff",
      borderRadius:  18,
      padding:       "28px 32px",
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      width:         "100%",
      boxSizing:     "border-box",
    }}>
      {/* Title */}
      <div style={{
        fontWeight:   800,
        fontSize:     20,
        color:        "#0f2a5e",
        marginBottom: 24,
        letterSpacing: 0.2,
      }}>
        Progress Tracking
      </div>

      {/* Row: donut + legend */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            40,
        width:          "100%",
        flexWrap:       "wrap",
      }}>
        {/* ── Donut ── */}
        <svg width={size} height={size} style={{ flexShrink: 0 }}>
          {SEGMENTS.map((seg, i) => {
            const segStart = START + i * EACH + GAP / 2;
            const segEnd   = START + (i + 1) * EACH - GAP / 2;
            const span     = segEnd - segStart;
            const fillEnd  = segStart + span * Math.min(Math.max(seg.fill, 0), 1);

            return (
              <g key={seg.label}>
                {/* bg arc */}
                <path d={donutArc(segStart, segEnd, R, r)} fill={seg.bg} />
                {/* filled arc */}
                {seg.fill > 0.005 && (
                  <path d={donutArc(segStart, fillEnd, R, r)} fill={seg.color} />
                )}
              </g>
            );
          })}

          {/* White center circle */}
          <circle cx={cx} cy={cy} r={r - 2} fill="white" />

          {/* Center text */}
          <text
            x={cx} y={cy - 8}
            textAnchor="middle"
            fontSize={16}
            fontWeight="800"
            fill="#0f2a5e"
          >
            Milestone
          </text>
          <text
            x={cx} y={cy + 14}
            textAnchor="middle"
            fontSize={13}
            fontWeight="500"
            fill="#3b82f6"
          >
            Analytics
          </text>
        </svg>

        {/* ── Legend (right side) ── */}
        <div style={{
          display:       "flex",
          flexDirection: "column",
          gap:           18,
        }}>
          {SEGMENTS.map((seg) => (
            <div key={seg.label} style={{
              display:    "flex",
              alignItems: "center",
              gap:        12,
            }}>
              {/* Colored square */}
              <div style={{
                width:           20,
                height:          20,
                borderRadius:    5,
                backgroundColor: seg.color,
                flexShrink:      0,
              }} />
              {/* Label */}
              <span style={{
                fontSize:   15,
                fontWeight: 500,
                color:      "#1e3a5f",
              }}>
                {seg.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
export default function SupervisorGroups() {
  const [selectedGroup,  setSelectedGroup]  = useState(null);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [fillFractions,  setFillFractions]  = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [chartLoading,   setChartLoading]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await supervisorGroupsService.getSupervisorGroupsWithDetails();
        if (response.success) setAssignedGroups(response.groups);
        else toastService.error("Failed to load groups");
      } catch (err) {
        console.error("Error fetching groups:", err);
        toastService.error("Failed to load groups");
        setAssignedGroups([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedGroup) { setFillFractions(null); return; }
    (async () => {
      setChartLoading(true);
      const groupId     = selectedGroup._id || selectedGroup.groupId;
      const submissions = await fetchGroupSubmissions(groupId);
      const fractions   = buildFillFractions(selectedGroup.proposalStatus, submissions);
      setFillFractions(fractions);
      setChartLoading(false);
    })();
  }, [selectedGroup]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setSelectedGroup(null); };
    if (selectedGroup) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedGroup]);

  if (loading) {
    return (
      <div className="supervisor-page-container">
        <DashboardSectionHeader description="Here you can view all FYP groups assigned to you.">
          My Groups
        </DashboardSectionHeader>
        <div style={{ textAlign: "center", padding: "48px 0", fontSize: 18, color: "#888" }}>
          Loading groups...
        </div>
      </div>
    );
  }

  if (assignedGroups.length === 0) {
    return (
      <div className="supervisor-page-container">
        <DashboardSectionHeader description="Here you can view all FYP groups assigned to you.">
          My Groups
        </DashboardSectionHeader>
        <div style={{ textAlign: "center", padding: "48px 0", fontSize: 18, color: "#888" }}>
          No groups assigned yet.
        </div>
      </div>
    );
  }

  return (
    <div className="supervisor-page-container">
      <DashboardSectionHeader
        description="Here you can view all FYP groups assigned to you. Click 'View Group Details' to see members, milestones, and progress analytics."
      >
        My Groups
      </DashboardSectionHeader>

      {/* ── Group cards ── */}
      <div className="supervisor-group-cards-row">
        {assignedGroups.map((group) => (
          <div className="supervisor-group-card" key={group._id || group.groupId}>
            <div className="supervisor-group-icon"><FaUsers /></div>
            <div className="supervisor-group-no">Group {group.groupNo}</div>
            <div className="supervisor-group-title" title={group.title}>{group.title}</div>
            <button className="supervisor-view-btn" onClick={() => setSelectedGroup(group)}>
              View Group Details <FaArrowRight />
            </button>
          </div>
        ))}
      </div>

      {/* ── Modal ── */}
      {selectedGroup && (
        <div
          className="supervisor-modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="supervisor-modal-card">
            <button
              className="supervisor-modal-close"
              aria-label="Close"
              onClick={() => setSelectedGroup(null)}
            >
              <FaTimes />
            </button>

            <div className="supervisor-modal-title">{selectedGroup.title}</div>

            {/* ── Details ── */}
            <div className="supervisor-group-details-form">
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Group Number:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.groupNo}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Group ID:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.groupId}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Program:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.program}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Proposal Status:</span>
                <span className={`supervisor-status-badge supervisor-status-${normalizeProposalStatus(selectedGroup.proposalStatus).toLowerCase()}`}>
                  {normalizeProposalStatus(selectedGroup.proposalStatus)}
                </span>
              </div>

              <div className="supervisor-progress-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 18 }}>Progress:</b>
                  <span style={{ color: "#15803d", fontWeight: 800, fontSize: 18 }}>
                    {selectedGroup.progress}%
                  </span>
                  <span className="supervisor-progress-subtext">
                    ({selectedGroup.milestonesCompleted} of {selectedGroup.milestonesTotal} milestones)
                  </span>
                </div>
              </div>
              <div className="supervisor-progress-bar-bg supervisor-progress-bar-bg-large">
                <div
                  className="supervisor-progress-bar-fill"
                  style={{ width: `${selectedGroup.progress}%` }}
                />
              </div>
            </div>

            {/* ── Members table ── */}
            <div className="supervisor-modal-label">Group Members:</div>
            <table className="supervisor-member-table supervisor-member-table-large">
              <thead>
                <tr><th>Member Name</th><th>SAP ID</th></tr>
              </thead>
              <tbody>
                {selectedGroup.members?.map((m, idx) => (
                  <tr key={`${m.email || m.sapId}-${idx}`}>
                    <td>{m.name}</td>
                    <td>{m.sapId}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Chart ── */}
            <div className="supervisor-analytics-card supervisor-analytics-card-large">
              {chartLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
                  Loading chart...
                </div>
              ) : fillFractions ? (
                <MilestoneDonut
                  blueFill={fillFractions.blueFill}
                  greenFill={fillFractions.greenFill}
                  redFill={fillFractions.redFill}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
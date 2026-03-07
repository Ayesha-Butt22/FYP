import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { FaUsers, FaArrowRight, FaTimes } from "react-icons/fa";
import supervisorGroupsService from "../Api/supervisorGroupsService.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorGroups.css";

// ─── Fetch real template submissions for a group ───
async function fetchGroupSubmissions(groupId) {
  try {
    const res = await fetch(`/api/supervisor/group/${groupId}/submissions`);
    const data = await res.json();
    return data.submissions || [];
  } catch {
    return [];
  }
}

// ─── Normalize proposalStatus — backend sends number (0/1/2) OR string ───
function normalizeProposalStatus(raw) {
  if (raw === 1 || raw === "1" || raw === "Approved") return "Approved";
  if (raw === 2 || raw === "2" || raw === "Rejected") return "Rejected";
  return "Pending";
}

// ─── Build fill fractions (0.0 – 1.0) per segment ───
//  Blue  (Proposal):       1.0 approved | 0.0 rejected | 0.5 pending
//  Green (t01–t05):        approvedCount / 5
//  Red   (t06–t07):        uploadedCount / 2  (any status counts as uploaded)
function buildFillFractions(proposalStatus, submissions) {
  const status = normalizeProposalStatus(proposalStatus);

  let blueFill = 0;
  if (status === "Approved")     blueFill = 1.0;
  else if (status === "Pending") blueFill = 0.5;
  else                           blueFill = 0.0; // Rejected → empty

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

// ─── Custom SVG Donut — 3 equal thirds, each filled by its own fraction ───
function MilestoneDonut({ blueFill, greenFill, redFill, size = 300 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.38;   // outer radius
  const r  = size * 0.23;   // inner radius
  const GAP = 3;            // gap degrees between segments

  const SEGMENTS = [
    { fill: blueFill,  color: "#2563eb", bg: "#dbeafe", label: "Proposal" },
    { fill: greenFill, color: "#22c55e", bg: "#dcfce7", label: "Mid Evaluation" },
    { fill: redFill,   color: "#f43f5e", bg: "#ffe4e6", label: "Final Report" },
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
    return `M${o1.x},${o1.y} A${outerR},${outerR} 0 ${large},1 ${o2.x},${o2.y}`
         + ` L${i2.x},${i2.y} A${innerR},${innerR} 0 ${large},0 ${i1.x},${i1.y} Z`;
  }

  const EACH = 120; // degrees per segment
  const START = -90; // top of circle

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <svg width={size} height={size}>
        {SEGMENTS.map((seg, i) => {
          const segStart = START + i * EACH + GAP / 2;
          const segEnd   = START + (i + 1) * EACH - GAP / 2;
          const span     = segEnd - segStart;
          const fillEnd  = segStart + span * Math.min(Math.max(seg.fill, 0), 1);

          return (
            <g key={seg.label}>
              {/* Background (light color) — full segment */}
              <path d={donutArc(segStart, segEnd, R, r)} fill={seg.bg} />
              {/* Filled arc — proportional to fill */}
              {seg.fill > 0.005 && (
                <path d={donutArc(segStart, fillEnd, R, r)} fill={seg.color} />
              )}
            </g>
          );
        })}

        {/* Center text */}
        <text x={cx} y={cy - size * 0.04} textAnchor="middle"
          fontSize={size * 0.075} fontWeight="bold" fill="#1e3a5f">
          Milestone
        </text>
        <text x={cx} y={cy + size * 0.065} textAnchor="middle"
          fontSize={size * 0.058} fill="#2563eb">
          Analytics
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
        {SEGMENTS.map((seg) => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 13, height: 13, borderRadius: 3,
              backgroundColor: seg.fill > 0 ? seg.color : seg.bg,
              border: `1.5px solid ${seg.color}`,
            }} />
            <span style={{ fontSize: 13, color: "#374151" }}>{seg.label}</span>
          </div>
        ))}
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

  // ── Fetch groups on mount ──
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

  // ── When a group is selected, fetch its submissions for the chart ──
  useEffect(() => {
    if (!selectedGroup) { setFillFractions(null); return; }

    (async () => {
      setChartLoading(true);
      const groupId     = selectedGroup._id || selectedGroup.groupId;
      const submissions = await fetchGroupSubmissions(groupId);

      console.log(`Chart data for group ${groupId}:`,
        "proposalStatus =", selectedGroup.proposalStatus,
        "| submissions =", submissions
      );

      const fractions = buildFillFractions(selectedGroup.proposalStatus, submissions);
      console.log("Fill fractions:", fractions);
      setFillFractions(fractions);
      setChartLoading(false);
    })();
  }, [selectedGroup]);

  // ── Escape key closes modal ──
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setSelectedGroup(null); };
    if (selectedGroup) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedGroup]);

  // ── Loading / empty states ──
  if (loading) {
    return (
      <div className="supervisor-page-container">
        <DashboardSectionHeader
          description="Here you can view all FYP groups assigned to you. Click 'View Group Details' to see members, milestones, and progress analytics."
        >
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
        <DashboardSectionHeader
          description="Here you can view all FYP groups assigned to you. Click 'View Group Details' to see members, milestones, and progress analytics."
        >
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
          aria-label={`Details for ${selectedGroup.title}`}
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

            {/* ── Details form ── */}
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
                <span className="supervisor-group-detail-label">Proposal/Idea Status:</span>
                <span
                  className={`supervisor-status-badge supervisor-status-${normalizeProposalStatus(selectedGroup.proposalStatus).toLowerCase()}`}
                >
                  {normalizeProposalStatus(selectedGroup.proposalStatus)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="supervisor-progress-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 18 }}>Progress:</b>
                    <span style={{ color: "#15803d", fontWeight: 800, fontSize: 18 }}>
                      {selectedGroup.progress}%
                    </span>
                  </div>
                  <div className="supervisor-progress-subtext">
                    ({selectedGroup.milestonesCompleted} of {selectedGroup.milestonesTotal} milestones)
                  </div>
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
              <h3 className="supervisor-chart-title">Progress Tracking</h3>

              {chartLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
                  Loading chart...
                </div>
              ) : fillFractions ? (
                <MilestoneDonut
                  blueFill={fillFractions.blueFill}
                  greenFill={fillFractions.greenFill}
                  redFill={fillFractions.redFill}
                  size={300}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
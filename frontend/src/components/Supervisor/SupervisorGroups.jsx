import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { FaUsers, FaArrowRight, FaTimes } from "react-icons/fa";
import supervisorGroupsService from "../Api/supervisorGroupsService.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorGroups.css";

// ─── Logic ───
async function fetchGroupSubmissions(groupId) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/supervisor/group/${groupId}/submissions`);
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
  const approved = submissions.filter(s => s.status === "Approved").map(s => s.templateCode);
  
  const blueCodes = ["t01", "t02"];
  const countBlue = blueCodes.filter(c => approved.includes(c)).length;
  const blueFill = countBlue / blueCodes.length;

  const greenCodes = ["t04", "t07"];
  const countGreen = greenCodes.filter(c => approved.includes(c)).length;
  const greenFill = countGreen / greenCodes.length;

  const redCodes = ["t05", "t06"];
  const countRed = redCodes.filter(c => approved.includes(c)).length;
  const redFill = countRed / redCodes.length;

  return { blueFill, greenFill, redFill };
}

// ─── Component: Donut ───
function MilestoneDonut({ blueFill, greenFill, redFill }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const R = 95;
  const r = 45;
  const GAP = 2;

  const totalActual = Math.round(((blueFill + greenFill + redFill) / 3) * 100);

  const SEGMENTS = [
    { fill: blueFill, color: "#2563eb", bg: "#dbeafe", label: "Proposal Phase" },
    { fill: greenFill, color: "#16a34a", bg: "#dcfce7", label: "Mid Phase" },
    { fill: redFill, color: "#dc2626", bg: "#fee2e2", label: "Final Phase" },
  ];

  function donutArc(startDeg, endDeg, outerR, innerR) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const pt = (angleDeg, radius) => ({
      x: cx + radius * Math.cos(toRad(angleDeg)),
      y: cy + radius * Math.sin(toRad(angleDeg))
    });
    const span = endDeg - startDeg;
    if (span <= 0) return "";
    const large = span > 180 ? 1 : 0;
    const o1 = pt(startDeg, outerR), o2 = pt(endDeg, outerR);
    const i2 = pt(endDeg, innerR), i1 = pt(startDeg, innerR);
    return `M${o1.x},${o1.y} A${outerR},${outerR} 0 ${large},1 ${o2.x},${o2.y} L${i2.x},${i2.y} A${innerR},${innerR} 0 ${large},0 ${i1.x},${i1.y} Z`;
  }

  const EACH = 120, START = -90;

  return (
    <div style={{
      background: "#ffffff", borderRadius: 20, padding: "30px",
      display: "flex", flexDirection: "column", alignItems: "center",
      width: "100%", boxSizing: "border-box", border: "1px solid #f1f5f9",
      boxShadow: "0 10px 25px rgba(1, 51, 122, 0.08)"
    }}>
      <div style={{ fontWeight: 900, fontSize: 22, color: "#01337a", marginBottom: 28 }}>Analytics Overview</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 50, width: "100%", flexWrap: "wrap" }}>
        <svg width={size} height={size} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.05))" }}>
          {SEGMENTS.map((seg, i) => {
            const s = START + i * EACH + GAP / 2, e = START + (i + 1) * EACH - GAP / 2;
            const f = s + (e - s) * Math.min(Math.max(seg.fill, 0), 1);
            return (
              <g key={seg.label}>
                <path d={donutArc(s, e, R, r)} fill={seg.bg} />
                {seg.fill > 0 && <path d={donutArc(s, f, R, r)} fill={seg.color} />}
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={r - 4} fill="white" />
          <text x={cx} y={cy - 12} textAnchor="middle" fontSize={14} fontWeight="800" fill="#64748b">PROGRESS</text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize={32} fontWeight="900" fill="#01337a">{totalActual}%</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SEGMENTS.map((seg) => (
            <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: seg.color }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1e3a5f" }}>{seg.label}</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>{Math.round(seg.fill * 100)}% Complete</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function SupervisorGroups() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [fillFractions, setFillFractions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await supervisorGroupsService.getSupervisorGroupsWithDetails();
        if (response.success) setAssignedGroups(response.groups);
        else toastService.error("Failed to load groups");
      } catch (err) {
        toastService.error("Failed to load groups");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedGroup) { setFillFractions(null); return; }
    (async () => {
      setChartLoading(true);
      const groupId = selectedGroup._id || selectedGroup.groupId;
      const submissions = await fetchGroupSubmissions(groupId);
      setFillFractions(buildFillFractions(selectedGroup.proposalStatus, submissions));
      setChartLoading(false);
    })();
  }, [selectedGroup]);

  if (loading) {
    return (
      <div className="supervisor-page-container">
        <DashboardSectionHeader description="Loading..."><div style={{ padding: 50 }}>Loading groups...</div></DashboardSectionHeader>
      </div>
    );
  }

  return (
    <div className="supervisor-page-container">
      <DashboardSectionHeader description="View your assigned groups.">My Groups</DashboardSectionHeader>
      <div className="supervisor-group-cards-row">
        {assignedGroups.map(group => (
          <div className="supervisor-group-card" key={group._id || group.groupId}>
            <div className="supervisor-group-icon"><FaUsers /></div>
            <div className="supervisor-group-no">Group {group.groupNo}</div>
            <div className="supervisor-group-title" title={group.title}>{group.title}</div>
            <button className="supervisor-view-btn" onClick={() => setSelectedGroup(group)}>View Group Details <FaArrowRight /></button>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className="supervisor-modal-overlay">
          <div className="supervisor-modal-card">
            <button className="supervisor-modal-close" onClick={() => setSelectedGroup(null)}><FaTimes /></button>
            <div className="supervisor-modal-title">{selectedGroup.title}</div>
            
            <div className="supervisor-group-details-form">
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Group ID:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.maskedGroupId}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Status:</span>
                <span className={`supervisor-status-badge supervisor-status-${normalizeProposalStatus(selectedGroup.proposalStatus).toLowerCase()}`}>
                  {normalizeProposalStatus(selectedGroup.proposalStatus)}
                </span>
              </div>
              
              <div className="supervisor-progress-row">
                 <b>Progress:</b>
                 <span style={{ color: "#15803d", fontWeight: 800 }}>
                    {Math.round((selectedGroup.milestonesCompleted / selectedGroup.milestonesTotal) * 100)}%
                 </span>
              </div>
              <div className="supervisor-progress-bar-bg">
                <div className="supervisor-progress-bar-fill" style={{ width: `${Math.round((selectedGroup.milestonesCompleted / selectedGroup.milestonesTotal) * 100)}%` }} />
              </div>
            </div>

            <div className="supervisor-modal-label">Group Members:</div>
            <table className="supervisor-member-table">
              <thead>
                <tr><th>Member Name</th><th>Student ID</th></tr>
              </thead>
              <tbody>
                {selectedGroup.members?.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: "#01337a" }}>{m.name || m.studentName}</td>
                    <td><span style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 4, fontFamily: 'monospace' }}>{m.sapId}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="supervisor-analytics-card">
              {chartLoading ? <div>Loading chart...</div> : fillFractions && <MilestoneDonut {...fillFractions} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
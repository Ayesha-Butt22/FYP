import React, { useState, useEffect, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService.jsx";
import SemesterStartService from "../Api/SemesterStartService.jsx";
import supervisorService from "../Api/supervisorService.jsx";

import "./SupervisorMilestones.css";
import { Typography } from "@mui/material";

Chart.register(ArcElement, Tooltip, Legend);

const STATUS = {
  completed: { color: "#16a34a", bg: "#d1fadf", text: "Completed", icon: "✅" },
  pending: { color: "#01337a", bg: "#fef7aa", text: "Pending", icon: "⏳" },
  overdue: { color: "#ef4444", bg: "#fee2e2", text: "Overdue", icon: "❌" },
  rejected: { color: "#ef4444", bg: "#fff0f0", text: "Rejected", icon: "✖️" },
};

const TEMPLATE_DEFINITIONS = [
  { code: "t01", label: "Template-01: Project Team List (MS Word)", week: 1 },
  { code: "t02", label: "Template-02: Initial Proposal (MS Word)", week: 2 },
  { code: "t03", label: "Template-03: Proposal Presentation (MS PowerPoint)", week: 4 },
  { code: "t04", label: "Template-04: Proposal & Plan (MS Word)", week: 6 },
  { code: "t05", label: "Template-05: Progress Presentation (MS PowerPoint)", week: 13 },
  { code: "t06", label: "Template-06: Complete Project Report (MS Word)", week: 24 },
  { code: "t07", label: "Template-07: Final Presentation (MS PowerPoint)", week: 26 },
  { code: "t08", label: "Template-08: Complete Final Presentation (MS Word)", week: 28 },
  { code: "t09", label: "Template-09: Complete Documentation(MS Word)", week: 30 },
];

function maskGroupId(originalId) {
  if (!originalId) return "Group-001";
  if (originalId.toLowerCase().startsWith("group-")) return originalId;
  return `Group-${originalId.slice(-3).toUpperCase()}`;
}

function formatDateTime(inp) {
  if (!inp) return "—";
  const d = new Date(inp);
  return isNaN(d.getTime()) ? String(inp) : d.toLocaleDateString();
}

export default function SupervisorMilestones() {
  const [groups, setGroups] = useState([]);
  const [semesterStart, setSemesterStart] = useState(null);

  const [modal, setModal] = useState({
    open: false,
    gIndex: null,
    mIndex: null,
    selectedAction: "pending",
    saving: false,
  });

  // fetch semester start and set default due dates if present
  useEffect(() => {
    async function fetchSemesterStart() {
      try {
        const data = await SemesterStartService.getDate();
        if (data?.date) {
          const start = new Date(data.date);
          setSemesterStart(start);

          // if groups already loaded, update their local due dates as well
          setGroups((prev) =>
            prev.map((g) => ({
              ...g,
              milestones: g.milestones.map((m, idx) => {
                const template = TEMPLATE_DEFINITIONS[idx];
                if (!template || !start) return m;
                const dueDate = new Date(start);
                dueDate.setDate(start.getDate() + template.week * 7);
                return { ...m, due: dueDate.toISOString().split("T")[0] };
              }),
            }))
          );
        }
      } catch (err) {
        toastService.error("Failed to fetch semester start date");
      }
    }
    fetchSemesterStart();
  }, []);

  // load groups from backend
  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await supervisorService.getSupervisorGroups();

        const mapped = res.groups.map((g) => ({
          group: maskGroupId(g.maskedGroupId),
          title: g.description,
          members: g.members,
          department: g.department || "",
          milestones: TEMPLATE_DEFINITIONS.map((t) => {
            const backendMilestone = g.milestones?.find((m) => m.code === t.code) || {};
            return {
              name: t.label,
              week: t.week,
              status: backendMilestone.status || "pending",
              due: backendMilestone.due || null,
              uploadedFile: backendMilestone.uploadedFile || null,
              note: backendMilestone.note || "",
            };
          }),
        }));

        setGroups(mapped);
      } catch (err) {
        console.error("Error fetching supervisor groups:", err);
        toastService.error("Failed to load groups from backend");
      }
    }

    loadGroups();
  }, []);

  // timeline helpers
  const now = useMemo(() => new Date(), []);
  const currentWeekNumber = useMemo(() => {
    if (!semesterStart) return null;
    const diffMs = now.getTime() - semesterStart.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  }, [semesterStart, now]);

  const activeTemplateIndex = useMemo(() => {
    if (currentWeekNumber == null) return null;
    let idx = TEMPLATE_DEFINITIONS
      .map((t) => t.week)
      .reduce((acc, w, i) => (w <= currentWeekNumber ? i : acc), -1);
    if (idx === -1) idx = 0;
    if (currentWeekNumber > TEMPLATE_DEFINITIONS[TEMPLATE_DEFINITIONS.length - 1].week) {
      idx = TEMPLATE_DEFINITIONS.length - 1;
    }
    return idx;
  }, [currentWeekNumber]);

  // modal handlers
  const openDetails = (gIndex, mIndex) => {
    const g = groups[gIndex];
    const m = g.milestones[mIndex];
    const defaultAction =
      m.status === "completed" ? "approve" : m.status === "rejected" ? "unapprove" : "pending";
    setModal({ open: true, gIndex, mIndex, selectedAction: defaultAction, saving: false });
  };

  const closeDetails = () =>
    setModal({ open: false, gIndex: null, mIndex: null, selectedAction: "pending", saving: false });

  const handleActionChange = (value) => setModal((s) => ({ ...s, selectedAction: value }));

  const handleNoteChange = (value) => {
    const { gIndex, mIndex } = modal;
    if (gIndex == null || mIndex == null) return;
    setGroups((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[gIndex].milestones[mIndex].note = value;
      return next;
    });
  };

  const handleUpdateStatus = async () => {
    const { gIndex, mIndex, selectedAction } = modal;
    if (gIndex == null || mIndex == null) return;

    const confirmMsg =
      selectedAction === "approve"
        ? "Approve this milestone? This will mark it as Completed."
        : selectedAction === "unapprove"
        ? "Mark this milestone as Rejected?"
        : "Mark this milestone as Pending?";
    if (!window.confirm(confirmMsg)) return;

    const mapped =
      selectedAction === "approve"
        ? "completed"
        : selectedAction === "unapprove"
        ? "rejected"
        : "pending";

    const milestoneCode = TEMPLATE_DEFINITIONS[mIndex].code;
    const groupId = groups[gIndex].group; // backend ID

    setModal((s) => ({ ...s, saving: true }));

    try {
      await supervisorService.updateMilestoneStatus(groupId, milestoneCode, {
        status: mapped,
        note: groups[gIndex].milestones[mIndex].note,
      });

      setGroups((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[gIndex].milestones[mIndex].status = mapped;
        return next;
      });

      toastService.success("Milestone updated successfully");
      closeDetails();
    } catch (err) {
      toastService.error("Failed to update milestone");
      setModal((s) => ({ ...s, saving: false }));
    }
  };

  const archiveGroup = (gIndex) => {
    if (!window.confirm("Add this group to archive?")) return;
    setGroups((prev) =>
      prev.map((g, i) => (i === gIndex ? { ...g, _archived: true, _show: false } : g))
    );
    toastService.success("Group added to archive (frontend only)");
  };

  return (
    <div>
      <DashboardSectionHeader description="Here you can view all the FYP groups milestones. Click 'Show Timeline' to see groups progress, milestones, and deadlines.">
        Milestones & Timeline
      </DashboardSectionHeader>

     {/* COMPACT GRID TIMELINE */}
<div
  className="supervisor-timeline-wrap"
  aria-hidden={!semesterStart}
>
  {semesterStart ? (
    <div className="supervisor-timeline compact-grid">

      {/* ===== HEADER ===== */}
      <div className="timeline-header">
        <div>
          <label>Current Academic Timeline</label>

          <Typography variant="body2">
            Semester start:
            <strong> {formatDateTime(semesterStart)}</strong>
          </Typography>

          <Typography variant="body2">
            Current week:
            <strong>
              {" "}
              {currentWeekNumber != null ? currentWeekNumber : "—"}
            </strong>
          </Typography>
        </div>
      </div>

            <div className="timeline-grid">
              {TEMPLATE_DEFINITIONS.map((tpl, i) => {
                // correct due date calculation using semesterStart
                const due = semesterStart ? (() => {
                  const d = new Date(semesterStart);
                  d.setDate(semesterStart.getDate() + tpl.week * 7);
                  return d;
                })() : null;

                const completed = currentWeekNumber != null && tpl.week < currentWeekNumber;
                const active = activeTemplateIndex === i;

                return (
                  <div key={tpl.code} className={`timeline-card ${completed ? "completed" : ""} ${active ? "active" : ""}`}>
                    <div className="card-left">
                      <div className="card-dot" />
                      <div className="card-week">W{tpl.week}</div>
                    </div>
                    <div className="card-body">
                      <div className="card-title">{tpl.label}</div>
                      <div className="card-meta">
                        <span className="card-date">{due ? due.toLocaleDateString() : "—"}</span>
                        <span className={`card-status ${completed ? "done" : active ? "now" : "upcoming"}`}>
                          {completed ? "Completed" : active ? "In Progress" : "Upcoming"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="supervisor-timeline-placeholder">Timeline not configured (semester start missing)</div>
        )}
      </div>

      {/* GROUP CARDS (unchanged behavior) */}
      <div className="milestone-groups-row">
        {groups.map((group, gIdx) => {
          const displayedMilestones = TEMPLATE_DEFINITIONS.map((tpl, idx) => {
            const original = group.milestones[idx];
            return {
              weekLabel: `Week ${tpl.week}`,
              name: tpl.label,
              due: original.due || "—",
              status: original.status,
              uploadedFile: original.uploadedFile,
              note: original.note,
            };
          });

          const completed = displayedMilestones.filter((m) => m.status === "completed").length;
          const pending = displayedMilestones.filter((m) => m.status === "pending").length;
          const overdue = displayedMilestones.filter((m) => m.status === "overdue").length;
          const percent = Math.round((completed / displayedMilestones.length) * 100);

          const doughnutData = {
            labels: ["Completed", "Pending", "Overdue"],
            datasets: [
              {
                data: [completed, pending, overdue],
                backgroundColor: [STATUS.completed.color, STATUS.pending.color, STATUS.overdue.color],
                borderWidth: 1,
              },
            ],
          };

          return (
            <div className={`milestone-group-card ${group._archived ? "archived" : ""}`} key={group.group}>
              <div className="milestone-card-header">
                <div>
                  <div className="milestone-card-group">{group.group}</div>
                  <div className="milestone-card-title">{group.title}</div>
                  <div className="milestone-card-department">
                    <b>Department:</b> {group.department}
                  </div>
                  <div className="milestone-card-members">
                    <b>Members:</b> {group.members?.join(", ")}</div>
                </div>

                <div className="milestone-card-progress">
                  <div className="milestone-doughnut">
                    <Doughnut data={doughnutData} options={{ cutout: "74%", plugins: { legend: { display: false } } }} />
                  </div>
                  <div className="milestone-percent-complete">{percent}% Complete</div>
                </div>
              </div>

              <button
                className="milestone-toggle-btn"
                onClick={() => setGroups((s) => s.map((x) => (x === group ? { ...x, _show: !x._show } : x)))}
                disabled={!!group._archived}
              >
                {group._show ? "Hide Timeline" : "Show Timeline"}
              </button>

              {group._show && !group._archived && (
                <div className="milestone-timeline-table-wrap">
                  <table className="milestone-timeline-table">
                    <thead>
                      <tr>
                        <th className="milestone-th">Milestone</th>
                        <th className="milestone-th">Due Date</th>
                        <th className="milestone-th">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedMilestones.map((m, mIdx) => (
                        <tr key={m.week}>
                          <td className="milestone-td">{m.weekLabel}</td>
                          <td className="milestone-td">{m.due}</td>
                          <td className="milestone-td">
                            <div className="milestone-action-row">
                              <button className="view-details-btn" onClick={() => openDetails(gIdx, mIdx)} disabled={!!group._archived}>
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="archive-button-wrap">
                    {!group._archived ? (
                      <button className="archive-btn" onClick={() => archiveGroup(gIdx)}>Add to Archive</button>
                    ) : (
                      <div className="archived-badge">Archived</div>
                    )}
                  </div>
                </div>
              )}

              {group._archived && (
                <div className="milestone-archived-note">This group is archived. Timeline is hidden.</div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL (unchanged) */}
      {modal.open && modal.gIndex != null && modal.mIndex != null && (
        <div className="mmodal-backdrop" role="dialog" aria-modal="true">
          <div className="mmodal modal-centered" role="document" aria-labelledby="milestone-details-title">
            <div className="mmodal-header">
              <h3 id="milestone-details-title">Milestone Details</h3>
              <button className="mmodal-close" onClick={closeDetails} aria-label="Close">✖</button>
            </div>

            <div className="mmodal-body centered-body">
              {(() => {
                const g = groups[modal.gIndex];
                const m = g.milestones[modal.mIndex];
                const template = TEMPLATE_DEFINITIONS[modal.mIndex];

                const uploadedFile = m.uploadedFile || null;
                const currentNote = m.note || "";
                const dueDisplay = m.due ? formatDateTime(m.due) : "—";

                return (
                  <div className="modal-stack">
                    <div className="stack-item">
                      <div className="stack-label">Milestone</div>
                      <div className="stack-value">
                        <strong>{`Week ${template.week}`}</strong>
                      </div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Template</div>
                      <div className="stack-value">
                        {template.label}
                      </div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Uploaded File</div>
                      <div className="stack-value">
                        {uploadedFile && uploadedFile.url ? (
                          <div>
                            <a href={uploadedFile.url} target="_blank" rel="noreferrer" className="link-inline">{uploadedFile.name || "View uploaded file"}</a>
                            {uploadedFile.uploadedAt && <div className="muted" style={{ marginTop: 6 }}>Uploaded at: {formatDateTime(uploadedFile.uploadedAt)}</div>}
                          </div>
                        ) : (
                          <div className="muted">No file uploaded yet</div>
                        )}
                      </div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Due Date & Time</div>
                      <div className="stack-value">{dueDisplay}</div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Status</div>
                      <select
                        className="status-select"
                        value={modal.selectedAction}
                        onChange={(e) => handleActionChange(e.target.value)}
                        aria-label="Milestone decision"
                      >
                        <option value="approve">Approve</option>
                        <option value="unapprove">Unapprove</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Comment</div>
                      <textarea
                        className="mm-notes"
                        placeholder="Add an optional comment for the student (e.g. required fixes)"
                        value={currentNote}
                        onChange={(e) => handleNoteChange(e.target.value)}
                      />
                    </div>

                    <div className="stack-actions">
                      <button className="btn-update" onClick={handleUpdateStatus} disabled={modal.saving}>
                        {modal.saving ? "Updating..." : "Update"}
                      </button>
                      <button className="btn-cancel" onClick={closeDetails}>Cancel</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
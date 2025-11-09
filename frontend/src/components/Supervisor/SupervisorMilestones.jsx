import React, { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorMilestones.css";

Chart.register(ArcElement, Tooltip, Legend);

// Extended weeks (kept same order as earlier)
const WEEKS = [
  "Week 1",
  "Week 2",
  "Week 4",
  "Week 6",
  "Week 11",
  "Week 13",
  "Week 15",
  "13th Week before Final Exams",
  "Week After Finals",
];

// status palette
const STATUS = {
  completed: { color: "#16a34a", bg: "#d1fadf", text: "Completed", icon: "✅" },
  pending: { color: "#01337a", bg: "#fef7aa", text: "Pending", icon: "⏳" },
  overdue: { color: "#ef4444", bg: "#fee2e2", text: "Overdue", icon: "❌" },
  rejected: { color: "#ef4444", bg: "#fff0f0", text: "Rejected", icon: "✖️" },
};

// Template labels for weeks (aligned to WEEKS length)
const TEMPLATE_LABELS = [
  "Template-01: Project Team (MS Word)",
  "Template-02: Initial Proposal (MS Word)",
  "Template-03: Proposal Presentation (MS PowerPoint)",
  "Template-04: Proposal & Plan (MS Word)",
  "Template-05: Project Report (MS Word)",
  "Template-06: Final Presentation (MS PowerPoint)",
  "Template-07: Progress Presentation (MS PowerPoint)",
  "Template-08: Posters/Final Deliverables",
  "Template-09: Hardcopy Documentation & CD",
];

// Human readable template details
const TEMPLATE_DETAILS = [
  "Project team and responsibilities (Template-01).",
  "Initial proposal document (Template-02).",
  "Proposal presentation slides (Template-03).",
  "Detailed proposal & plan (Template-04).",
  "Complete Project Report (SOFT COPY – Use Template-05).",
  "Final Presentation (Use Template-06) and Full Working Demo.",
  "Progress Presentation (Use Template-07).",
  "Banners, Posters, Brochure, Final Presentation & Demo deliverables.",
  "Documentation (Hard Binding – 3 Copies), CD with source and appendices.",
];

// Static demo groups with due dates filled for every week (frontend-only sample data)
const INITIAL_GROUPS = [
  {
    group: "Group 1",
    title: "Smart Attendance System",
    department: "Software Engineering",
    milestones: [
      { name: "Project Team", status: "completed", due: "2025-09-01", uploadedFile: { name: "team.docx", url: "#" }, note: "" },
      { name: "Initial Proposal", status: "completed", due: "2025-09-08", uploadedFile: { name: "proposal.docx", url: "#" }, note: "" },
      { name: "Proposal Presentation", status: "completed", due: "2025-09-15", uploadedFile: { name: "proposal_slides.pptx", url: "#" }, note: "" },
      { name: "Proposal & Plan", status: "pending", due: "2025-09-22", uploadedFile: null, note: "" },
      { name: "Project Report (Draft)", status: "pending", due: "2025-09-29", uploadedFile: null, note: "" },
      { name: "Progress Presentation", status: "pending", due: "2025-10-06", uploadedFile: null, note: "" },
      { name: "Final Presentation Prep", status: "pending", due: "2025-10-13", uploadedFile: null, note: "" },
      { name: "Pre-Final Deliverables (Posters/Brochure)", status: "pending", due: "2025-10-20", uploadedFile: null, note: "" },
      { name: "Hardcopy & CD Submission", status: "pending", due: "2025-10-27", uploadedFile: null, note: "" },
    ],
    members: ["Ali Raza", "Sana Tariq", "Bilal Khan"],
  },
  {
    group: "Group 2",
    title: "AI-Based Disease Prediction",
    department: "Computer Science",
    milestones: [
      { name: "Project Team", status: "completed", due: "2025-09-01", uploadedFile: { name: "team2.docx", url: "#" }, note: "" },
      { name: "Initial Proposal", status: "completed", due: "2025-09-08", uploadedFile: { name: "proposal2.docx", url: "#" }, note: "" },
      { name: "Proposal Presentation", status: "completed", due: "2025-09-15", uploadedFile: null, note: "" },
      { name: "Proposal & Plan", status: "overdue", due: "2025-09-22", uploadedFile: null, note: "Plan needs more details" },
      { name: "Project Report (Draft)", status: "pending", due: "2025-09-29", uploadedFile: null, note: "" },
      { name: "Progress Presentation", status: "pending", due: "2025-10-06", uploadedFile: null, note: "" },
      { name: "Final Presentation Prep", status: "pending", due: "2025-10-13", uploadedFile: null, note: "" },
      { name: "Pre-Final Deliverables (Posters/Brochure)", status: "pending", due: "2025-10-20", uploadedFile: null, note: "" },
      { name: "Hardcopy & CD Submission", status: "pending", due: "2025-10-27", uploadedFile: null, note: "" },
    ],
    members: ["Ayesha Butt", "Madiha Sumbal", "Saad Farooq"],
  },
  {
    group: "Group 3",
    title: "Online Exam Proctoring",
    department: "Computer Arts",
    templateLink: "https://drive.google.com/drive/folders/CA-TEMPLATES-URL",
    milestones: [
      { name: "Project Team", status: "completed", due: "2025-09-01", uploadedFile: { name: "team3.docx", url: "#" }, note: "" },
      { name: "Initial Proposal", status: "completed", due: "2025-09-08", uploadedFile: { name: "proposal3.docx", url: "#" }, note: "" },
      { name: "Proposal Presentation", status: "completed", due: "2025-09-15", uploadedFile: { name: "proposal3.pptx", url: "#" }, note: "" },
      { name: "Proposal & Plan", status: "completed", due: "2025-09-22", uploadedFile: { name: "plan3.docx", url: "#" }, note: "" },
      { name: "Project Report (Draft)", status: "pending", due: "2025-09-29", uploadedFile: null, note: "" },
      { name: "Progress Presentation", status: "pending", due: "2025-10-06", uploadedFile: null, note: "" },
      { name: "Final Presentation Prep", status: "pending", due: "2025-10-13", uploadedFile: null, note: "" },
      { name: "Pre-Final Deliverables (Posters/Brochure)", status: "pending", due: "2025-10-20", uploadedFile: null, note: "" },
      { name: "Hardcopy & CD Submission", status: "pending", due: "2025-10-27", uploadedFile: null, note: "" },
    ],
    members: ["Fatima Noor", "Usman Ghani", "Hira Qureshi"],
  },
];

function formatDateTime(inp) {
  if (!inp) return "—";
  try {
    const d = new Date(inp);
    if (isNaN(d.getTime())) return String(inp);
    // Format YYYY-MM-DD HH:MM (local)
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
  } catch {
    return String(inp);
  }
}

export default function SupervisorMilestones() {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  // modal: open + indices + selectedAction + saving flag
  const [modal, setModal] = useState({
    open: false,
    gIndex: null,
    mIndex: null,
    selectedAction: "pending",
    saving: false,
  });

  const openDetails = (gIndex, mIndex) => {
    const g = groups[gIndex];
    const m = (g && g.milestones && g.milestones[mIndex]) || null;
    const defaultAction =
      m && m.status === "completed" ? "approve" : m && m.status === "rejected" ? "unapprove" : "pending";
    setModal({ open: true, gIndex, mIndex, selectedAction: defaultAction, saving: false });
  };

  const closeDetails = () => setModal({ open: false, gIndex: null, mIndex: null, selectedAction: "pending", saving: false });

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

    // Map select value to saved status
    const mapped = selectedAction === "approve" ? "completed" : selectedAction === "unapprove" ? "rejected" : "pending";

    // optimistic update
    setGroups((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[gIndex] && next[gIndex].milestones && next[gIndex].milestones[mIndex]) {
        next[gIndex].milestones[mIndex].status = mapped;
      }
      return next;
    });

    setModal((s) => ({ ...s, saving: true }));
    try {
      // simulate network latency / placeholder for real API call
      await new Promise((r) => setTimeout(r, 600));
      toastService.success("Milestone updated (frontend only)");
      closeDetails();
      // TODO: call backend API to persist change
    } catch (err) {
      toastService.error("Failed to update milestone");
      // revert: for demo we'll reload initial snapshot (simple approach)
      setGroups(INITIAL_GROUPS);
      setModal((s) => ({ ...s, saving: false }));
    }
  };

  // NEW: archive a group (frontend-only). Adds _archived flag and shows toast.
  const archiveGroup = (gIndex) => {
    if (!window.confirm("Add this group to archive?")) return;
    setGroups((prev) => prev.map((g, i) => (i === gIndex ? { ...g, _archived: true, _show: false } : g)));
    toastService.success("Group added to archive (frontend only)");
  };

  return (
    <div>
      <DashboardSectionHeader description="Here you can view all the FYP groups milestones. Click 'Show Timeline' to see groups progress, milestones, and deadlines.">
        Milestones & Timeline
      </DashboardSectionHeader>

      <div className="milestone-groups-row">
        {groups.map((group, gIdx) => {
          const displayedMilestones = WEEKS.map((wk, idx) => {
            const original = (group.milestones && group.milestones[idx]) || null;
            return {
              week: wk,
              name: original ? original.name : (TEMPLATE_LABELS[idx] || ""),
              due: original ? original.due : "—",
              status: original ? original.status : "pending",
              uploadedFile: original ? original.uploadedFile : null,
              note: original ? original.note : "",
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
                    <b>Members:</b> {group.members.join(", ")}
                  </div>
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
                          <td className="milestone-td">{m.week}</td>
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

                  {/* Archive button placed AFTER the full template/timeline table, centered in the card */}
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

      {/* Modal: simplified vertical layout (Week, Template, Uploaded File, Due Date/Time, Submission Date/Time, Status dropdown, Comment, Update) */}
      {modal.open && modal.gIndex != null && modal.mIndex != null && (
        <div className="mmodal-backdrop" role="dialog" aria-modal="true">
          <div className="mmodal modal-centered" role="document" aria-labelledby="milestone-details-title">
            <div className="mmodal-header">
              <h3 id="milestone-details-title">Milestone Details</h3>
              <button className="mmodal-close" onClick={closeDetails} aria-label="Close">
                ✖
              </button>
            </div>

            <div className="mmodal-body centered-body">
              {(() => {
                const g = groups[modal.gIndex];
                const m = g && g.milestones && g.milestones[modal.mIndex];
                const templateLabel = TEMPLATE_LABELS[modal.mIndex] || `Template-${String(modal.mIndex + 1).padStart(2, "0")}`;
                const templateDetail = TEMPLATE_DETAILS[modal.mIndex] || "";
                const uploadedFile = m && m.uploadedFile ? m.uploadedFile : null;
                const currentNote = m && m.note ? m.note : "";

                // Prepare due date/time display and uploadedAt
                const dueRaw = m && m.due ? m.due : null;
                let dueDateObj = null;
                if (dueRaw) {
                  const maybeIso = new Date(dueRaw);
                  if (!isNaN(maybeIso.getTime())) {
                    dueDateObj = maybeIso;
                  } else {
                    const parts = String(dueRaw).split("-");
                    if (parts.length >= 3) {
                      dueDateObj = new Date(parts[0], Number(parts[1]) - 1, parts[2], 23, 59, 59);
                    }
                  }
                }

                // uploadedAt may be in uploadedFile.uploadedAt or uploadedFile.timestamp (support both)
                const uploadedAtRaw = uploadedFile && (uploadedFile.uploadedAt || uploadedFile.timestamp || uploadedFile.time);
                const uploadedDateObj = uploadedAtRaw ? new Date(uploadedAtRaw) : null;

                const isLate = uploadedDateObj && dueDateObj ? uploadedDateObj.getTime() > dueDateObj.getTime() : false;

                // human readable strings
                const dueDisplay =
                  dueDateObj && !isNaN(dueDateObj.getTime()) ? formatDateTime(dueDateObj.toISOString()) : (dueRaw || "—");
                const uploadedDisplay = uploadedDateObj && !isNaN(uploadedDateObj.getTime()) ? formatDateTime(uploadedDateObj.toISOString()) : (uploadedAtRaw ? String(uploadedAtRaw) : "No upload");

                return (
                  <div className="modal-stack">
                    <div className="stack-item">
                      <div className="stack-label">Milestone</div>
                      <div className="stack-value">
                        <strong>{WEEKS[modal.mIndex]}</strong>
                        <div className="muted">{m?.name || ""}</div>
                      </div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Template</div>
                      <div className="stack-value">
                        <div>{templateLabel}</div>
                        {templateDetail && <div className="muted" style={{ marginTop: 6 }}>{templateDetail}</div>}
                      </div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Uploaded File</div>
                      <div className="stack-value">
                        {uploadedFile && uploadedFile.url ? (
                          <div>
                            <a href={uploadedFile.url} target="_blank" rel="noreferrer" className="link-inline">
                              {uploadedFile.name || "View uploaded file"}
                            </a>
                            <div className="muted" style={{ marginTop: 6 }}>Uploaded at: {uploadedDisplay}</div>
                          </div>
                        ) : (
                          <div className="muted">No file uploaded yet</div>
                        )}
                      </div>
                    </div>

                    {/* Due Date/Time */}
                    <div className="stack-item">
                      <div className="stack-label">Due Date & Time</div>
                      <div className="stack-value">
                        <div>{dueDisplay}</div>
                      </div>
                    </div>

                    {/* Submission Date & Time (new field) */}
                    <div className="stack-item">
                      <div className="stack-label">Submission Date & Time</div>
                      <div className="stack-value">
                        {uploadedFile && uploadedDateObj ? (
                          <div>{formatDateTime(uploadedDateObj.toISOString())}</div>
                        ) : (
                          <div className="muted">No submission</div>
                        )}
                      </div>
                    </div>

                    {/* Submission Status (Late / On time / No submission) */}
                    <div className="stack-item">
                      <div className="stack-label">Submission Status</div>
                      <div className="stack-value">
                        {uploadedFile && uploadedDateObj ? (
                          isLate ? (
                            <div style={{ color: "#ef4444", fontWeight: 700 }}>Late submission ({formatDateTime(uploadedDateObj.toISOString())})</div>
                          ) : (
                            <div style={{ color: "#16a34a", fontWeight: 700 }}>On time ({formatDateTime(uploadedDateObj.toISOString())})</div>
                          )
                        ) : (
                          <div className="muted">No submission yet</div>
                        )}
                      </div>
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
import React, { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorMilestones.css";

Chart.register(ArcElement, Tooltip, Legend);

const WEEKS = [
  "Week 1",
  "Week 2",
  "Week 4",
  "Week 6",
  "13th Week before Final Exams",
];

const STATUS = {
  completed: { color: "#16a34a", bg: "#d1fadf", text: "Completed", icon: "✅" },
  pending: { color: "#01337a", bg: "#fef7aa", text: "Pending", icon: "⏳" },
  overdue: { color: "#ef4444", bg: "#fee2e2", text: "Overdue", icon: "❌" },
  rejected: { color: "#ef4444", bg: "#fff0f0", text: "Rejected", icon: "✖️" },
};

const TEMPLATE_LABELS = [
  "Template-01: Project Team (MS Word)",
  "Template-02: Initial Proposal (MS Word)",
  "Template-03: Proposal Presentation (MS PowerPoint)",
  "Template-04: Proposal & Plan (MS Word)",
  "Template-05: Project Report (MS Word)",
  "Template-06: Final Presentation (MS PowerPoint)",
  "Template-07: Progress Presentation (MS PowerPoint)",
];

// Restored three groups (as requested)
const INITIAL_GROUPS = [
  {
    group: "Group 1",
    title: "Smart Attendance System",
    department: "Software Engineering",
    milestones: [
      { name: "Proposal", status: "completed", due: "2025-09-10", uploadedFile: null, note: "" },
      { name: "SRS", status: "pending", due: "2025-09-20", uploadedFile: null, note: "" },
      { name: "Design", status: "pending", due: "2025-09-28", uploadedFile: null, note: "" },
      { name: "Report", status: "pending", due: "2025-10-10", uploadedFile: null, note: "" },
      { name: "Defense", status: "pending", due: "2025-10-25", uploadedFile: null, note: "" },
    ],
    members: ["Ali Raza", "Sana Tariq", "Bilal Khan"],
  },
  {
    group: "Group 2",
    title: "AI-Based Disease Prediction",
    department: "Computer Science",
    milestones: [
      { name: "Proposal", status: "completed", due: "2025-09-11", uploadedFile: null, note: "" },
      { name: "SRS", status: "completed", due: "2025-09-19", uploadedFile: null, note: "" },
      { name: "Design", status: "overdue", due: "2025-09-29", uploadedFile: null, note: "" },
      { name: "Report", status: "pending", due: "2025-10-11", uploadedFile: null, note: "" },
      { name: "Defense", status: "pending", due: "2025-10-28", uploadedFile: null, note: "" },
    ],
    members: ["Ayesha Butt", "Madiha Sumbal", "Saad Farooq"],
  },
  {
    group: "Group 3",
    title: "Online Exam Proctoring",
    department: "Computer Arts",
    templateLink: "https://drive.google.com/drive/folders/CA-TEMPLATES-URL",
    milestones: [
      { name: "Proposal", status: "completed", due: "2025-09-12", uploadedFile: null, note: "" },
      { name: "SRS", status: "completed", due: "2025-09-21", uploadedFile: null, note: "" },
      { name: "Design", status: "completed", due: "2025-09-30", uploadedFile: null, note: "" },
      { name: "Report", status: "pending", due: "2025-10-13", uploadedFile: null, note: "" },
      { name: "Defense", status: "pending", due: "2025-10-27", uploadedFile: null, note: "" },
    ],
    members: ["Fatima Noor", "Usman Ghani", "Hira Qureshi"],
  },
];

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
              name: original ? original.name : "",
              due: original ? original.due : "—",
              status: original ? original.status : "pending",
              uploadedFile: original ? original.uploadedFile : null,
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
            <div className="milestone-group-card" key={group.group}>
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
              >
                {group._show ? "Hide Timeline" : "Show Timeline"}
              </button>

              {group._show && (
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
                              <button className="view-details-btn" onClick={() => openDetails(gIdx, mIdx)}>
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: simplified vertical layout (Week, Template, Template Link, Status dropdown, Update) */}
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
                const templateLink = g.templateLink || (m && m.templateLink) || null;
                const uploadedFile = m && m.uploadedFile ? m.uploadedFile : null;

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
                      <div className="stack-value">{templateLabel}</div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Template Link</div>
                      <div className="stack-value">
                        {templateLink ? (
                          <a href={templateLink} target="_blank" rel="noreferrer" className="link-inline">
                            Open Template Link
                          </a>
                        ) : (
                          <div className="muted">No template link provided</div>
                        )}
                      </div>
                    </div>

                    <div className="stack-item">
                      <div className="stack-label">Uploaded File</div>
                      <div className="stack-value">
                        {uploadedFile && uploadedFile.url ? (
                          <a href={uploadedFile.url} target="_blank" rel="noreferrer" className="link-inline">
                            {uploadedFile.name || "View uploaded file"}
                          </a>
                        ) : (
                          <div className="muted">No file uploaded yet</div>
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
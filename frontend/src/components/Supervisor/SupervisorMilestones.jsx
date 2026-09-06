import React, { useState, useEffect, useMemo } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService.jsx";
import SemesterStartService from "../Api/SemesterStartService.jsx";
import supervisorService from "../Api/supervisorService.jsx";

import "./SupervisorMilestones.css";

const TEMPLATE_DEFINITIONS = [
    // FYP-1 Templates (6)
    { code: "t01", label: "Template-01: Project Team List (MS Word)", week: 1, year: "FYP-1" },
    { code: "t02", label: "Template-02: Initial Proposal (MS Word)", week: 2, year: "FYP-1" },
    { code: "t03", label: "Template-03: Proposal Presentation (PPT)", week: 4, year: "FYP-1" },
    { code: "t04", label: "Template-04: Proposal & Plan (MS Word)", week: 6, year: "FYP-1" },
    { code: "t05", label: "Template-05: Project Report (MS Word)", week: 8, year: "FYP-1" },
    { code: "t07", label: "Template-07: Final Presentation (PPT)", week: 15, year: "FYP-1" },

    // FYP-2 Templates (2)
    { code: "t05", label: "FYP-2: Template-05: Project Report (MS Word)", week: 13, year: "FYP-2" },
    { code: "t06", label: "FYP-2: Template-06: Complete Project Report (PPT)", week: 14, year: "FYP-2" }
];

const formatDateTime = (inp) => {
    if (!inp) return "—";
    const d = new Date(inp);
    return isNaN(d.getTime()) ? String(inp) : d.toLocaleDateString();
};

const calculateDueDate = (semesterStart, weekNumber) => {
    if (!semesterStart || !Number.isInteger(weekNumber)) return null;
    const dueDate = new Date(semesterStart);
    dueDate.setDate(semesterStart.getDate() + weekNumber * 7);
    return dueDate;
};

const initializeMilestones = (backendMilestones = [], definitions = TEMPLATE_DEFINITIONS) => {
    return definitions.map((template) => {
        const backendMilestone = backendMilestones.find((m) => m.code === template.code) || {};
        return {
            code: template.code,
            templateCode: template.code,
            name: template.label,
            week: template.week,
            status: backendMilestone.status || "pending",
            due: backendMilestone.due || null,
            uploadedFile: backendMilestone.uploadedFile || null,
            note: backendMilestone.note || "",
        };
    });
};

export default function SupervisorMilestones() {
    const [groups, setGroups] = useState([]);
    const [semesterStart, setSemesterStart] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [submissionsData, setSubmissionsData] = useState({});
    const [modal, setModal] = useState({
        open: false,
        groupId: null,
        milestoneIndex: null,
        selectedAction: "pending",
        saving: false,
    });
    const [confirmModal, setConfirmModal] = useState({ open: false, message: "", onConfirm: null });

    const [depTemplates, setDepTemplates] = useState([]);
    const supervisorDept = localStorage.getItem("department");

    const fetchDepTemplates = async () => {
        if (!supervisorDept) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates?department=${supervisorDept}`);
            if (res.ok) {
                const data = await res.json();
                setDepTemplates(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching department templates:", err);
        }
    };

    useEffect(() => {
        const fetchSemesterStart = async () => {
            try {
                const data = await SemesterStartService.getDate();
                if (data?.date) {
                    setSemesterStart(new Date(data.date));
                }
            } catch (err) {
                toastService.error("Failed to fetch semester start date");
            }
        };
        fetchSemesterStart();
        fetchDepTemplates();
    }, []);

    const filteredDefinitions = useMemo(() => {
        if (!depTemplates || depTemplates.length === 0) return TEMPLATE_DEFINITIONS;
        // Only show templates that the coordinator has uploaded for this department
        return TEMPLATE_DEFINITIONS.filter(def =>
            depTemplates.some(dt => dt.template === def.code)
        );
    }, [depTemplates]);

    const loadGroups = async () => {
        try {
            const res = await supervisorService.getSupervisorGroups();
            const mapped = res.groups.map((g) => ({
                id: g.groupId,
                maskedId: g.maskedGroupId,
                title: g.description,
                members: g.members,
                special: g.special,
                archived: g.status === "Archived" || g.isArchived || false,
                canArchive: g.canArchive || false,
                milestonesTotal: 8,
                milestonesCompleted: g.milestonesCompleted || 0,
                baseMilestones: initializeMilestones(g.milestones, filteredDefinitions),
            }));
            setGroups(mapped);
        } catch (err) {
            console.error("Error fetching supervisor groups:", err);
            toastService.error("Failed to load groups from backend");
        }
    };


    useEffect(() => {
        if (filteredDefinitions.length > 0) {
            loadGroups();
        }
    }, [filteredDefinitions]);

    const currentWeekNumber = useMemo(() => {
        if (!semesterStart) return null;
        const diffMs = new Date().getTime() - semesterStart.getTime();
        if (diffMs < 0) return 0;
        return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    }, [semesterStart]);

    const activeTemplateIndex = useMemo(() => {
        if (currentWeekNumber == null) return null;
        let idx = filteredDefinitions.reduce(
            (acc, t, i) => (t.week <= currentWeekNumber ? i : acc),
            -1
        );
        if (idx === -1) idx = 0;
        if (currentWeekNumber > filteredDefinitions[filteredDefinitions.length - 1]?.week) {
            idx = filteredDefinitions.length - 1;
        }
        return idx;
    }, [currentWeekNumber, filteredDefinitions]);

    const toggleSubmissions = async (groupId) => {
        const isExpanded = expandedGroups[groupId];

        if (isExpanded) {
            setExpandedGroups((prev) => ({ ...prev, [groupId]: false }));
            return;
        }

        try {
            const response = await supervisorService.fetchGroupSubmissions(groupId);
            const submissions = response.submissions || [];

            if (submissions.length === 0) {
                toastService.info("No submissions found for this group");
            }

            const groupedByWeek = submissions.reduce((acc, s) => {
                const key = `week-${s.week}-${s.templateCode}`;

                if (!acc[key]) {
                    acc[key] = [];
                }

                acc[key].push({
                    weekLabel: `Week ${s.week}`,
                    name: s.templateLabel,
                    week: s.week,
                    templateCode: s.templateCode,
                    due: null,
                    status: s.status.toLowerCase().replace(/\s+/g, "-"),
                    uploadedFile: {
                        url: s.filePath.replace(/\\/g, "/"),
                        name: s.originalName,
                        uploadedAt: s.uploadedAt,
                    },
                    note: s.supervisorRemarks || "",
                    _id: s._id,
                    fypPart: s.fypPart, // Critical: Ensure we store fypPart for backend updates
                });

                return acc;
            }, {});

            const formattedSubmissions = Object.values(groupedByWeek)
                .flatMap(weekSubmissions =>
                    weekSubmissions.sort((a, b) =>
                        new Date(b.uploadedFile.uploadedAt) - new Date(a.uploadedFile.uploadedAt)
                    )
                )
                .sort((a, b) => a.week - b.week);

            setSubmissionsData((prev) => ({ ...prev, [groupId]: formattedSubmissions }));
            setExpandedGroups((prev) => ({ ...prev, [groupId]: true }));
        } catch (err) {
            console.error(err);
            toastService.error("Failed to fetch group submissions");
        }
    };

    const archiveGroup = (groupId) => {
        setConfirmModal({
            open: true,
            message: "Are you sure you want to move this project to the official FYP Archive? This will remove it from your active milestones.",
            onConfirm: () => executeArchiveGroup(groupId)
        });
    };

    const executeArchiveGroup = async (groupId) => {
        setConfirmModal({ open: false, message: "", onConfirm: null });
        try {
            const res = await supervisorService.archiveGroup(groupId);
            if (res.success) {
                setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, archived: true, canArchive: false } : g));
                setExpandedGroups((prev) => ({ ...prev, [groupId]: false }));
                toastService.success(res.message || "Group added to archive");
            } else {
                toastService.error(res.message || "Failed to archive group");
            }
        } catch (err) {
            console.error("Archive error:", err);
            toastService.error("Error archiving group.");
        }
    };

    const openDetails = (groupId, milestoneIndex) => {
        const group = groups.find((g) => g.id === groupId);
        const isExpanded = expandedGroups[groupId];
        const milestones = isExpanded ? submissionsData[groupId] : group.baseMilestones;
        const milestone = milestones[milestoneIndex];

        const defaultAction =
            milestone.status === "approved" || milestone.status === "Approved" || milestone.status === "completed"
                ? "approve"
                : milestone.status === "rejected" || milestone.status === "Rejected"
                    ? "unapprove"
                    : "pending";

        setModal({
            open: true,
            groupId,
            milestoneIndex,
            selectedAction: defaultAction,
            saving: false,
        });
    };

    const closeDetails = () => {
        setModal({
            open: false,
            groupId: null,
            milestoneIndex: null,
            selectedAction: "pending",
            saving: false,
        });
    };

    const handleActionChange = (value) => {
        setModal((s) => ({ ...s, selectedAction: value }));
    };

    const handleNoteChange = (value) => {
        const { groupId, milestoneIndex } = modal;
        if (!groupId || milestoneIndex == null) return;

        const isExpanded = expandedGroups[groupId];

        if (isExpanded) {
            setSubmissionsData((prev) => ({
                ...prev,
                [groupId]: prev[groupId].map((m, i) =>
                    i === milestoneIndex ? { ...m, note: value } : m
                ),
            }));
        } else {
            setGroups((prev) =>
                prev.map((g) =>
                    g.id === groupId
                        ? {
                            ...g,
                            baseMilestones: g.baseMilestones.map((m, i) =>
                                i === milestoneIndex ? { ...m, note: value } : m
                            ),
                        }
                        : g
                )
            );
        }
    };

    const handleUpdateStatusClick = () => {
        const { groupId, milestoneIndex, selectedAction } = modal;
        if (!groupId || milestoneIndex == null) return;

        const group = groups.find((g) => g.id === groupId);
        const isExpanded = expandedGroups[groupId];
        const milestones = isExpanded ? submissionsData[groupId] : group.baseMilestones;
        const milestone = milestones[milestoneIndex];

        if (!milestone.note) {
            toastService.info("Comments are required");
            return;
        }

        const confirmMsg =
            selectedAction === "approve"
                ? "Approve this milestone? This will mark it as Completed."
                : selectedAction === "unapprove"
                    ? "Mark this milestone as Rejected?"
                    : "Mark this milestone as Pending?";

        setConfirmModal({
            open: true,
            message: confirmMsg,
            onConfirm: executeUpdateStatus
        });
    };

    const executeUpdateStatus = async () => {
        const { groupId, milestoneIndex, selectedAction } = modal;
        setConfirmModal({ open: false, message: "", onConfirm: null });
        if (!groupId || milestoneIndex == null) return;

        const mappedStatus =
            selectedAction === "approve"
                ? "Approved"
                : selectedAction === "unapprove"
                    ? "Rejected"
                    : "Pending";

        const group = groups.find((g) => g.id === groupId);
        const isExpanded = expandedGroups[groupId];
        const milestones = isExpanded ? submissionsData[groupId] : group.baseMilestones;
        const milestone = milestones[milestoneIndex];
        const milestoneCode = milestone.templateCode;

        setModal((s) => ({ ...s, saving: true }));

        try {
            await supervisorService.updateMilestoneStatus(groupId, milestoneCode, {
                status: mappedStatus,
                note: milestone.note,
                fypPart: milestone.fypPart, // Pass fypPart to distinguish duplicate codes like t05
            });

            if (isExpanded) {
                setSubmissionsData((prev) => ({
                    ...prev,
                    [groupId]: prev[groupId].map((m, i) =>
                        i === milestoneIndex ? { ...m, status: mappedStatus } : m
                    ),
                }));
            } else {
                setGroups((prev) =>
                    prev.map((g) =>
                        g.id === groupId
                            ? {
                                ...g,
                                baseMilestones: g.baseMilestones.map((m, i) =>
                                    i === milestoneIndex ? { ...m, status: mappedStatus } : m
                                ),
                            }
                            : g
                    )
                );
            }

            toastService.success("Milestone updated successfully");
            closeDetails();
        } catch (err) {
            toastService.error("Failed to update milestone");
            setModal((s) => ({ ...s, saving: false }));
        }
    };

    return (
        <div>
            <DashboardSectionHeader description="Here you can view all the FYP groups milestones. Click 'Show Submissions' to see groups progress, milestones, and deadlines.">
                Milestones & Timeline
            </DashboardSectionHeader>

            <div className="supervisor-timeline-wrap" aria-hidden={!semesterStart}>
                {semesterStart ? (
                    <div className="supervisor-timeline compact-grid">
                        <div className="timeline-header">
                            <div style={{ marginTop: 2, marginBottom: 10, paddingRight: 5 }}>
                                <span>
                                    <strong>Current Academic Timeline</strong> | Semester Start:{" "}
                                    <strong>{formatDateTime(semesterStart)}</strong> | Current Week:{" "}
                                    <strong>{currentWeekNumber ?? "—"}</strong>
                                </span>
                            </div>
                        </div>

                        <div className="timeline-grid">
                            {filteredDefinitions.map((tpl, i) => {
                                const due = calculateDueDate(semesterStart, tpl.week);
                                const completed = currentWeekNumber != null && tpl.week < currentWeekNumber;
                                const active = activeTemplateIndex === i;

                                return (
                                    <div
                                        key={`${tpl.code}-${tpl.year}`}
                                        className={`timeline-card ${completed ? "completed" : ""} ${active ? "active" : ""}`}
                                    >
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
                    <div className="supervisor-timeline-placeholder">
                        Timeline not configured (semester start missing)
                    </div>
                )}
            </div>

            {/* Milestone Groups */}
            <div className="milestone-groups-row">
                {groups.map((group) => {
                    const isExpanded = expandedGroups[group.id];
                    const milestones = isExpanded ? submissionsData[group.id] || [] : group.baseMilestones;

                    return (
                        <div className={`milestone-group-card ${group.archived ? "archived" : ""}`} key={group.id}>
                            <div className="milestone-card-header">
                                <div>
                                    <div className="milestone-card-group">{group.maskedId}</div>
                                    <div className="milestone-card-title">{group.title}</div>
                                    <div className="milestone-card-department">
                                        <b>Domain:</b> {group.special}
                                    </div>
                                    <div className="milestone-card-members">
                                        <b>Members:</b> {group.members?.map(m => typeof m === 'object' ? m.name : m).join(", ")}
                                    </div>
                                    <div className="milestone-card-progress" style={{ marginTop: 8, fontSize: "0.9rem", color: "#16a34a", fontWeight: 700 }}>
                                        <b>Progress:</b> {group.milestonesCompleted} / {group.milestonesTotal} Milestones
                                    </div>
                                </div>
                            </div>

                            <button className="milestone-toggle-btn" onClick={() => toggleSubmissions(group.id)} disabled={group.archived}>
                                {isExpanded ? "Hide Submissions" : "Show Submissions"}
                            </button>

                            {isExpanded && !group.archived && (
                                <div className="milestone-timeline-table-wrap">
                                    <table className="milestone-timeline-table">
                                        <thead>
                                            <tr>
                                                <th className="milestone-th">Milestone</th>
                                                <th className="milestone-th">Uploaded Date</th>
                                                <th className="milestone-th">Status</th>
                                                <th className="milestone-th">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {milestones.map((m, mIdx) => (
                                                <tr key={mIdx}>
                                                    <td className="milestone-td">{m.weekLabel}</td>
                                                    <td className="milestone-td">{formatDateTime(m.uploadedFile?.uploadedAt)}</td>
                                                    <td className="milestone-td">{m.status}</td>
                                                    <td className="milestone-td">
                                                        <button className="view-details-btn" onClick={() => openDetails(group.id, mIdx)}>
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {group.canArchive && (
                                        <div className="archive-button-wrap">
                                            <button className="archive-btn" onClick={() => archiveGroup(group.id)}>
                                                Add to Archive
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {group.archived && (
                                <div className="milestone-archived-note" style={{ color: '#01337a', fontWeight: 'bold' }}>
                                    Submitted to Archive
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {modal.open && modal.groupId != null && modal.milestoneIndex != null && (
                <div className="mmodal-backdrop" role="dialog" aria-modal="true">
                    <div className="mmodal modal-centered" role="document" aria-labelledby="milestone-details-title">
                        <div className="mmodal-header">
                            <h3 id="milestone-details-title">Milestone Details</h3>
                            <button className="mmodal-close" onClick={closeDetails} aria-label="Close">✖</button>
                        </div>

                        <div className="mmodal-body centered-body">
                            {(() => {
                                const group = groups.find((g) => g.id === modal.groupId);
                                const isExpanded = expandedGroups[modal.groupId];
                                const milestones = isExpanded ? submissionsData[modal.groupId] : group.baseMilestones;
                                const milestone = milestones[modal.milestoneIndex];

                                // ✅ FIX: find template by milestone.templateCode
                                const template = filteredDefinitions.find(t => t.code === milestone.templateCode);

                                return (
                                    <div className="modal-stack">
                                        <div className="stack-item">
                                            <div className="stack-label">Milestone</div>
                                            <div className="stack-value">
                                                <strong>{template ? `Week ${template.week}` : "—"}</strong>
                                            </div>
                                        </div>

                                        <div className="stack-item">
                                            <div className="stack-label">Template</div>
                                            <div className="stack-value">{template ? template.label : milestone.name}</div>
                                        </div>

                                        <div className="stack-item">
                                            <div className="stack-label">Uploaded File</div>
                                            <div className="stack-value">
                                                {milestone.uploadedFile?.url ? (
                                                    <div>
                                                        <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${milestone.uploadedFile.url}`} target="_blank" rel="noreferrer" className="link-inline">
                                                            {milestone.uploadedFile.name || "View uploaded file"}
                                                        </a>
                                                        {milestone.uploadedFile.uploadedAt && (
                                                            <div className="muted" style={{ marginTop: 6 }}>
                                                                Uploaded at: {formatDateTime(milestone.uploadedFile.uploadedAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="muted">No file uploaded yet</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="stack-item">
                                            <div className="stack-label">Current Status</div>
                                            <div className="stack-value">{milestone.status}</div>
                                        </div>

                                        <div className="stack-item">
                                            <div className="stack-label">Update Status</div>
                                            <select className="status-select" value={modal.selectedAction} onChange={(e) => handleActionChange(e.target.value)}>
                                                <option value="approve">Approved</option>
                                                <option value="unapprove">Rejected</option>
                                                <option value="pending">Pending</option>
                                            </select>
                                        </div>

                                        <div className="stack-item">
                                            <div className="stack-label">Comment</div>
                                            <textarea
                                                className="mm-notes"
                                                placeholder="Add an optional comment for the student (e.g. required fixes)"
                                                value={milestone.note}
                                                onChange={(e) => handleNoteChange(e.target.value)}
                                            />
                                        </div>

                                        <div className="stack-actions">
                                            <button className="btn-update" onClick={handleUpdateStatusClick} disabled={modal.saving}>
                                                {modal.saving ? "Updating..." : "Update"}
                                            </button>
                                            <button className="btn-cancel" onClick={closeDetails}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Separate Custom Confirmation Modal */}
            {confirmModal.open && (
                <div className="mmodal-backdrop" style={{ zIndex: 1300 }}>
                    <div className="mmodal" style={{ maxWidth: "400px", textAlign: "center", padding: "30px" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px", color: "#1e293b" }}>
                            Confirm Action
                        </div>
                        <div style={{ marginBottom: "30px", color: "#475569", lineHeight: "1.5" }}>
                            {confirmModal.message}
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                className="btn-update"
                                style={{ width: "120px" }}
                                onClick={() => {
                                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                                }}
                            >
                                Yes, Confirm
                            </button>
                            <button
                                className="btn-cancel"
                                style={{ width: "120px" }}
                                onClick={() => setConfirmModal({ open: false, message: "", onConfirm: null })}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
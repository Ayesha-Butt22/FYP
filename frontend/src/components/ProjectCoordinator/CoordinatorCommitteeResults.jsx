import React, { useEffect, useState } from "react";
import axios from "axios";
import ToastService, { toastService } from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./CommitteeResults.css";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTime,
  Place,
} from "@mui/icons-material";

export default function CoordinatorCommitteeResults() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/committee-evaluation");
        if (res.data.success && Array.isArray(res.data.data)) {
          // Group items by (groupId + scheduleId) to aggregate panel evaluations for a specific milestone
          const groupedData = {};
          res.data.data.forEach((item) => {
            const rawGroupId = item.groupId?._id?.toString() || item.groupId?.toString() || "Unknown";
            const rawSchedId = item.scheduleId?._id?.toString() || item.scheduleId?.toString() || "Unknown";
            const groupKey = `${rawGroupId}-${rawSchedId}`;

            if (!groupedData[groupKey]) {
              groupedData[groupKey] = { ...item, evaluations: [...(item.evaluations || [])] };
            } else {
              groupedData[groupKey].evaluations.push(...(item.evaluations || []));
            }
          });

          const formatted = Object.values(groupedData).map((item) => {
            const group = item.groupId || {};
            const schedule = item.scheduleId || {};
            const slot = (schedule.slots || []).find((s) => String(s._id) === String(item.slotId)) || {};
            const evaluations = (item.evaluations || []).map((ev) => ({
              evaluatedBy: ev.evaluatedBy?.name || "N/A",
              email: ev.evaluatedBy?.email,
              role: ev.evaluatedBy?.role,
              comments: ev.comments || "—",
              submittedAt: ev.submittedAt ? new Date(ev.submittedAt).toLocaleString() : "N/A",
              cloMarks: ev.cloMarks || null,
              totalCloMarks: ev.totalCloMarks || 0,
              students: (ev.students || []).map((s) => ({
                name: s.name,
                sapId: s.studentId,
                presentation: s.presentationMarks,
                performance: s.performanceMarks,
              })),
            }));

            // Render raw group label, skip shortening if it's not a mongoose id
            const rawGrpLabel = group.groupId || item._id?.toString() || "Unknown";
            const maskedGroupId = /^[0-9a-fA-F]{24}$/.test(rawGrpLabel)
              ? `Group-${rawGrpLabel.slice(-5)}` : rawGrpLabel;

            return {
              id: item._id, // main document ID
              groupId: maskedGroupId,
              rawGroupId: group.groupId || rawGrpLabel,
              week: schedule.week || "N/A",
              fypPart: schedule.fypPart || "",
              venue: schedule.venue || "Not Assigned",
              slotTime: slot.startTime
                ? `${new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(slot.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "N/A",
              evaluations,
              createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A",
              isApproved: item.isApprovedByCoordinator,
              supervisorEmail: item.supervisorEmail || null,
              assignedPanelSize: item.assignedPanelSize || 0,
            };
          });

          // ── Deduplicate: one row per group per week+fypPart ─────────────
          // If same group booked in two venues for same week, merge into one row
          const deduped = {};
          formatted.forEach((row) => {
            const key = `${row.rawGroupId}-${row.week}-${row.fypPart}`;
            if (!deduped[key]) {
              deduped[key] = { ...row };
            } else {
              // Merge evaluations from the duplicate row
              deduped[key].evaluations = [
                ...deduped[key].evaluations,
                ...row.evaluations,
              ];

              // Prefer the approved row's id for publish actions
              if (row.isApproved && !deduped[key].isApproved) {
                deduped[key].id = row.id;
                deduped[key].isApproved = true;
              }
              // Append venue info so coordinator knows both venues
              if (row.venue !== deduped[key].venue) {
                deduped[key].venue = `${deduped[key].venue}, ${row.venue}`;
              }
            }
          });

          setRows(Object.values(deduped));
        } else {
          setRows([]);
        }
      } catch (err) {
        console.error(err);
        toastService.error("Failed to fetch evaluations.");
      }
    };
    fetchEvaluations();
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const computeFinalMarks = (evaluations) => {
    const numPanels = evaluations.length;
    if (numPanels === 0) return null;

    const studentMap = {};
    evaluations.forEach((ev) => {
      ev.students.forEach((stu) => {
        if (!studentMap[stu.name]) {
          studentMap[stu.name] = {
            sapId: stu.sapId,
            presentations: [],
            performances: []
          };
        }
        studentMap[stu.name].presentations.push(stu.presentation ?? 0);
        studentMap[stu.name].performances.push(stu.performance ?? 0);
      });
    });

    const students = Object.entries(studentMap).map(([name, data]) => {
      const avgPres = data.presentations.reduce((a, b) => a + b, 0) / data.presentations.length;
      const avgPerf = data.performances.reduce((a, b) => a + b, 0) / data.performances.length;

      const cloEvs = evaluations.filter((ev) => ev.cloMarks !== null);
      // Logic Update: Divide by total panel size, treat missing as 0
      const totalPanelMembers = evaluations[0]?.scheduleId?.facultyPanels?.length || evaluations[0]?.assignedPanelSize || evaluations.length || 1;

      const sumClo = cloEvs.reduce((sum, ev) => sum + ev.totalCloMarks, 0);
      const avgClo = sumClo / totalPanelMembers;

      const finalCloPortion = +(avgClo * 0.5).toFixed(2);
      const finalTotal = finalCloPortion;

      return {
        name,
        sapId: data.sapId,
        finalPresentation: +(avgPres * 0.5).toFixed(2),
        finalPerformance: +(avgPerf * 0.5).toFixed(2),
        finalTotal,
        finalCloPortion
      };
    });

    const cloEvs = evaluations.filter((ev) => ev.cloMarks !== null);
    const totalPanelMembers = evaluations[0]?.assignedPanelSize || evaluations.length || 1;
    const sumClo = cloEvs.reduce((sum, ev) => sum + ev.totalCloMarks, 0);
    const avgClo = sumClo / totalPanelMembers;
    const finalCloMarks = +(avgClo * 0.5).toFixed(2);

    return { students, finalCloMarks, numPanels, assignedPanelSize: totalPanelMembers, hasClo: cloEvs.length > 0 };
  };

  const handlePublish = async (row) => {
    if (row.isApproved) {
      toastService.info('Evaluation already published');
      return;
    }
    try {
      const res = await axios.post(`http://localhost:5000/api/committee-evaluation/approve`, {
        id: row.id,
      });
      if (res.data.success) {
        toastService.success('Evaluation published successfully');
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, isApproved: true } : r));
      } else {
        toastService.error(res.data.message || 'Evaluation publish failed');
      }
    } catch (err) {
      console.error(err);
      toastService.error(err.response?.data?.message || 'Server error during publish');
    }
  }

  return (
    <div className="cor-committee-container">
      <DashboardSectionHeader description="Coordinator view of all committee evaluations. Expand a group to view detailed remarks and marks.">
        Committee Evaluation Results
      </DashboardSectionHeader>

      <div className="cor-committee-paper">
        <table className="cor-committee-table">
          <thead className="cor-committee-thead">
            <tr>
              <th style={{ width: "40px" }}></th>
              <th><strong>Week</strong></th>
              <th><strong>Group #</strong></th>
              <th><strong>Student Names</strong></th>
              <th><strong>Venue</strong></th>
              <th><strong>Time</strong></th>
              <th><strong>Action</strong></th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="cor-committee-empty">
                  No evaluations found.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                // Collect student names from ALL panel evaluations (union)
                const allStudentNames = [
                  ...new Set(
                    (row.evaluations || []).flatMap((ev) => ev.students.map((s) => s.name))
                  )
                ].join(", ") || "No Students";

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className="cor-committee-row"
                      onClick={() => toggleExpand(row.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {expanded[row.id] ? (
                          <KeyboardArrowUp fontSize="small" />
                        ) : (
                          <KeyboardArrowDown fontSize="small" />
                        )}
                      </td>
                      <td className="cor-week-cell">
                        <span className="cor-week-badge">{row.week}</span>
                        {row.fypPart && (
                          <span className="cor-fyp-badge">{row.fypPart.toUpperCase()}</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: "#013379" }}>{row.groupId}</td>
                      <td>{allStudentNames}</td>
                      <td className="cor-venue-cell">
                        <div>
                          <Place fontSize="small" color="primary" />
                          <span>{row.venue}</span>
                        </div>
                      </td>
                      <td className="cor-time-cell">
                        <div>
                          <AccessTime fontSize="small" color="secondary" />
                          <span>{row.slotTime}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px', color: row.evaluations.length < row.assignedPanelSize ? '#f43f5e' : '#16a34a', fontWeight: 600 }}>
                          {row.evaluations.length} / {row.assignedPanelSize} Submitted
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`cor-action-btn ${row.isApproved ? 'cor-published-btn' : 'cor-main-btn'}`}
                          onClick={() => handlePublish(row)}
                          disabled={row.isApproved}
                        >
                          {row.isApproved ? '✅ Published' : 'Publish'}
                        </button>
                      </td>
                    </tr>

                    {expanded[row.id] && (
                      <tr>
                        <td colSpan="7" className="cor-committee-expand">
                          <div className="cor-committee-expand-content">
                            <div className="cor-expand-title">
                              📋 Evaluations by Panel Members ({row.evaluations.length})
                            </div>
                            {(row.evaluations || []).map((evalItem, i) => {
                              const evaluatorName = evalItem.evaluatedBy && typeof evalItem.evaluatedBy === 'object' ? evalItem.evaluatedBy.name : evalItem.evaluatedBy || 'N/A';
                              return (
                                <div key={i} className="cor-committee-panel-card">
                                  <div className="cor-committee-panel-header">
                                    👤 Panel Member: {evaluatorName}{" "}
                                    <span className="cor-panel-role">({evalItem.role})</span>
                                  </div>

                                  {/* Individual marks hidden for Coordinator as per request */}


                                  <div className="cor-committee-comments" style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', borderLeft: '4px solid #013379' }}>
                                    <strong>Comments:</strong> {evalItem.comments}
                                  </div>

                                  <div className="cor-committee-submitted">
                                    Submitted at: {evalItem.submittedAt}
                                  </div>
                                </div>
                              );
                            })}

                            {/* ═══════ FINAL MARKS SUMMARY (× 50%) ═══════ */}
                            {!/\b4\b/.test(row.week) && (() => {
                              const fm = computeFinalMarks(row.evaluations || []);
                              if (!fm) return null;
                              return (
                                <div className="cor-final-marks-card">
                                  <div className="cor-final-marks-header">
                                    🏆 Final Marks Summary
                                    {/* <span className="cor-final-marks-rule">
                                      Formula: Panel Avg (CLO) × 50% = 50 Marks (Committee Grade)
                                    </span> */}
                                  </div>

                                  <table className="cor-final-marks-table">
                                    <thead>
                                      <tr>
                                        <th>Student</th>
                                        <th>Committee Score (/50)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {fm.students.map((stu, k) => (
                                        <tr key={k}>
                                          <td>
                                            <strong>{stu.name}</strong>
                                            {stu.sapId && (
                                              <span style={{ color: "#888", marginLeft: 6, fontSize: "0.82em" }}>({stu.sapId})</span>
                                            )}
                                          </td>
                                          <td className="cor-final-mark cor-final-total" style={{ textAlign: 'center' }}>{stu.finalTotal}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>

                                  {fm.hasClo && (
                                    <div className="cor-final-clo">
                                      📊 Panel Average: <strong>{fm.finalCloMarks} / 50</strong>
                                      <span className="cor-final-clo-note">  (Avg CLO scaled to 50)</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

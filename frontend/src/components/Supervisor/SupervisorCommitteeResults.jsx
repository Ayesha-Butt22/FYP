import React, { useEffect, useState } from "react";
import axios from "axios";
import { toastService } from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTime,
  Place
} from "@mui/icons-material";
import {
  Box,
  CircularProgress
} from "@mui/material";
import "../ProjectCoordinator/CommitteeResults.css";

export default function SupervisorCommitteeResults() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem('email');

  const maskGroupId = (id) => {
    if (!id) return "Unknown";
    const s = String(id);
    if (/[0-9a-fA-F]{24,}/.test(s)) {
      return `Group-${s.slice(-5).toUpperCase()}`;
    }
    return s;
  };

  useEffect(() => {
    if (!email) return;
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/committee-evaluation/onlyApproved?supervisor=${encodeURIComponent(email)}`);
        if (res.data.success && Array.isArray(res.data.data)) {
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
              submittedAt: new Date(ev.submittedAt).toLocaleString(),
              cloMarks: ev.cloMarks || null,
              totalCloMarks: ev.totalCloMarks || 0,
              students: (ev.students || []).map((s) => ({
                name: s.name,
                sapId: s.studentId,
                presentation: s.presentationMarks,
                performance: s.performanceMarks,
              })),
            }));

            return {
              id: item._id,
              groupId: maskGroupId(group.groupId || item._id),
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
              rawMongoId: item._id,
            };
          }).filter(row => {
            // Strictly exclude anything not supervised by the current user
            // We use the supervisorEmail field which the backend resolved from Proposals
            const currentEmail = email.toLowerCase().trim();
            const currentSupField = String(row.supervisorEmail || "").toLowerCase().trim();
            // Note: supervisorEmail could be the name, so check if it contains/matches
            return currentSupField === currentEmail || currentSupField.includes(currentEmail) || currentEmail.includes(currentSupField);
          });
          setRows(formatted);
        }
      } catch (err) {
        console.error(err);
        toastService.error("Failed to fetch evaluations.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, [email]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const computeFinalMarks = (evaluations) => {
    if (!evaluations || evaluations.length === 0) return null;

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
      const cloEvs = evaluations.filter((ev) => ev.cloMarks !== null);
      const totalPanelMembers = evaluations[0]?.scheduleId?.facultyPanels?.length || evaluations[0]?.assignedPanelSize || cloEvs.length || 1;
      const sumClo = cloEvs.reduce((sum, ev) => sum + ev.totalCloMarks, 0);
      const avgClo = sumClo / totalPanelMembers;

      const finalTotal = +(avgClo * 0.5).toFixed(2);

      return {
        name,
        sapId: data.sapId,
        finalTotal
      };
    });

    const cloEvs = evaluations.filter((ev) => ev.cloMarks !== null);
    const avgClo = cloEvs.length > 0
      ? cloEvs.reduce((sum, ev) => sum + ev.totalCloMarks, 0) / cloEvs.length
      : 0;
    const finalCloMarks = +(avgClo * 0.5).toFixed(2);

    return { students, finalCloMarks, numPanels: evaluations.length, hasClo: cloEvs.length > 0 };
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
      <CircularProgress color="primary" />
    </Box>
  );

  return (
    <div className="cor-committee-container">
      <DashboardSectionHeader description="Consolidated feedback and aggregate committee scoring for your FYP groups.">
        Supervised Committee Results
      </DashboardSectionHeader>

      <div className="cor-committee-paper" style={{ marginTop: "20px" }}>
        <table className="cor-committee-table">
          <thead className="cor-committee-thead">
            <tr>
              <th style={{ width: "40px" }}></th>
              <th><strong>Week</strong></th>
              <th><strong>Group #</strong></th>
              <th><strong>Student Names</strong></th>
              <th><strong>Venue</strong></th>
              {/* <th><strong>Time</strong></th> */}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="cor-committee-empty">
                  No evaluations found for your supervised groups.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const allStudentNames = [
                  ...new Set(row.evaluations.flatMap((ev) => ev.students.map((s) => s.name)))
                ].join(", ");

                const finalMarks = computeFinalMarks(row.evaluations);

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
                        {/* <div>
                          <AccessTime fontSize="small" color="secondary" />
                          <span>{row.slotTime}</span>
                        </div> */}
                        {/* <div style={{ fontSize: '0.75rem', marginTop: '4px', color: row.evaluations.length < row.assignedPanelSize ? '#f43f5e' : '#16a34a', fontWeight: 600 }}>
                          {row.evaluations.length} / {row.assignedPanelSize} Submitted
                        </div> */}
                      </td>
                    </tr>

                    {expanded[row.id] && (
                      <tr>
                        <td colSpan="6" className="cor-committee-expand">
                          <div className="cor-committee-expand-content">
                            <div className="cor-expand-title">
                              📋 Evaluations by Panel Members ({row.evaluations.length})
                            </div>
                            {(row.evaluations || []).map((evalItem, i) => {
                              const evaluatorName = (evalItem.evaluatedBy && typeof evalItem.evaluatedBy === 'object') ? evalItem.evaluatedBy.name : (evalItem.evaluatedBy || 'N/A');
                              return (
                                <div key={i} className="cor-committee-panel-card">
                                  <div className="cor-committee-panel-header">
                                    👤 Panel Member: {evaluatorName}{" "}
                                    <span className="cor-panel-role">({evalItem.role})</span>
                                  </div>

                                  <div className="cor-committee-comments" style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', borderLeft: '4px solid #013379' }}>
                                    <strong>Comments:</strong> {evalItem.comments}
                                  </div>

                                  <div className="cor-committee-submitted">
                                    Submitted at: {evalItem.submittedAt}
                                  </div>
                                </div>
                              );
                            })}

                            {/* FINAL MARKS SUMMARY */}
                            {String(row.week).trim() !== "Week 4" && (() => {
                              if (!finalMarks) return null;
                              return (
                                <div className="cor-final-marks-card">
                                  <div className="cor-final-marks-header">
                                    🏆 Final Marks Summary
                                  </div>

                                  <table className="cor-final-marks-table">
                                    <thead>
                                      <tr>
                                        <th>Student</th>
                                        <th>Committee Score (/50)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {finalMarks.students.map((stu, k) => (
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

                                  {finalMarks.hasClo && (
                                    <div className="cor-final-clo">
                                      📊 Panel Average Score: <strong>{finalMarks.finalCloMarks} / 50</strong>
                                      <span className="cor-final-clo-note"> (Avg CLO scaled to 50)</span>
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

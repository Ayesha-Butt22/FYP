import React, { useEffect, useState } from "react";
import axios from "axios";
import ToastService, { toastService } from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./CommitteeResults.css";
import {
  AccessTime,
  Place,
  Info as InfoIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from "@mui/material";

export default function CoordinatorCommitteeResults() {
  const [rows, setRows] = useState([]);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

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
              projectTitle: item.project?.projectTitle || "N/A",
              venue: schedule.venue || "Not Assigned",
              slotTime: slot.startTime
                ? new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "N/A",
              evaluations,
              createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A",
              isApproved: item.isApprovedByCoordinator,
              supervisorEmail: item.supervisorEmail || null,
              assignedPanelSize: item.assignedPanelSize || 0,
              missingMembers: item.missingMembers || [],
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
              // Sync missing members
              deduped[key].missingMembers = row.missingMembers || [];
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
      // Logic Update: Only count submitted evaluations for the average
      const submittedPanelCount = evaluations.length || 1;

      const sumClo = cloEvs.reduce((sum, ev) => sum + ev.totalCloMarks, 0);
      const avgClo = sumClo / submittedPanelCount;

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
    const submittedPanelCount = evaluations.length || 1;
    const sumClo = cloEvs.reduce((sum, ev) => sum + ev.totalCloMarks, 0);
    const avgClo = sumClo / submittedPanelCount;
    const finalCloMarks = +(avgClo * 0.5).toFixed(2);

    const totalPanelSize = evaluations[0]?.assignedPanelSize || evaluations.length || 1;
    return { students, finalCloMarks, numPanels, assignedPanelSize: totalPanelSize, hasClo: cloEvs.length > 0 };
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
              <th><strong>Week</strong></th>
              <th><strong>Group ID</strong></th>
              <th><strong>Student Names</strong></th>
              <th><strong>Project Title</strong></th>
              <th><strong>Venue</strong></th>
              <th><strong>Time</strong></th>
              <th><strong>Info</strong></th>
              <th><strong>Action</strong></th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="8" className="cor-committee-empty">
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
                    >
                      <td className="cor-week-cell">
                        <span className="cor-week-badge">{row.week}</span>
                        {row.fypPart && (
                          <span className="cor-fyp-badge">{row.fypPart.toUpperCase()}</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: "#013379" }}>{row.groupId}</td>
                      <td>{allStudentNames}</td>
                      <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.projectTitle}>
                        {row.projectTitle}
                      </td>
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
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setSelectedRow(row);
                            setInfoModalOpen(true);
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
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
                        {/* {row.missingMembers && row.missingMembers.length > 0 && (
                          <div style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 700, marginTop: '6px', textAlign: 'center', maxWidth: '120px' }}>
                            Missing: {row.missingMembers.join(", ")}
                          </div>
                        )} */}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <InfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        row={selectedRow}
        computeFinalMarks={computeFinalMarks}
      />
    </div>
  );
}

// ─── Modal Implementation ─────────────────────────────────────────────
const InfoModal = ({ open, onClose, row, computeFinalMarks }) => {
  if (!row) return null;
  const fm = computeFinalMarks(row.evaluations || []);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', md: 800 },
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: '12px',
        boxShadow: 24,
        p: 0,
        overflowY: 'auto'
      }}>
        {/* Header */}
        <Box sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#013379',
          color: 'white',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          position: 'relative'
        }}>
          <Box>
            <Typography variant="h6" fontWeight="600">
              📊 Evaluation Summary: {row.groupId}
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
              Project: {row.projectTitle}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* Milestone Info */}
          <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Milestone</Typography>
              <Typography fontWeight="bold">{row.week}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Venue</Typography>
              <Typography fontWeight="bold">{row.venue}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Submissions</Typography>
              <Typography fontWeight="bold" color={row.evaluations.length < row.assignedPanelSize ? 'error.main' : 'success.main'}>
                {row.evaluations.length} / {row.assignedPanelSize}
              </Typography>
            </Box>
          </Box>

          {row.missingMembers && row.missingMembers.length > 0 && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px' }}>
              <Typography variant="caption" color="#991b1b" fontWeight="800" sx={{ display: 'block', mb: 0.5 }}>
                ⚠️ PENDING EVALUATIONS:
              </Typography>
              <Typography variant="body2" color="#b91c1c" fontWeight="600" sx={{ mb: 1 }}>
                {row.missingMembers.join(", ")} - This member has NOT submitted the result.
              </Typography>
              <Typography variant="caption" sx={{ color: '#000', fontStyle: 'italic', display: 'block' }}>
                Note: Their empty slot will not be counted in the final average calculation. Only submitted marks are factored into the result.
              </Typography>
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Student Marks Table */}
          <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Individual Results Summary
          </Typography>
          {fm ? (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', mb: 4 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                    {!/week\s*4/i.test(row.week) && (
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Committee Score (/50)</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fm.students.map((stu, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="600">{stu.name}</Typography>
                          <Typography variant="caption" color="textSecondary">{stu.sapId}</Typography>
                        </Box>
                      </TableCell>
                      {!/week\s*4/i.test(row.week) && (
                        <TableCell align="center">
                          <Typography fontWeight="700" color="#013379">{stu.finalTotal}</Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary" sx={{ mb: 4 }}>No evaluations submitted yet.</Typography>
          )}

          {!/week\s*4/i.test(row.week) && fm?.hasClo && (
            <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: '8px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" fontWeight="600" color="#1e40af">Panel Average Result (Scaled to 50):</Typography>
              <Typography variant="h6" fontWeight="800" color="#1e40af">{fm.finalCloMarks} / 50</Typography>
            </Box>
          )}

          {/* Detailed Comments */}
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            💬 Panel Member Feedback
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {row.evaluations.map((ev, i) => (
              <Box key={i} sx={{ p: 2, border: '1px solid #eee', borderRadius: '8px', bgcolor: '#fcfcfc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="700" color="#013379">
                    {typeof ev.evaluatedBy === 'object' ? ev.evaluatedBy.name : ev.evaluatedBy}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  "{ev.comments}"
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Submitted: {ev.submittedAt}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right', borderTop: '1px solid #eee' }}>
          <button
            className="cor-main-btn"
            style={{ padding: '8px 24px' }}
            onClick={onClose}
          >
            Close
          </button>
        </Box>
      </Box>
    </Modal>
  );
};

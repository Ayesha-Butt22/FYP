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
        width: { xs: '95%', sm: '90%', md: '950px' },
        maxHeight: '93vh',
        bgcolor: 'background.paper',
        borderRadius: '18px',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(1, 51, 122, 0.15)',
        p: 0,
        overflowY: 'auto'
      }}>
        {/* Header - REDUCED HEIGHT AND PADDING */}
        <Box sx={{
          p: '2rem 3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #013379 0%, #0246a5 100%)',
          color: 'white',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 6px 20px rgba(1, 51, 122, 0.25)'
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontSize: '1.35rem', fontWeight: '800', mb: 0.5 }}>
              📊 Evaluation Summary
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: '700', opacity: 0.95, mb: 0 }}>
              {row.groupId}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: '500', mt: 0.3 }}>
              {row.projectTitle}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white', mt: -0.5, mr: -1.5 }}>
            <CloseIcon sx={{ fontSize: '2.2rem' }} />
          </IconButton>
        </Box>

        <Box sx={{ p: 5 }}>
          {/* Milestone Info - Enhanced Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 5 }}>
            <Box sx={{ p: 3, bgcolor: '#f0f6ff', borderRadius: '14px', borderLeft: '5px solid #013379', boxShadow: '0 2px 8px rgba(1, 51, 122, 0.1)' }}>
              <Typography variant="caption" sx={{ fontSize: '0.9rem', fontWeight: '800', color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                📅 Milestone
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: '900', color: '#013379', mt: 1 }}>
                {row.week}
              </Typography>
            </Box>

            <Box sx={{ p: 3, bgcolor: '#fff3e0', borderRadius: '14px', borderLeft: '5px solid #ff8f00', boxShadow: '0 2px 8px rgba(255, 143, 0, 0.1)' }}>
              <Typography variant="caption" sx={{ fontSize: '0.9rem', fontWeight: '800', color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                📍 Venue
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: '700', color: '#e65100', mt: 1 }}>
                {row.venue}
              </Typography>
            </Box>

            <Box sx={{ p: 3, bgcolor: '#f3e5f5', borderRadius: '14px', borderLeft: '5px solid #7b1fa2', boxShadow: '0 2px 8px rgba(123, 31, 162, 0.1)' }}>
              <Typography variant="caption" sx={{ fontSize: '0.9rem', fontWeight: '800', color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                ⏰ Slot Time
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: '700', color: '#7b1fa2', mt: 1 }}>
                {row.slotTime}
              </Typography>
            </Box>

            <Box sx={{ p: 3, bgcolor: row.evaluations.length < row.assignedPanelSize ? '#fff8e1' : '#e8f5e9', borderRadius: '14px', borderLeft: `5px solid ${row.evaluations.length < row.assignedPanelSize ? '#fbc02d' : '#2e7d32'}`, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="caption" sx={{ fontSize: '0.9rem', fontWeight: '800', color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                ✅ Submissions
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: '900', color: row.evaluations.length < row.assignedPanelSize ? '#f57f17' : '#2e7d32', mt: 1 }}>
                {row.evaluations.length} / {row.assignedPanelSize}
              </Typography>
            </Box>
          </Box>

          {/* Missing Members Alert - SIMPLIFIED */}
          {row.missingMembers && row.missingMembers.length > 0 && (
            <Box sx={{ mb: 5, p: 3, bgcolor: '#fff5f5', border: '2.5px solid #fecdd3', borderRadius: '14px', boxShadow: '0 4px 12px rgba(229, 62, 62, 0.1)' }}>
              <Typography variant="body2" sx={{ fontSize: '1.05rem', color: '#991b1b', fontWeight: '900', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚠️ PENDING EVALUATIONS:
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1rem', color: '#b91c1c', fontWeight: '700' }}>
                {row.missingMembers.join(", ")} - Not submitted yet
              </Typography>
            </Box>
          )}

          <Divider sx={{ mb: 5, borderColor: '#e8ecf4', borderWidth: '1.5px' }} />

          {/* Student Marks Table - Enhanced */}
          <Typography variant="h6" sx={{ fontSize: '1.35rem', fontWeight: '800', mb: 3, color: '#013379', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            👥 Individual Results Summary
          </Typography>
          {fm ? (
            <TableContainer component={Paper} elevation={0} sx={{ border: '2.5px solid #e8ecf4', mb: 5, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(1, 51, 122, 0.08)' }}>
              <Table>
                <TableHead sx={{ background: 'linear-gradient(135deg, #013379 0%, #0246a5 100%)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '900', fontSize: '1.05rem', color: 'white', py: 2.5 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: '900', fontSize: '1.05rem', color: 'white', py: 2.5 }}>SAP ID</TableCell>
                    {!/week\s*4/i.test(row.week) && (
                      <TableCell align="center" sx={{ fontWeight: '900', fontSize: '1.05rem', color: 'white', py: 2.5 }}>Committee Score (/50)</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fm.students.map((stu, i) => (
                    <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background 0.2s', borderBottom: '1px solid #e8ecf4' }}>
                      <TableCell sx={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b', py: 2.2 }}>
                        {stu.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '600', py: 2.2 }}>
                        {stu.sapId}
                      </TableCell>
                      {!/week\s*4/i.test(row.week) && (
                        <TableCell align="center" sx={{ fontSize: '1.25rem', fontWeight: '900', color: '#013379', py: 2.2 }}>
                          {stu.finalTotal}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ fontSize: '1.05rem', color: '#94a3b8', mb: 5, fontStyle: 'italic' }}>
              No evaluations submitted yet.
            </Typography>
          )}

          {!/week\s*4/i.test(row.week) && fm?.hasClo && (
            <Box sx={{ p: 3.5, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '14px', mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2.5px solid #90caf9', boxShadow: '0 6px 16px rgba(26, 115, 232, 0.18)' }}>
              <Typography variant="body1" sx={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e40af' }}>
                📈 Panel Average Result (Scaled to 50):
              </Typography>
              <Typography variant="h5" sx={{ fontSize: '1.75rem', fontWeight: '950', color: '#1e40af' }}>
                {fm.finalCloMarks} / 50
              </Typography>
            </Box>
          )}

          <Divider sx={{ mb: 5, borderColor: '#e8ecf4', borderWidth: '1.5px' }} />

          {/* Detailed Comments - ENHANCED FONTS */}
          <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: '900', mb: 4, color: '#013379', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            💬 Panel Member Feedback
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {row.evaluations.map((ev, i) => (
              <Box key={i} sx={{ p: 4, border: '2px solid #e8ecf4', borderRadius: '14px', bgcolor: '#fcfcfc', transition: 'all 0.3s', '&:hover': { boxShadow: '0 8px 20px rgba(1, 51, 122, 0.12)', borderColor: '#90caf9', bgcolor: '#ffffff' } }}>
                {/* Name and Email */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="body1" sx={{ fontSize: '1.25rem', fontWeight: '900', color: '#013379', mb: 0.5 }}>
                    {typeof ev.evaluatedBy === 'object' ? ev.evaluatedBy.name : ev.evaluatedBy}
                  </Typography>
                  {ev.email && (
                    <Typography variant="body2" sx={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>
                      {ev.email}
                    </Typography>
                  )}
                </Box>
                
                {/* Comments - LARGER FONT */}
                <Typography variant="body2" sx={{ fontSize: '1.15rem', fontStyle: 'italic', color: '#475569', mb: 2.5, lineHeight: '1.8', fontWeight: '500' }}>
                  "{ev.comments}"
                </Typography>

                {/* CLO Marks */}
                {ev.totalCloMarks > 0 && (
                  <Box sx={{ p: 2.5, bgcolor: '#eff6ff', borderRadius: '10px', mb: 2.5, borderLeft: '4px solid #1e40af' }}>
                    <Typography variant="body2" sx={{ fontSize: '1.05rem', fontWeight: '750', color: '#1e40af', display: 'block' }}>
                      CLO Marks: <strong sx={{ fontSize: '1.15rem' }}>{ev.totalCloMarks}/100</strong>
                    </Typography>
                  </Box>
                )}

                {/* Submitted Date - LARGER FONT */}
                <Typography variant="body2" sx={{ fontSize: '1rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: '500' }}>
                  ⏱️ Submitted: {ev.submittedAt}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 4, bgcolor: '#f8fafc', borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px', textAlign: 'right', borderTop: '2px solid #e8ecf4', position: 'sticky', bottom: 0, boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)' }}>
          <button
            className="cor-modal-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </Box>
      </Box>
    </Modal>
  );
};
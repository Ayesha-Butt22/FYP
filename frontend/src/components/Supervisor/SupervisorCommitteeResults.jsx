import React, { useEffect, useState } from "react";
import axios from "axios";
import { toastService } from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTime,
  Place,
  Info as InfoIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Modal,
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
import "../ProjectCoordinator/CommitteeResults.css";

export default function SupervisorCommitteeResults() {
  const [rows, setRows] = useState([]);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
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
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/committee-evaluation/onlyApproved?supervisor=${encodeURIComponent(email)}`);
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
              projectTitle: item.project?.projectTitle || "N/A",
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
              <th><strong>Week</strong></th>
              <th><strong>Group ID</strong></th>
              <th><strong>Student Names</strong></th>
              <th><strong>Project Title</strong></th>
              <th><strong>Venue</strong></th>
              <th><strong>Info</strong></th>
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



                return (
                  <React.Fragment key={row.id}>
                    <tr className="cor-committee-row">
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
                      <td>
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
            {/* <Box>
              <Typography variant="subtitle2" color="textSecondary">Submissions</Typography>
              <Typography fontWeight="bold" color={row.evaluations.length < row.assignedPanelSize ? 'error.main' : 'success.main'}>
                {row.evaluations.length} / {row.assignedPanelSize}
              </Typography>
            </Box> */}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {!/week\s*4/i.test(row.week) && (
            <>
              {/* Student Marks Table */}
              <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🏆 Individual Results Summary
              </Typography>
              {fm ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', mb: 4 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Committee Score (/50)</TableCell>
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
                          <TableCell align="center">
                            <Typography fontWeight="700" color="#013379">{stu.finalTotal}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" sx={{ mb: 4 }}>No evaluations submitted yet.</Typography>
              )}

              {fm?.hasClo && (
                <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: '8px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="600" color="#1e40af">Panel Average Result (Scaled to 50):</Typography>
                  <Typography variant="h6" fontWeight="800" color="#1e40af">{fm.finalCloMarks} / 50</Typography>
                </Box>
              )}
            </>
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
                    👤 Panel Member: {typeof ev.evaluatedBy === 'object' ? ev.evaluatedBy.name : ev.evaluatedBy}
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

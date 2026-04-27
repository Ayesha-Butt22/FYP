import React, { useState, useEffect } from "react";
import supervisorService from "../Api/supervisorService.jsx";
import {
  Box,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Stack,
  Typography,
  Modal,
  IconButton,
  Divider
} from "@mui/material";
import { PictureAsPdf, TableView, Info as InfoIcon, Close as CloseIcon } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./SupervisorReports.css";
import DashboardSectionHeader from "./DashboardSectionHeader";

// ----- Dummy Data Removed -----

const TEMPLATE_DEFINITIONS = [
  { code: "t01", label: "Template-01: Project Team List (MS Word)", week: 1, fypPart: 1 },
  { code: "t02", label: "Template-02: Initial Proposal (MS Word)", week: 2, fypPart: 1 },
  { code: "t03", label: "Template-03: Proposal Presentation (PPT)", week: 4, fypPart: 1 },
  { code: "t04", label: "Template-04: Proposal & Plan (MS Word)", week: 6, fypPart: 1 },
  { code: "t05", label: "Template-05: Project Report (MS Word)", week: 8, fypPart: 1 },
  { code: "t07", label: "Template-07: Final Presentation (PPT)", week: 15, fypPart: 1 },
  { code: "t05", label: "FYP-2: Template-05: Project Report (MS Word)", week: 13, fypPart: 2 },
  { code: "t06", label: "FYP-2: Template-06: Complete Project Report (PPT)", week: 14, fypPart: 2 }
];

// Status color coding
const statusColor = (status) =>
  status === "Approved" || status === "Completed"
    ? "success"
    : status === "Rejected"
      ? "error"
      : status === "In Progress"
        ? "info"
        : status === "Pending"
          ? "warning"
          : "default";

export default function SupervisorReports() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await supervisorService.getSupervisorGroups();
        if (res.success) {
          const mapped = res.groups.map(g => ({
            id: g.groupId,
            maskedId: g.maskedGroupId,
            name: g.description,
            members: g.members.map(m => m.name) // Just names for reporting
          }));
          setGroups(mapped);
        }
      } catch (err) {
        console.error("Failed to load groups:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupData(null);
      return;
    }

    const loadGroupDetails = async () => {
      try {
        const res = await supervisorService.fetchGroupSubmissions(selectedGroupId);
        const submissions = res.submissions || [];
        const group = groups.find(g => g.id === selectedGroupId);

        setGroupData({
          ...group,
          milestones: TEMPLATE_DEFINITIONS.map(def => {
            const s = submissions.find(sub =>
              sub.templateCode === def.code &&
              (sub.fypPart === def.fypPart || (!sub.fypPart && def.fypPart === 1))
            );
            return {
              name: def.label,
              week: def.week,
              status: s ? s.status : "Pending",
              feedback: s ? s.supervisorRemarks || "-" : "-",
              score: 0,
              max: 0
            };
          })
        });
      } catch (err) {
        console.error("Failed to load group details:", err);
      }
    };

    loadGroupDetails();
  }, [selectedGroupId, groups]);

  const group = groupData;

  // Progress summary calculation
  const completed = group ? group.milestones.filter((m) => m.status === "Approved").length : 0;
  const submitted = group ? group.milestones.filter((m) => ["Pending", "Approved", "Rejected"].includes(m.status)).length : 0;
  const total = 8; // Project has 8 main milestones
  const percent = Math.round((completed / total) * 100);
  const pending = Math.max(0, total - completed);

  const groupScore = group ? group.milestones.reduce((sum, m) => sum + (m.score || 0), 0) : 0;
  const groupMax = group ? group.milestones.reduce((sum, m) => sum + (m.max || 0), 0) : 0;

  // Export to PDF
  const handleExportPDF = () => {
    if (!group) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Group Report: ${group.maskedId} - ${group.name}`, 14, 18);
    doc.setFontSize(12);
    doc.text(`Members: ${group.members.join(", ")}`, 14, 28);
    autoTable(doc, {
      startY: 36,
      // Milestone column removed as requested; include Week & Template & Status & Feedback
      head: [["Week", "Template", "Status", "Feedback"]],
      body: group.milestones.map((m) => [`Week ${m.week}`, m.name, m.status, m.feedback || "-"]),
    });
    doc.text(`Total Score: ${groupScore}/${groupMax}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`GroupReport_${group.maskedId}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!group) return;
    const ws = XLSX.utils.json_to_sheet(
      group.milestones.map((m) => ({
        Week: `Week ${m.week}`,
        Template: m.name,
        Status: m.status,
        Feedback: m.feedback || "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `GroupReport_${group.maskedId}.xlsx`);
  };

  return (
    <Box mx="auto" py={3} mr={0} ml={0} pt={0}>
      <DashboardSectionHeader description={"Here you can see report . Select \"Particular Group\" to view and respective group record will be displayed."}>Evaluation Report</DashboardSectionHeader>

      <Paper className="reports-paper">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <FormControl className="reports-group-select" sx={{ minWidth: "300px" }}>
            <InputLabel>Select Group</InputLabel>
            <Select
              value={selectedGroupId}
              label="Select Group"
              onChange={(e) => setSelectedGroupId(e.target.value)}
              size="small"
              style={{ height: '60px' }}
            >
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.maskedId} - {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {group && (
            <Button
              variant="contained"
              startIcon={<InfoIcon />}
              onClick={() => setSummaryModalOpen(true)}
              sx={{ height: '60px', bgcolor: '#013379', '&:hover': { bgcolor: '#012a64' } }}
            >
              View Summary
            </Button>
          )}
        </Stack>

        {!group ? (
          <Typography color="#aaa" className="supervisor-reports-placeholder">
            Select a group to view its report.
          </Typography>
        ) : (
          <div>
            {/* Summary Modal */}
            <Modal open={summaryModalOpen} onClose={() => setSummaryModalOpen(false)}>
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: { xs: '90%', md: 850 }, maxHeight: '85vh', overflowY: 'auto',
                bgcolor: 'white', borderRadius: '16px', boxShadow: 24, p: 0
              }}>
                {/* Header */}
                <Box sx={{
                  p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  bgcolor: '#013379', color: 'white', borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
                }}>
                  <Box>
                    <Typography variant="h6" fontWeight="700">📊 Evaluation Summary</Typography>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                      {group?.maskedId} — {group?.name}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => setSummaryModalOpen(false)} sx={{ color: 'white' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 4 }}>
                  <Typography className="super-report-members" sx={{ mb: 3 }}>
                    <b>Members:</b> {group?.members.join(", ")}
                  </Typography>

                  <Divider sx={{ mb: 4 }} />

                  <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: '180px', p: 3, bgcolor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Completed</Typography>
                      <Typography variant="h4" sx={{ color: '#166534', fontWeight: 800 }}>{completed}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '180px', p: 3, bgcolor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>Submitted</Typography>
                      <Typography variant="h4" sx={{ color: '#1d4ed8', fontWeight: 800 }}>{submitted}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '180px', p: 3, bgcolor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Remaining</Typography>
                      <Typography variant="h4" sx={{ color: '#991b1b', fontWeight: 800 }}>{pending}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '180px', p: 3, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Total</Typography>
                      <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 800 }}>{total}</Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ mb: 4, p: 3, bgcolor: '#013379', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>Overall Progress Percentage</Typography>
                    <Typography variant="h2" sx={{ fontWeight: 900 }}>{percent}%</Typography>
                  </Box>

                  {/* <Typography variant="h6" fontWeight="700" sx={{ mt: 2, color: '#013379' }}>
                    Total Academic Score: {groupScore} / {groupMax}
                  </Typography> */}
                </Box>

                <Box sx={{ p: 2, bgcolor: '#f8fafc', textAlign: 'right', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', borderTop: '1px solid #eee' }}>
                  <Button onClick={() => setSummaryModalOpen(false)} variant="outlined">Close</Button>
                </Box>
              </Box>
            </Modal>


            {/* Export Buttons */}
            <div className="report-export-btns">
              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdf />}
                onClick={handleExportPDF}
                className="export-btn"
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<TableView />}
                onClick={handleExportExcel}
                className="export-btn"
              >
                Export Excel
              </Button>
            </div>

            {/* Milestones Table - Milestone column removed as requested */}
            <Table className="super-report-table">
              <TableHead>
                <TableRow>
                  <TableCell>Week</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Feedback/Evaluation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.milestones.map((m, idx) => (
                  <TableRow key={idx}>
                    <TableCell>Week {m.week}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={m.status}
                        color={statusColor(m.status)}
                        style={{ width: '150px', fontSize: '18px' }}
                        className="report-status-chip"
                      />
                    </TableCell>
                    <TableCell style={{ wordBreak: 'break-word', maxWidth: '300px' }}>{m.feedback || <span className="feedback-missing">-</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Paper>
    </Box>
  );
}
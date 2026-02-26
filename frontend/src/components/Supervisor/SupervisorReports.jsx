import React, { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import { PictureAsPdf, TableView } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import supervisorReportsService from "../Api/supervisorReportsService.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorReports.css";
import DashboardSectionHeader from "./DashboardSectionHeader";

// Week number to label mapping
const getWeekLabel = (weekNum) => {
  const weekMap = {
    1: "Week 1",
    2: "Week 2",
    4: "Week 4",
    6: "Week 6",
    13: "13th Week before Final Exams",
    24: "Week 24",
    26: "Week 26",
    28: "Week 28",
    30: "Week After Finals"
  };
  return weekMap[weekNum] || `Week ${weekNum}`;
};

// Status color coding
const statusColor = (status) => {
  const statusMap = {
    "Approved": "success",
    "Under Review": "info",
    "Pending": "warning",
    "Rejected": "error"
  };
  return statusMap[status] || "default";
};

export default function SupervisorReports() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await supervisorReportsService.getGroupsForReports();
        
        if (response.success) {
          setGroups(response.groups || []);
        } else {
          toastService.error('Failed to load groups');
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toastService.error('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Fetch report when group is selected
  useEffect(() => {
    if (!selectedGroupId) {
      setReportData(null);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoadingReport(true);
        const response = await supervisorReportsService.getGroupReport(selectedGroupId);
        
        if (response.success) {
          setReportData(response.data);
        } else {
          toastService.error('Failed to load report');
        }
      } catch (error) {
        console.error('Error fetching report:', error);
        toastService.error('Failed to load report');
      } finally {
        setLoadingReport(false);
      }
    };

    fetchReport();
  }, [selectedGroupId]);

  // Calculate progress summary
  const completed = reportData ? reportData.milestones.filter(m => m.status === "Approved").length : 0;
  const inProgress = reportData ? reportData.milestones.filter(m => m.status === "Under Review").length : 0;
  const pending = reportData ? reportData.milestones.filter(m => m.status === "Pending").length : 0;
  const rejected = reportData ? reportData.milestones.filter(m => m.status === "Rejected").length : 0;
  const total = reportData ? reportData.milestones.length : 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  // Export to PDF
  const handleExportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Group Report: ${reportData.groupId} - ${reportData.title}`, 14, 18);
    doc.setFontSize(12);
    doc.text(`Members: ${reportData.members.join(", ")}`, 14, 28);
    autoTable(doc, {
      startY: 36,
      head: [["Week", "Template", "Status", "Feedback"]],
      body: reportData.milestones.map((m) => [
        getWeekLabel(m.week), 
        m.templateLabel, 
        m.status, 
        m.feedback || "-"
      ]),
    });
    doc.text(`Progress: ${percent}%`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`GroupReport_${reportData.groupId}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!reportData) return;
    const ws = XLSX.utils.json_to_sheet(
      reportData.milestones.map((m) => ({
        Week: getWeekLabel(m.week),
        Template: m.templateLabel,
        Status: m.status,
        Feedback: m.feedback || "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `GroupReport_${reportData.groupId}.xlsx`);
  };

  if (loading) {
    return (
      <Box mx="auto" py={3} mr={0} ml={0} pt={0}>
        <DashboardSectionHeader description={"Loading groups..."}>
          Evaluation Report
        </DashboardSectionHeader>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box mx="auto" py={3} mr={0} ml={0} pt={0}>
      <DashboardSectionHeader 
        description={"Here you can see preview evaluation & rubrics. Select a group to view its report with submission status and feedback."}
      >
        Evaluation Report
      </DashboardSectionHeader>

      <Paper className="reports-paper">
        <FormControl className="reports-group-select">
          <InputLabel>Select Group</InputLabel>
          <Select
            value={selectedGroupId}
            label="Select Group"
            onChange={(e) => setSelectedGroupId(e.target.value)}
            size="small"
            style={{ height: '60px' }}
          >
            {groups.map((g) => (
              <MenuItem key={g._id} value={g._id}>
                {g.id} - {g.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loadingReport ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : !reportData ? (
          <Typography color="#aaa" className="supervisor-reports-placeholder">
            Select a group to view its report.
          </Typography>
        ) : (
          <div>
            <div className="report-summary">
              <Typography className="super-report-title">
                {reportData.groupId} - {reportData.title}
              </Typography>
              <Typography className="super-report-members">
                <b>Members:</b> {reportData.members.join(", ")}
              </Typography>
              <Stack direction="row" spacing={1} className="super-report-progress-summary" flexWrap="wrap">
                <Chip label={`Approved: ${completed}`} color="success" style={{ width: '200px', fontSize: '18px' }} />
                <Chip label={`In Review: ${inProgress}`} color="info" style={{ width: '200px', fontSize: '18px' }} />
                <Chip label={`Pending: ${pending}`} color="warning" style={{ width: '200px', fontSize: '18px' }} />
                <Chip label={`Rejected: ${rejected}`} color="error" style={{ width: '200px', fontSize: '18px' }} />
                <Chip label={`Total: ${total}`} color="info" style={{ width: '200px', fontSize: '18px' }} />
                <Chip label={`Progress: ${percent}%`} color="success" style={{ width: '200px', fontSize: '18px' }} />
              </Stack>
            </div>

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

            {/* Milestones Table */}
            {reportData.milestones.length === 0 ? (
              <Typography color="#888" textAlign="center" py={3}>
                No submissions yet for this group.
              </Typography>
            ) : (
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
                  {reportData.milestones.map((m, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{getWeekLabel(m.week)}</TableCell>
                      <TableCell>{m.templateLabel}</TableCell>
                      <TableCell>
                        <Chip
                          label={m.status}
                          color={statusColor(m.status)}
                          style={{ width: '150px', fontSize: '18px' }}
                          className="report-status-chip"
                        />
                      </TableCell>
                      <TableCell>{m.feedback || <span className="feedback-missing">-</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </Paper>
    </Box>
  );
}
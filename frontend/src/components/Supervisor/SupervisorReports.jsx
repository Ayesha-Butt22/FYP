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
} from "@mui/material";
import { PictureAsPdf, TableView } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./SupervisorReports.css";
import DashboardSectionHeader from "./DashboardSectionHeader";

// ----- Dummy Data Removed -----


// Template name mapping
const getTemplateName = (milestoneName) => {
  switch (milestoneName) {
    case "Proposal":
      return "Template-02: Initial Proposal (MS Word)";
    case "SRS":
      return "Template-04: Proposal & Plan (MS Word)";
    case "Design":
      return "Template-07: Progress Presentation (MS PowerPoint)";
    case "Report":
      return "Template-05: Project Report (MS Word)";
    case "Defense":
      return "Template-06: Final Presentation (MS PowerPoint)";
    default:
      return "Template-01: Project Team (MS Word)";
  }
};

// Week mapping
const getWeek = (milestoneName) => {
  switch (milestoneName) {
    case "Proposal":
      return "Week 1";
    case "SRS":
      return "Week 2";
    case "Design":
      return "Week 4";
    case "Report":
      return "Week 6";
    case "Defense":
      return "13th Week before Final Exams";
    default:
      return "Week After Finals";
  }
};

// Status color coding
const statusColor = (status) =>
  status === "Completed"
    ? "success"
    : status === "In Progress"
    ? "info"
    : status === "Pending"
    ? "info"
    : "default";

export default function SupervisorReports() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await supervisorService.getSupervisorGroups();
        if (res.success) {
          const mapped = res.groups.map(g => ({
            id: g.groupId,
            maskedId: g.maskedGroupId,
            title: g.description,
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
          milestones: submissions.map(s => ({
            name: s.templateLabel,
            week: s.week,
            status: s.status,
            feedback: s.supervisorRemarks || "-",
            score: 0, // No scores in submission model yet
            max: 0
          }))
        });
      } catch (err) {
        console.error("Failed to load group details:", err);
      }
    };

    loadGroupDetails();
  }, [selectedGroupId, groups]);

  const group = groupData;

  // Progress summary calculation
  const completed = group ? group.milestones.filter((m) => m.status === "Completed").length : 0;
  const inProgress = group ? group.milestones.filter((m) => m.status === "In Progress").length : 0;
  const pending = group ? group.milestones.filter((m) => m.status === "Pending").length : 0;
  const total = group ? group.milestones.length : 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const groupScore = group ? group.milestones.reduce((sum, m) => sum + (m.score || 0), 0) : 0;
  const groupMax = group ? group.milestones.reduce((sum, m) => sum + (m.max || 0), 0) : 0;

  // Export to PDF
  const handleExportPDF = () => {
    if (!group) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Group Report: ${group.id} - ${group.title}`, 14, 18);
    doc.setFontSize(12);
    doc.text(`Members: ${group.members.join(", ")}`, 14, 28);
    autoTable(doc, {
      startY: 36,
      // Milestone column removed as requested; include Week & Template & Status & Feedback
      head: [["Week", "Template", "Status", "Feedback"]],
      body: group.milestones.map((m) => [getWeek(m.name), getTemplateName(m.name), m.status, m.feedback || "-"]),
    });
    doc.text(`Total Score: ${groupScore}/${groupMax}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`GroupReport_${group.id}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!group) return;
    const ws = XLSX.utils.json_to_sheet(
      group.milestones.map((m) => ({
        Week: getWeek(m.name),
        Template: getTemplateName(m.name),
        Status: m.status,
        Feedback: m.feedback || "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `GroupReport_${group.id}.xlsx`);
  };

  return (
    <Box mx="auto" py={3} mr={0} ml={0} pt={0}>
      <DashboardSectionHeader description={"Here you can see preview evaluation & rubrics. Select \"Particular Group\" to view and respected group record will be displayed "}>Evaluation Report</DashboardSectionHeader>

      <Paper className="reports-paper">
        <FormControl className="reports-group-select">
          <InputLabel>Select Group</InputLabel>
          <Select
            value={selectedGroupId}
            label="Select Group"
            onChange={(e) => setSelectedGroupId(e.target.value)}
            size="small"
            style={{ height: '60px'}}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.maskedId} - {g.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!group ? (
          <Typography color="#aaa" className="supervisor-reports-placeholder">
            Select a group to view its report.
          </Typography>
        ) : (
          <div>
            <div className="report-summary">
              <Typography className="super-report-title">
                {group.id} - {group.title}
              </Typography>
              <Typography className="super-report-members">
                <b>Members:</b> {group.members.join(", ")}
              </Typography>
              <Stack direction="row" spacing={1} className="super-report-progress-summary">
                <Chip label={`Completed: ${completed}`} color="success" style={{ width : '200px' , fontSize: '18px' }}/>
                <Chip label={`In Progress: ${inProgress}`} color="info" style={{ width : '200px' , fontSize: '18px' }}/>
                <Chip label={`Pending: ${pending}`} color="info" style={{ width : '200px' , fontSize: '18px' }}/>
                <Chip label={`Total: ${total}`} color="info" style={{ width : '200px' , fontSize: '18px' }}/>
                <Chip label={`Progress: ${percent}%`} color="success" style={{ width : '200px' , fontSize: '18px' }}/>
              </Stack>
              <Typography className="super-report-total-score">
                <b>Total Score:</b> {groupScore}/{groupMax}
              </Typography>
            </div>

            
            {/* Export Buttons */}
            <div className="report-export-btns">
              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdf/>}
                onClick={handleExportPDF}
                className="export-btn"
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<TableView/>}
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
                    <TableCell>{getWeek(m.name)}</TableCell>
                    <TableCell>{getTemplateName(m.name)}</TableCell>
                    <TableCell>
                      <Chip
                        label={m.status}
                        color={statusColor(m.status)}
                        style={{ width : '150px' , fontSize: '18px' }}
                        className="report-status-chip"
                      />
                    </TableCell>
                    <TableCell>{m.feedback || <span className="feedback-missing">-</span>}</TableCell>
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
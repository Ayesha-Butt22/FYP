import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Stack
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownload from "@mui/icons-material/FileDownload";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import "../CommitteeResults.css";

/**
 * StudentEvaluationResults.jsx
 * Read-only view for students to see finalized results for their group (frontend-only).
 *
 * Replace demo with GET /api/student/final-results/:groupId
 */

const DEMO_FINAL_RESULTS = [
  {
    groupId: "G-101",
    year: "FYP-1",
    supervisorMarks: 72,
    committeeAverage: 78,
    finalScore: 75,
    remarks: "Good performance. Minor improvements recommended.",
    finalized: true
  },
  {
    groupId: "G-102",
    year: "FYP-2",
    supervisorMarks: 85,
    committeeAverage: 80,
    finalScore: 83,
    remarks: "Excellent",
    finalized: true
  }
];

export default function StudentEvaluationResults() {
  const [groupId, setGroupId] = useState(localStorage.getItem("groupId") || "");
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // In real app: fetch student group final result by groupId
    setResults(DEMO_FINAL_RESULTS);
  }, []);

  const rows = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return results
      .filter(r => r.finalized)
      .filter(r => !groupId || r.groupId === groupId)
      .filter(r => {
        if (!term) return true;
        return (
          (r.groupId || "").toLowerCase().includes(term) ||
          (r.remarks || "").toLowerCase().includes(term) ||
          (r.year || "").toLowerCase().includes(term)
        );
      })
      .map(r => ({
        "Group#": r.groupId,
        "Year": r.year,
        "Supervisor Marks": r.supervisorMarks,
        "Committee Avg": r.committeeAverage,
        "Final Score": r.finalScore,
        "Remarks": r.remarks
      }));
  }, [results, groupId, searchTerm]);

  function exportCSV() {
    const headers = ["Group#", "Year", "Supervisor Marks", "Committee Avg", "Final Score", "Remarks"];
    const csvRows = [headers.join(",")].concat(rows.map(r =>
      headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ));
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `student_final_results_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <Box>
      <DashboardSectionHeader description="Finalized evaluation results (supervisor + committee average) visible to students">
        Final Evaluation Results — Student View
      </DashboardSectionHeader>

      <Paper className="evaluation-form-paper elevated-card" sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Your Group ID"
              size="small"
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              variant="filled"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              size="small"
              placeholder="Search remarks or year"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              variant="filled"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={4} sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV}>Export CSV</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="evaluation-table-paper">
        <AppTable
          headers={["Group#", "Year", "Supervisor Marks", "Committee Avg", "Final Score", "Remarks"]}
          rows={rows}
        />
      </Paper>
    </Box>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownload from "@mui/icons-material/FileDownload";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import "../CommitteeResults.css";

/**
 * SupervisorCommitteeResults.jsx
 * Read-only view for supervisors to inspect committee evaluations for their supervised groups.
 *
 * Frontend-only demo: uses DEMO_HISTORY and GROUPS. Replace with API calls:
 * - GET /api/supervisor/committee-results/:supervisorId
 */

const GROUPS = [
  { id: "G-101", name: "Group 1", supervisor: "Dr. Asad Qureshi" },
  { id: "G-102", name: "Group 2", supervisor: "Dr. Maria Tariq" },
  { id: "G-103", name: "Group 3", supervisor: "Dr. Farhan Iqbal" },
];

const DEMO_HISTORY = [
  {
    id: "ce-9001",
    groupId: "G-101",
    year: "FYP-1",
    mode: "per-member",
    member: { memberId: "s-101", memberName: "Ali Khan" },
    committeeMember: "Dr. Ayesha Butt",
    totals: { totalMarks: 16, maxMarks: 50, percentage: 32 },
    timestamp: "2025-11-01 10:23:00",
    remarks: "Good presentation"
  },
  {
    id: "ce-9002",
    groupId: "G-101",
    year: "FYP-1",
    mode: "group",
    committeeMember: "Dr. Ayesha Butt",
    totals: { totalMarks: 38, maxMarks: 50, percentage: 76 },
    timestamp: "2025-11-01 11:00:00",
    remarks: "Strong overall"
  },
];

export default function SupervisorCommitteeResults() {
  const [history, setHistory] = useState([]);
  const [filterGroup, setFilterGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("All");

  // Simulate supervisor identity (replace with real auth)
  const supervisorName = localStorage.getItem("name") || "Dr. Asad Qureshi";

  useEffect(() => {
    // In real app: fetch(`/api/supervisor/committee-results/${supervisorId}`)
    // Demo: filter DEMO_HISTORY to groups supervised by supervisorName
    const supervisedGroupIds = GROUPS.filter(g => g.supervisor === supervisorName).map(g => g.id);
    const filtered = DEMO_HISTORY.filter(h => supervisedGroupIds.includes(h.groupId));
    setHistory(filtered);
  }, [supervisorName]);

  const rows = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return history
      .filter(h => filterYear === "All" ? true : h.year === filterYear)
      .filter(h => !filterGroup || h.groupId === filterGroup)
      .filter(h => {
        if (!term) return true;
        return (
          (h.groupId || "").toLowerCase().includes(term) ||
          (h.member?.memberName || "").toLowerCase().includes(term) ||
          (h.committeeMember || "").toLowerCase().includes(term) ||
          (h.timestamp || "").toLowerCase().includes(term) ||
          (h.remarks || "").toLowerCase().includes(term)
        );
      })
      .map(h => ({
        "Group#": h.groupId,
        "Year": h.year,
        "Mode": h.mode,
        "Member": h.member?.memberName || "-",
        "Committee Member": h.committeeMember,
        "Total": h.totals?.totalMarks ?? 0,
        "Max": h.totals?.maxMarks ?? 0,
        "Percent": (h.totals?.percentage ?? 0) + "%",
        "Remarks": h.remarks || "",
        "Time": h.timestamp
      }));
  }, [history, searchTerm, filterYear, filterGroup]);

  const exportCSV = () => {
    const headers = ["Group#", "Year", "Mode", "Member", "Committee Member", "Total", "Max", "Percent", "Remarks", "Time"];
    const csvRows = [headers.join(",")].concat(rows.map(r =>
      headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ));
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `supervisor_results_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <DashboardSectionHeader description="View committee evaluation results for groups you supervise (read-only)">
        Committee Results — Supervisor View
      </DashboardSectionHeader>

      <Paper className="evaluation-form-paper elevated-card" sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="filled">
              <InputLabel>Filter Group</InputLabel>
              <Select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                <MenuItem value=""><em>All supervised groups</em></MenuItem>
                {GROUPS.filter(g => g.supervisor === supervisorName).map(g => (
                  <MenuItem key={g.id} value={g.id}>{g.name} ({g.id})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small" variant="filled">
              <InputLabel>Year</InputLabel>
              <Select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <MenuItem value="All">All Years</MenuItem>
                <MenuItem value="FYP-1">FYP-1</MenuItem>
                <MenuItem value="FYP-2">FYP-2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={5} sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <TextField
                size="small"
                placeholder="Search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
              <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV}>Export CSV</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="evaluation-table-paper">
        <AppTable
          headers={["Group#", "Year", "Mode", "Member", "Committee Member", "Total", "Max", "Percent", "Remarks", "Time"]}
          rows={rows}
        />
      </Paper>
    </Box>
  );
}
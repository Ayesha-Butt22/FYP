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
  Stack,
  Button,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownload from "@mui/icons-material/FileDownload";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import axios from "axios";
import "../CommitteeResults.css";

export default function CoordinatorCommitteeResults() {
  const [summaries, setSummaries] = useState([]);
  const [filterYear, setFilterYear] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch from API
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/committee-evaluation"); // or your route
        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((item) => {
            const group = item.groupId || {};
            const evaluations = item.evaluations || [];

            // flatten student totals if structure allows
            const individualTotals = evaluations.map((ev) => ({
              student: ev.studentName || ev.studentId?.name || "N/A",
              total: ev.totalMarks || 0,
              max: ev.maxMarks || 50,
            }));

            const groupTotal = individualTotals.reduce((a, b) => a + (b.total || 0), 0);
            const maxTotal = individualTotals.reduce((a, b) => a + (b.max || 50), 0);
            const avg = maxTotal ? ((groupTotal / maxTotal) * 100).toFixed(1) : 0;

            return {
              id: item._id,
              groupId: group.groupName || group.title || "Unknown Group",
              year: group.fypPart || "FYP-1",
              committeeMembers:
                (item.evaluations || [])
                  .map((e) => e.evaluatedBy?.name)
                  .filter(Boolean) || [],
              individualTotals,
              groupTotal,
              maxTotal,
              average: avg,
              status: item.status || "Pending",
              timestamp: new Date(item.createdAt).toLocaleString(),
            };
          });
          setSummaries(formatted);
        } else {
          toastService.error("No data found.");
        }
      } catch (err) {
        console.error(err);
        toastService.error("Failed to load committee results.");
      }
    };

    fetchEvaluations();
  }, []);

  const finalize = async (id) => {
    try {
      // Optional: API call (if endpoint exists)
      // await axios.post(`/api/coordinator/committee-results/${id}/finalize`);
      setSummaries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Finalized" } : s))
      );
      toastService.success("Finalized.");
    } catch {
      toastService.error("Error finalizing.");
    }
  };

  const reopen = async (id) => {
    try {
      // Optional: API call (if endpoint exists)
      // await axios.post(`/api/coordinator/committee-results/${id}/reopen`);
      setSummaries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Pending" } : s))
      );
      toastService.info("Reopened.");
    } catch {
      toastService.error("Error reopening.");
    }
  };

  const rows = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return summaries
      .filter((s) => (filterYear === "All" ? true : s.year === filterYear))
      .filter((s) => {
        if (!term) return true;
        return (
          s.groupId.toLowerCase().includes(term) ||
          (s.committeeMembers || []).join(" ").toLowerCase().includes(term) ||
          (s.status || "").toLowerCase().includes(term)
        );
      })
      .map((s) => ({
        "Group#": s.groupId,
        Year: s.year,
        "Committee Members": s.committeeMembers.join(", "),
        "Individual Marks": s.individualTotals
          .map((it) => `${it.student}: ${it.total}/${it.max}`)
          .join(" | "),
        "Group Total": s.groupTotal,
        Average: s.average + "%",
        Status: s.status,
        Time: s.timestamp,
        Actions:
          s.status === "Pending" ? (
            <Button size="small" variant="contained" onClick={() => finalize(s.id)}>
              Finalize
            </Button>
          ) : (
            <Button size="small" variant="outlined" onClick={() => reopen(s.id)}>
              Reopen
            </Button>
          ),
      }));
  }, [summaries, filterYear, searchTerm]);

  function exportCSV() {
    const headers = [
      "Group#",
      "Year",
      "Committee Members",
      "Individual Marks",
      "Group Total",
      "Average",
      "Status",
      "Time",
    ];
    const csvRows = [headers.join(",")].concat(
      summaries.map((s) =>
        headers
          .map((h) => {
            switch (h) {
              case "Group#":
                return `"${s.groupId}"`;
              case "Year":
                return `"${s.year}"`;
              case "Committee Members":
                return `"${s.committeeMembers.join("; ")}"`;
              case "Individual Marks":
                return `"${s.individualTotals
                  .map((it) => `${it.student}:${it.total}/${it.max}`)
                  .join("; ")}"`;
              case "Group Total":
                return `"${s.groupTotal}"`;
              case "Average":
                return `"${s.average}%"`;
              case "Status":
                return `"${s.status}"`;
              case "Time":
                return `"${s.timestamp}"`;
              default:
                return '""';
            }
          })
          .join(",")
      )
    );
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coordinator_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box>
      <DashboardSectionHeader description="Coordinator: review, finalize or reopen committee evaluations across all groups">
        Committee Results — Coordinator
      </DashboardSectionHeader>

      <Paper className="evaluation-form-paper elevated-card" sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="filled">
              <InputLabel>Year</InputLabel>
              <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <MenuItem value="All">All Years</MenuItem>
                <MenuItem value="FYP-1">FYP-1</MenuItem>
                <MenuItem value="FYP-2">FYP-2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <TextField
                size="small"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV}>
                Export CSV
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="evaluation-table-paper">
        <AppTable
          headers={[
            "Group#",
            "Year",
            "Committee Members",
            "Individual Marks",
            "Group Total",
            "Average",
            "Status",
            "Time",
            "Actions",
          ]}
          rows={rows}
        />
      </Paper>
    </Box>
  );
}

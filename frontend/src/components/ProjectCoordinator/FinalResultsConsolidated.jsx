import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toastService } from "../ToastService/ToastService.jsx";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Stack,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent
} from "@mui/material";
import {
  Search as SearchIcon,
  FileDownload,
  School,
  Assessment,
  Group as GroupIcon,
  CheckCircle,
  AccountCircle
} from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable.jsx";
import "./CommitteeResults.css";

const getGrade = (total) => {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "F";
};

const getStatus = (total) => (total >= 50 ? "Pass" : "Fail");

const maskGroupId = (originalId) => {
  if (!originalId) return 'group-00000';
  if (typeof originalId === 'object') {
    return originalId.groupId || originalId.id || originalId._id || 'group-00000';
  }
  const str = String(originalId);
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return `Group-${str.slice(-5).toUpperCase()}`;
  }
  return str;
};

export default function FinalResultsConsolidated({ role = "coordinator" }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const loggedSapId = localStorage.getItem("studentId");
  const userRole = (localStorage.getItem("role") || role || "").toLowerCase();

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/coordinator/final-results", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.data.success) {
          let data = res.data.data;

          const storageEmail = String(localStorage.getItem("email") || "").toLowerCase().trim();
          let storageSap = String(localStorage.getItem("studentId") || loggedSapId || "").trim();
          if (storageSap === "0" || storageSap === "undefined") storageSap = "";

          // Role-Based Filtering
          if (userRole.includes("student")) {
            data = data.filter(r => {
              const rSap = String(r.sapId || "").trim();
              const rEmail = String(r.studentEmail || "").toLowerCase().trim();
              const belongsToStudent = (storageSap && rSap === storageSap) || (storageEmail && rEmail === storageEmail);

              // Only show if results are published by coordinator
              return belongsToStudent && r.isPublished;
            });
          } else if (userRole.includes("supervisor")) {
            const supRes = await axios.get("http://localhost:5000/api/supervisor/groups", {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (supRes.data && supRes.data.success) {
              const myGroupsIds = supRes.data.groups.map(g => String(g.groupId).toLowerCase());
              data = data.filter(r => myGroupsIds.includes(String(r.groupId).toLowerCase()));
            }
          }

          const mapped = data.map(r => {
            let passedMarks = r.finalScore >= 50;
            let currentStatus = passedMarks ? "Pass" : "Fail";

            // New logic: Fail student if templates are not approved yet
            if (r.year === "FYP-1" && !r.isFyp1Approved) {
              currentStatus = "Fail (Templates Pending)";
            } else if (r.year === "FYP-2" && !r.isFyp2Approved) {
              currentStatus = "Fail (Templates Pending)";
            }

            return {
              ...r,
              grade: getGrade(r.finalScore),
              status: currentStatus,
              committeeTotal: (r.committeeAverage || 0) + (r.extraMarks || 0),
              supervisorTotal: (r.supervisorMarks || 0)
            };
          });
          setResults(mapped);
        }
      } catch (err) {
        console.error("Fetch Data error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [userRole, loggedSapId]);

  const filteredResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return results
      .filter(r => {
        if (!term) return true;
        const masked = maskGroupId(r.groupId);
        return (
          String(r.groupId).toLowerCase().includes(term) ||
          masked.toLowerCase().includes(term) ||
          String(r.studentName).toLowerCase().includes(term) ||
          String(r.sapId).toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (a.sapId !== b.sapId) return String(a.sapId).localeCompare(String(b.sapId));
        return String(a.year).localeCompare(String(b.year));
      });
  }, [results, searchTerm]);

  // Aggregate stats for coordinator view
  const stats = useMemo(() => {
    if (results.length === 0) return null;
    return {
      totalStudents: new Set(results.map(r => r.sapId)).size,
      avgScore: (results.reduce((s, r) => s + r.finalScore, 0) / results.length).toFixed(1),
      passRate: ((results.filter(r => r.status === 'Pass').length / results.length) * 100).toFixed(0),
      fyp1Count: results.filter(r => String(r.year).includes("1")).length,
      fyp2Count: results.filter(r => String(r.year).includes("2")).length
    };
  }, [results]);

  const handlePublish = async (committeeEvalId) => {
    if (!committeeEvalId) {
      toastService.error("No committee evaluation found to publish.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/committee-evaluation/approve", { id: committeeEvalId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        toastService.success("Evaluation results published to student successfully!");
        // Refresh local state to avoid re-fetch
        setResults(prev => prev.map(item => item.committeeEvalId === committeeEvalId ? { ...item, isPublished: true } : item));
      }
    } catch (err) {
      console.error("Publish error:", err);
      toastService.error(err.response?.data?.message || "Failed to publish evaluation.");
    } finally {
      setLoading(false);
    }
  };

  const tableRows = useMemo(() => {
    return filteredResults.map(r => {
      const row = {
        "Group#": <span className="cor-week-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{maskGroupId(r.groupId)}</span>,
        "Year": <Chip label={r.year.toUpperCase()} size="small" variant="filled" sx={{ bgcolor: r.year.includes('2') ? '#01337a' : '#2563eb', color: 'white', fontWeight: 800 }} />,
        "Student": (
          <Stack spacing={0.2}>
            <Typography variant="body2" fontWeight={800} color="#1e293b">{r.studentName}</Typography>
            <Typography variant="caption" color="text.secondary">{r.sapId}</Typography>
          </Stack>
        ),
        "Grand Total": <Typography variant="h6" fontWeight={900} color="#01337a">{r.finalScore.toFixed(1)}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', marginLeft: 2 }}>/100</span></Typography>,
        "Grade": <Typography fontWeight={800} color={r.grade === 'F' ? '#ef4444' : '#1e293b'}>{r.grade}</Typography>,
        "Status": (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={r.status} size="small" sx={{ fontWeight: 800, bgcolor: r.status === 'Pass' ? '#dcfce7' : '#fee2e2', color: r.status === 'Pass' ? '#166534' : '#991b1b' }} />
            {r.isArchived && <Chip label="Archived" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18, color: '#64748b', borderColor: '#e2e8f0', bgcolor: '#f8fafc' }} />}
          </Stack>
        )
      };

      if (!userRole.includes("student")) {
        row["Committee"] = (
          <Stack spacing={0.2}>
            <Typography variant="body2" fontWeight={700} color="#0369a1">{r.committeeTotal.toFixed(1)}/50</Typography>
            {r.extraMarks > 0 && <Chip label={`+${r.extraMarks} Adj`} size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }} />}
          </Stack>
        );
        row["Supervisor"] = <Typography variant="body2" fontWeight={700} color="#01337a">{r.supervisorTotal.toFixed(1)}/50</Typography>;
        row["Comments"] = (
          <Box sx={{ maxWidth: '300px', fontSize: '0.85rem', fontStyle: 'italic', color: '#64748b' }}>
            {r.remarks || "—"}
          </Box>
        );
      }

      // Remarks logic
      let remarkText = "—";
      if (r.status === 'Pass') {
        if (r.year.includes('1')) {
          remarkText = "Congratulations! You are promoted to FYP-2.";
        } else {
          remarkText = "Congratulations! You have completed your FYP.";
        }
      } else if (r.status === 'Fail (Templates Pending)') {
        remarkText = "Failed: Templates Pending.";
      } else if (r.status === 'Fail' || r.grade === 'F') {
        remarkText = "Failed: F Grade";
      }
      row["Remarks"] = <span style={{ fontSize: '0.85rem', fontWeight: 600, color: r.status === 'Pass' ? '#166534' : '#991b1b' }}>{remarkText}</span>;

      return row;
    });
  }, [filteredResults, userRole]);

  function exportCSV() {
    const isStudent = userRole.includes("student");
    const headers = isStudent
      ? ["Group#", "Year", "Student Name", "SAP ID", "Final Score", "Grade", "Status"]
      : ["Group#", "Year", "Student Name", "SAP ID", "Committee Average", "Extra Adjustments", "Supervisor Evaluation", "Final Score", "Grade", "Status", "Remarks"];

    const csvRows = [headers.join(",")].concat(results.map(r => {
      // Local remark logic for CSV export
      let remarkText = "—";
      let resStatus = r.finalScore >= 50 ? "Pass" : "Fail";
      if (r.year === "FYP-1" && !r.isFyp1Approved) resStatus = "Fail (Templates Pending)";
      else if (r.year === "FYP-2" && !r.isFyp2Approved) resStatus = "Fail (Templates Pending)";

      if (resStatus === 'Pass') {
        remarkText = r.year.includes('1') ? "Congratulations! You are promoted to FYP-2." : "Congratulations! You have completed your FYP.";
      } else if (resStatus === 'Fail (Templates Pending)') {
        remarkText = "Failed: Templates Pending.";
      } else if (resStatus === 'Fail' || getGrade(r.finalScore) === 'F') {
        remarkText = "Failed: F Grade";
      }

      if (isStudent) {
        return [
          maskGroupId(r.groupId),
          r.year,
          `"${r.studentName}"`,
          r.sapId,
          r.finalScore,
          r.grade,
          resStatus,
          `"${remarkText}"`
        ].join(",");
      }
      return [
        maskGroupId(r.groupId),
        r.year,
        `"${r.studentName}"`,
        r.sapId,
        r.committeeAverage,
        r.extraMarks,
        r.supervisorMarks,
        r.finalScore,
        r.grade,
        resStatus,
        `"${remarkText}"`
      ].join(",");
    }));
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Final_Results_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  if (loading && results.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress color="primary" /></Box>;
  }

  return (
    <div className="cor-committee-container">
      <DashboardSectionHeader description="Consolidated grading summary integrating committee panel assessments and supervisor evaluations.">
        Final Evaluation Results
      </DashboardSectionHeader>

      {/* Aggregate Stats Cards */}
      {userRole !== "student" && stats && (
        <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 4, bgcolor: '#f0f9ff', border: '1px solid #e0f2fe', boxShadow: 'none' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: '#01337a', borderRadius: 2, color: 'white' }}><GroupIcon /></Box>
                  <Box>
                    <Typography variant="caption" color="#0369a1" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Total Students</Typography>
                    <Typography variant="h5" fontWeight={900} color="#01337a">{stats.totalStudents}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 4, bgcolor: '#f0fdf4', border: '1px solid #dcfce7', boxShadow: 'none' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: '#16a34a', borderRadius: 2, color: 'white' }}><CheckCircle /></Box>
                  <Box>
                    <Typography variant="caption" color="#166534" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Overall Pass Rate</Typography>
                    <Typography variant="h5" fontWeight={900} color="#166534">{stats.passRate}%</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 4, bgcolor: '#fff7ed', border: '1px solid #ffedd5', boxShadow: 'none' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: '#c2410c', borderRadius: 2, color: 'white' }}><Assessment /></Box>
                  <Box>
                    <Typography variant="caption" color="#9a3412" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Average Score</Typography>
                    <Typography variant="h5" fontWeight={900} color="#c2410c">{stats.avgScore}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #f1f5f9', boxShadow: 'none' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: '#475569', borderRadius: 2, color: 'white' }}><School /></Box>
                  <Box>
                    <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Assessment Count</Typography>
                    <Typography variant="h6" fontWeight={900} color="#1e293b">P1: {stats.fyp1Count} | P2: {stats.fyp2Count}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Student Profile Identity Card */}
      {userRole === "student" && results.length > 0 && (
        <Paper sx={{ mb: 4, p: 3, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.05 }}><AccountCircle sx={{ fontSize: 160 }} /></Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1.5, bgcolor: '#01337a', borderRadius: '50%', color: 'white' }}><School sx={{ fontSize: 32 }} /></Box>
            <Box>
              <Typography variant="h5" fontWeight={900} color="#01337a">{results[0].studentName}</Typography>
              <Typography variant="body2" color="#64748b" fontWeight={600}>SAP ID: {results[0].sapId} • {maskGroupId(results[0].groupId)}</Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Main Table Card */}
      <Paper className="cor-committee-paper" sx={{ borderRadius: 6 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            {userRole !== "student" ? (
              <TextField
                size="small"
                placeholder="Search students, groups..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment> }}
              />
            ) : <Typography variant="h6" fontWeight={800} color="#01337a">Detailed Breakdowns</Typography>}

            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={exportCSV}
              sx={{ borderRadius: 3, bgcolor: '#01337a', px: 3 }}
            >
              Download Report (CSV)
            </Button>
          </Stack>
        </Box>

        {tableRows.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center', color: '#94a3b8' }}>
            <Typography variant="h6" fontWeight={700}>No results found.</Typography>
            <Typography variant="body2">Try adjusting your search or check back later once evaluations are published.</Typography>
          </Box>
        ) : (
          <AppTable
            headers={userRole.includes("student")
              ? ["Group#", "Year", "Student", "Grand Total", "Grade", "Status", "Remarks"]
              : ["Group#", "Year", "Student", "Committee", "Supervisor", "Grand Total", "Grade", "Status", "Comments", "Remarks"]
            }
            rows={tableRows}
          />
        )}
      </Paper>

      {/* Formula Note */}
      <Box sx={{ mt: 3, p: 2, background: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Typography variant="caption" color="#64748b" fontWeight={600}>
          * Grand Total = Committee Assessment (scaled to 50) + Extra Marks + Supervisor Evaluation (scaled to 50).
          Final grade and status are based on the aggregate 100-mark score.
        </Typography>
      </Box>
    </div>
  );
}
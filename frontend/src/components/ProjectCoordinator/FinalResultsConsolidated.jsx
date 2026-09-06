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
  if (total >= 85) return "A";
  if (total >= 80) return "A-";
  if (total >= 75) return "B+";
  if (total >= 70) return "B";
  if (total >= 65) return "B-";
  if (total >= 61) return "C+";
  if (total >= 58) return "C";
  if (total >= 55) return "C-";
  if (total >= 50) return "D";
  return "F";
};

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
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/coordinator/final-results`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.data.success) {
          let data = res.data.data;

          // Only show results if supervisor evaluation marks are published, OR if the group is archived
          data = data.filter(r => r.isSupPublished || r.isArchived);

          const storageEmail = String(localStorage.getItem("email") || "").toLowerCase().trim();
          let storageSap = String(localStorage.getItem("studentId") || loggedSapId || "").trim();
          if (storageSap === "0" || storageSap === "undefined") storageSap = "";

          // Role-Based Filtering
          if (userRole.includes("student")) {
            data = data.filter(r => {
              const rSap = String(r.sapId || "").trim();
              const rEmail = String(r.studentEmail || "").toLowerCase().trim();
              const belongsToStudent = (storageSap && rSap === storageSap) || (storageEmail && rEmail === storageEmail);

              // Only show if results are published by coordinator (either committee or supervisor)
              return belongsToStudent && (r.isPublished || r.isSupPublished || r.isArchived);
            });
          } else if (userRole.includes("supervisor")) {
            const supRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/supervisor/groups`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (supRes.data && supRes.data.success) {
              const myGroupsIds = supRes.data.groups.map(g => String(g.groupId).toLowerCase());
              data = data.filter(r => myGroupsIds.includes(String(r.groupId).toLowerCase()));
            }
          }

          const mapped = data.map(r => {
            const committeeTotal = (r.committeeAverage || 0) + (r.extraMarks || 0);
            const supervisorTotal = (r.supervisorMarks || 0);
            const finalScore = committeeTotal + supervisorTotal;

            let passedMarks = finalScore >= 50;
            let currentStatus = passedMarks ? "Pass" : "Fail";

            // Fail student if templates are not approved yet
            if (r.year.includes("1") && !r.isFyp1Approved) {
              currentStatus = "Fail (Templates Pending)";
            } else if (r.year.includes("2") && !r.isFyp2Approved) {
              currentStatus = "Fail (Templates Pending)";
            }

            return {
              ...r,
              grade: getGrade(finalScore),
              status: currentStatus,
              committeeTotal: committeeTotal,
              supervisorTotal: supervisorTotal,
              finalScore: finalScore
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

  // Aggregate stats
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
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/committee-evaluation/approve`, { id: committeeEvalId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        toastService.success("Evaluation results published to student successfully!");
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
      const isCoordinator = userRole.includes("coordinator");
      const isStudent = userRole.includes("student");
      const isSupervisor = userRole.includes("supervisor");

      const row = {
        "Group#": <span className="cor-week-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{maskGroupId(r.groupId)}</span>,
        "Year": <Chip label={r.year.toUpperCase()} size="small" variant="filled" sx={{ bgcolor: r.year.includes('2') ? '#01337a' : '#2563eb', color: 'white', fontWeight: 800 }} />,
        "Student": (
          <Stack spacing={0.2}>
            <Typography variant="body2" fontWeight={800} color="#1e293b">{r.studentName}</Typography>
            <Typography variant="caption" color="text.secondary">{r.sapId}</Typography>
          </Stack>
        )
      };

      // Scoring Visibility
      const showGrandTotal = isCoordinator || (r.isPublished && r.isSupPublished);
      const showPartial = r.isPublished || r.isSupPublished;

      row["Grand Total"] = (
        <Typography variant="h6" fontWeight={900} color="#01337a">
          {isCoordinator ? (
             r.finalScore.toFixed(1)
          ) : (
             showGrandTotal ? (
               r.finalScore.toFixed(1)
             ) : (
               showPartial ? (
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Grading in Progress...</span>
               ) : "—"
             )
          )}
          {(isCoordinator || showGrandTotal) && <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', marginLeft: 2 }}>/100</span>}
        </Typography>
      );

      row["Grade"] = (
        <Typography fontWeight={800} color={r.grade === 'F' ? '#ef4444' : '#1e293b'}>
          {(isCoordinator || showGrandTotal) ? r.grade : "—"}
        </Typography>
      );

      row["Status"] = (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={r.status} size="small" sx={{ fontWeight: 800, bgcolor: r.status === 'Pass' ? '#dcfce7' : '#fee2e2', color: r.status === 'Pass' ? '#166534' : '#991b1b' }} />
          {r.isArchived && <Chip label="Archived" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18, color: '#64748b', borderColor: '#e2e8f0', bgcolor: '#f8fafc' }} />}
        </Stack>
      );

      if (!isStudent) {
        row["Committee"] = (
          <Stack spacing={0.2}>
            <Typography variant="body2" fontWeight={700} color="#0369a1">
               {isCoordinator ? `${r.committeeTotal.toFixed(1)}/50` : (r.isPublished ? `${r.committeeTotal.toFixed(1)}/50` : "Not Published")}
            </Typography>
            {r.extraMarks > 0 && <Chip label={`+${r.extraMarks} Adj`} size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }} />}
          </Stack>
        );
        row["Supervisor"] = (
          <Typography variant="body2" fontWeight={700} color="#01337a">
            {isCoordinator || isSupervisor || r.isSupPublished ? `${r.supervisorTotal.toFixed(1)}/50` : "Not Published"}
          </Typography>
        );
      }

      // Remarks logic
      let remarkText = "—";
      if (r.status === 'Pass') {
        remarkText = r.year.includes('1') ? "Promoted to FYP-2." : "Completed FYP-2.";
      } else if (r.status === 'Fail (Templates Pending)') {
        remarkText = "Failed: Templates Pending.";
      } else if (r.status === 'Fail' || r.grade === 'F') {
        remarkText = "Failed: Below Threshold.";
      }
      row["Remarks"] = <span style={{ fontSize: '0.85rem', fontWeight: 600, color: r.status === 'Pass' ? '#166534' : '#991b1b' }}>{remarkText}</span>;

      return row;
    });
  }, [filteredResults, userRole]);

  function exportCSV() {
    const isStudent = userRole.includes("student");
    const headers = isStudent
      ? ["Group#", "Year", "Student Name", "SAP ID", "Final Score", "Grade", "Status", "Remarks"]
      : ["Group#", "Year", "Student Name", "SAP ID", "Committee Total", "Supervisor Marks", "Final Score", "Grade", "Status", "Remarks"];

    const csvRows = [headers.join(",")].concat(results.map(r => {
      let remarkText = "—";
      if (r.status === 'Pass') {
        remarkText = r.year.includes('1') ? "Promoted to FYP-2" : "Completed FYP-2";
      } else if (r.status === 'Fail (Templates Pending)') {
        remarkText = "Templates Pending";
      } else {
        remarkText = "Failed";
      }

      const showTotals = !isStudent || (r.isPublished && r.isSupPublished);

      if (isStudent) {
        return [
          maskGroupId(r.groupId),
          r.year,
          `"${r.studentName}"`,
          r.sapId,
          showTotals ? r.finalScore : "Pending",
          showTotals ? r.grade : "Pending",
          r.status,
          `"${remarkText}"`
        ].join(",");
      }
      return [
        maskGroupId(r.groupId),
        r.year,
        `"${r.studentName}"`,
        r.sapId,
        r.committeeTotal,
        r.supervisorTotal,
        r.finalScore,
        r.grade,
        r.status,
        `"${remarkText}"`
      ].join(",");
    }));
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Final_Results_Consolidated_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  if (loading && results.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress color="primary" /></Box>;
  }

  return (
    <div className="cor-committee-container">
      <DashboardSectionHeader description="Consolidated grading summary integrating committee panel assessments and supervisor evaluations.">
        Final Results Consolidated
      </DashboardSectionHeader>

      {/* Aggregate Stats Cards */}
      {userRole !== "student" && stats && (
        <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
            ) : <Typography variant="h6" fontWeight={800} color="#01337a">Final Degree Audit</Typography>}

            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={exportCSV}
              sx={{ borderRadius: 3, bgcolor: '#01337a', px: 3 }}
            >
              Export Results report
            </Button>
          </Stack>
        </Box>

        {tableRows.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center', color: '#94a3b8' }}>
            <Typography variant="h6" fontWeight={700}>No final results available.</Typography>
            <Typography variant="body2">Evaluations may still be in progress or pending publication.</Typography>
          </Box>
        ) : (
          <AppTable
            headers={userRole.includes("student")
              ? ["Group#", "Year", "Student", "Grand Total", "Grade", "Status", "Remarks"]
              : ["Group#", "Year", "Student", "Committee", "Supervisor", "Grand Total", "Grade", "Status", "Remarks"]
            }
            rows={tableRows}
          />
        )}
      </Paper>

      {/* Formula Note */}
      <Box sx={{ mt: 3, p: 2, background: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Typography variant="caption" color="#64748b" fontWeight={600}>
          * Consolidated Score = Committee Panel Avg (scaled to 50) + Supervisor Assessment (scaled to 50).
          Passing required 50% aggregate and approved artifacts.
        </Typography>
      </Box>
    </div>
  );
}
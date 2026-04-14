import React, { useEffect, useState, useMemo } from "react";
import supervisorService from "../Api/supervisorService.jsx";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  LinearProgress,
  Tooltip,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Grid, TableBody, TableHead, Table, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { PieChart } from "@mui/x-charts";
import { CheckCircle, FileDownload, RestartAlt, Visibility } from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import "./SupervisorEvaluations.css";


// ----- Dummy Data Managed by State -----
const Year = [
  { id: "fyp1", name: "FYP-1", weight: 0.2 },
  { id: "fyp2", name: "FYP-2", weight: 0.3 },
];


export default function SupervisorEvaluations() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [rubric, setRubric] = useState([]);
  const [scores, setScores] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [formError, setFormError] = useState("");
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingComm, setFetchingComm] = useState(false);
  const [committeeEval, setCommitteeEval] = useState(null);
  const email = localStorage.getItem("email");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvalDetails, setSelectedEvalDetails] = useState(null);
  const [evalSearch, setEvalSearch] = useState("");
  const [evalMilestoneFilter, setEvalMilestoneFilter] = useState("All");

  /* ── Load Groups ── */
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await supervisorService.getSupervisorGroups();
        if (res.success) {
          const mapped = res.groups.map(g => ({
            id: g.groupId,
            maskedId: g.maskedGroupId,
            name: g.description,
            // members may come as objects {name, sapId} — extract just the name string
            members: (g.members || []).map(m =>
              typeof m === "string" ? m : (m.name || m.sapId || "Unknown")
            )
          }));
          setGroups(mapped);
        }
      } catch (err) {
        console.error("Failed to load groups:", err);
      }
    };
    loadGroups();
  }, []);

  /* ── Load Evaluations ── */
  useEffect(() => {
    if (!selectedGroup) return;
    const loadEvals = async () => {
      try {
        const res = await supervisorService.fetchEvaluations(selectedGroup);
        if (res.success) {
          const mapped = (res.evaluations || []).map(ev => {
            // Group rubric items by student to count unique students and calculate per-student totals
            const studentSummaries = {};
            (ev.evaluations || []).forEach(e => {
              const sName = e.studentName || e.name || "Unknown";
              if (!studentSummaries[sName]) {
                studentSummaries[sName] = { marks: 0, max: 0 };
              }
              studentSummaries[sName].marks += (e.marks || 0);
              studentSummaries[sName].max += (e.maxMarks || 0);
            });

            const uniqueStudentNames = Object.keys(studentSummaries);
            const studentCount = uniqueStudentNames.length || 1;

            // For brief display: "Student1: 40/50 | Student2: 35/50"
            const studentMarksStr = uniqueStudentNames.map(name => {
              const s = studentSummaries[name];
              return `${name}: ${s.marks}/${s.max || 50}`;
            }).join(" | ");

            return {
              groupId: ev.groupId,
              fypYear: ev.fypYear?.toUpperCase() || "—",
              name: uniqueStudentNames.join(", "),
              totalMarks: ev.totalMarks,
              // Supervisor Rubric evaluation is out of 50 per student (total 50 across items)
              maxMarks: studentCount * 50,
              studentMarks: studentMarksStr,
              rawRubric: ev.evaluations || []
            };
          });
          setEvaluations(mapped);
        }
      } catch (err) {
        console.error("Failed to load evaluations:", err);
      }
    };
    loadEvals();
  }, [selectedGroup]);

  /* ── Setup Rubric ── */
  useEffect(() => {
    if (selectedMilestone && selectedGroup) {
      // Regular Evaluation - Single Score (50 marks per student)
      const group = groups.find(g => g.id === selectedGroup);
      if (group && group.members) {
        const membersRubric = group.members.map(m => ({
          studentName: m,
          name: m,
          label: "Final Score",
          maxMarks: 50
        }));
        setRubric(membersRubric);
        setScores(Array(membersRubric.length).fill(""));
        setFeedback(Array(membersRubric.length).fill(""));
      }
    } else {
      setRubric([]);
      setScores([]);
      setFeedback([]);
    }
    setSubmitted(false);
    setSubmittedResult(null);
  }, [selectedMilestone, selectedGroup, groups]);

  /* ── Load Committee Eval ── */
  useEffect(() => {
    if (selectedGroup && selectedMilestone) {
      const fetchComm = async () => {
        try {
          setFetchingComm(true);
          const res = await axios.get(`http://localhost:5000/api/committee-evaluation/onlyApproved?supervisor=${email}`);
          if (res.data.success) {
            const found = res.data.data.find(ev => {
              const groupMatch = String(ev.groupId?._id || ev.groupId) === String(selectedGroup);
              const partMatch = ev.scheduleId?.fypPart?.replace("-", "").toLowerCase() === selectedMilestone.toLowerCase();

              if (!groupMatch || !partMatch) return false;

              // Explicit milestone mapping
              const week = ev.scheduleId?.week || "";
              if (selectedMilestone.toLowerCase() === "fyp1") {
                return /week\s*16/i.test(week);
              } else if (selectedMilestone.toLowerCase() === "fyp2") {
                return /week\s*14/i.test(week);
              }
              return true;
            });
            setCommitteeEval(found || null);
          }
        } catch (err) {
          console.error("Error fetching committee eval:", err);
        } finally {
          setFetchingComm(false);
        }
      };
      fetchComm();
    } else {
      setCommitteeEval(null);
      setFetchingComm(false);
    }
  }, [selectedGroup, selectedMilestone, email]);

  useEffect(() => {
    if (!selectedGroup || !selectedMilestone) {
      setAlreadyEvaluated(false);
      return;
    }
    const normalize = (v) => v?.replace("-", "").toLowerCase();
    const exists = evaluations.some(
      ev => String(ev.groupId) === String(selectedGroup) &&
        normalize(ev.fypYear) === normalize(selectedMilestone)
    );
    setAlreadyEvaluated(exists);
  }, [selectedGroup, selectedMilestone, evaluations]);

  const totalMarks = scores.reduce((sum, val) => sum + (Number(val) || 0), 0);
  const maxMarks = rubric.reduce((sum, item) => sum + item.maxMarks, 0);
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  const weightedPercent = Math.round(percentage * 0.5);

  const handleScoreChange = (idx, value) => {
    let v = Number(value || 0);
    v = Math.max(0, Math.min(v, rubric[idx].maxMarks));
    setScores(scores.map((s, i) => (i === idx ? v : s)));
  };

  const handleFeedbackChange = (idx, value) => {
    setFeedback(feedback.map((f, i) => (i === idx ? value : f)));
  };

  const committeeMarksByStudent = useMemo(() => {
    let mapping = {};
    if (committeeEval) {
      const evaluationsList = committeeEval.evaluations || [];
      const assignedPanelSize = committeeEval.scheduleId?.facultyPanels?.length || evaluationsList.length || 1;

      evaluationsList.forEach(ev => {
        (ev.students || []).forEach(s => {
          if (!mapping[s.name]) {
            mapping[s.name] = 0;
          }
        });
      });

      Object.keys(mapping).forEach(studentName => {
        let studentSum = 0;
        evaluationsList.forEach(ev => {
          const stuMatch = ev.students.find(s => s.name === studentName);
          if (stuMatch) {
            studentSum += (ev.totalCloMarks || 0);
          }
        });
        const avgCloRaw = studentSum / assignedPanelSize;
        const commScore = Math.min(50, +(avgCloRaw * 0.5).toFixed(2));
        mapping[studentName] = commScore;
      });
    }
    return mapping;
  }, [committeeEval]);

  const handleSubmit = async () => {
    if (!selectedGroup || !selectedMilestone) {
      setFormError("Please select a group and milestone.");
      return;
    }
    if (!committeeEval) {
      setFormError("Committee evaluation marks are not yet available for this group. You must wait for the committee marks before evaluating.");
      return;
    }
    if (scores.some((s, idx) => s === "" || isNaN(Number(s)) || Number(s) < 0 || Number(s) > rubric[idx].maxMarks)) {
      setFormError("Enter valid marks for all criteria.");
      return;
    }

    if (committeeEval) {

      for (let i = 0; i < scores.length; i++) {
        const stuName = rubric[i].studentName;
        const commScore = committeeMarksByStudent[stuName];
        if (commScore !== undefined) {
          const supScore = Number(scores[i]);
          const diff = Math.abs(supScore - commScore);
          const percentDiff = (diff / 50) * 100;

          if (percentDiff > 15) {
            setFormError(`Marks for ${stuName} cannot differ by more than 15% (7.5 marks) from the committee marks (${commScore}).`);
            return;
          }
          if (percentDiff >= 10 && percentDiff <= 15) {
            if (!feedback[i] || feedback[i].trim() === "") {
              setFormError(`Marks for ${stuName} differ by 10% to 15% from the committee marks (${commScore}). You must provide a reason in the comments.`);
              return;
            }
          }
        }
      }
    }
    const currentEvalData = rubric.map((item, idx) => ({
      studentName: item.studentName,
      name: item.label || item.name,
      marks: Number(scores[idx]),
      score: Number(scores[idx]),
      feedback: feedback[idx] || "",
      maxMarks: item.maxMarks
    }));

    const payload = {
      groupId: selectedGroup,
      fypYear: selectedMilestone,
      evaluations: currentEvalData,
      totalMarks: totalMarks
    };

    try {
      setLoading(true);
      const res = await supervisorService.submitEvaluation(payload);
      if (res.success) {
        // Build studentMarks string for uniform history table display
        const studentSummaries = {};
        currentEvalData.forEach(e => {
          if (!studentSummaries[e.studentName]) studentSummaries[e.studentName] = { marks: 0, max: 0 };
          studentSummaries[e.studentName].marks += e.marks;
          studentSummaries[e.studentName].max += e.maxMarks;
        });
        const studentMarksStr = Object.keys(studentSummaries).map(name => {
          return `${name}: ${studentSummaries[name].marks}/${studentSummaries[name].max}`;
        }).join(" | ");

        const result = {
          groupId: selectedGroup,
          groupName: groups.find(g => g.id === selectedGroup)?.name || selectedGroup,
          fypYear: selectedMilestone,
          milestoneLabel: Year.find(y => y.id === selectedMilestone)?.name || selectedMilestone,
          rawRubric: currentEvalData,
          totalMarks,
          maxMarks,
          percentage,
          studentMarks: studentMarksStr,
          timestamp: new Date().toLocaleString(),
          supervisor: true
        };
        setEvaluations(prev => [result, ...prev]);
        setSubmittedResult(result);
        setSubmitted(true);
        setFormError("");
        setSuccessDialogOpen(true);
      } else {
        setFormError(res.message || "Submission failed");
      }
    } catch (err) {
      setFormError(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOk = () => {
    setSuccessDialogOpen(false);
  };

  useEffect(() => {
    setSubmitted(false);
    setFormError("");
  }, [selectedGroup, selectedMilestone]);


  /* ── Filtered Evaluations for History Table ── */
  const filteredEvaluations = useMemo(() => {
    const term = (evalSearch || "").trim().toLowerCase();
    return evaluations
      .filter(ev => {
        if (evalMilestoneFilter !== "All" && String(ev.fypYear).toLowerCase() !== String(evalMilestoneFilter).toLowerCase()) return false;
        if (!term) return true;
        const group = groups.find(g => g.id === ev.groupId);
        const groupName = group ? group.name : (ev.groupId || "");
        return (
          groupName.toLowerCase().includes(term) ||
          ev.fypYear.toLowerCase().includes(term)
        );
      })
      .map(ev => {
        const group = groups.find(g => g.id === ev.groupId);
        return {
          "Group#": group ? group.maskedId : (ev.groupId || ""),
          "Year": ev.fypYear,
          "Student Marks": <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{ev.studentMarks}</span>,
          "Group Total": <strong>{ev.totalMarks}</strong>,
          "Max": ev.maxMarks,
          "Actions": (
            <Button
              variant="text"
              size="small"
              startIcon={<Visibility />}
              onClick={() => {
                setSelectedEvalDetails(ev);
                setDetailsDialogOpen(true);
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              View Rubrics
            </Button>
          ),
          __raw: ev
        };
      });
  }, [evaluations, evalSearch, evalMilestoneFilter, groups]);

  const exportCSV = () => {
    const headers = ["Group#", "Year", "Student Marks", "Group Total", "Max"];
    const rowsExport = evaluations.map(ev => {
      const group = groups.find(g => g.id === ev.groupId);
      return [
        group ? group.maskedId : (ev.groupId || ""),
        ev.fypYear,
        ev.studentMarks,
        ev.totalMarks,
        ev.maxMarks
      ];
    });
    const csvContent = [headers, ...rowsExport].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };


  const evalHeaders = ["Group#", "Year", "Student Marks", "Group Total", "Max", "Actions"];

  return (
    <Box>
      <DashboardSectionHeader
        description={`Here you can evaluate your assigned groups. Select a group and choose student names to enter marks, then submit your evaluation.`}
      >
        Evaluation 
      </DashboardSectionHeader>
      <Paper className="evaluation-form-paper elevated-card">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth className="evaluation-form-control" variant="filled" size="small">
              <InputLabel>Select Group</InputLabel>
              <Select
                value={selectedGroup}
                label="Select Group"
                onChange={e => setSelectedGroup(e.target.value)}
                size="small"
                style={{ height: '47px' }}
              >
                <MenuItem value=""><em>Choose group</em></MenuItem>
                {groups.map(g => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.maskedId} - {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth className="evaluation-form-control" variant="filled" size="small">
              <InputLabel>Select Year</InputLabel>
              <Select
                value={selectedMilestone}
                label="Select Year"
                onChange={e => setSelectedMilestone(e.target.value)}
                size="small"
                style={{ height: '47px', width: '250px' }}
              >
                <MenuItem value=""><em>Choose Year</em></MenuItem>
                {Year.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>

            <Button
              variant="outlined"
              size="large"
              startIcon={<FileDownload />}
              onClick={exportCSV}
              sx={{ mr: 1 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<RestartAlt />}
              onClick={() => { setSelectedGroup(""); setSelectedMilestone(""); setFormError(""); setSubmitted(false); }}
              sx={{ 
                bgcolor: "#01337a", 
                color: "#ffffff",
                border: "2px solid #01337a",
                fontWeight: 700,
                textTransform: "none",
                transition: "all 0.3s ease",
                "&:hover": { bgcolor: "#ffffff", color: "#01337a", border: "2px solid #01337a" } 
              }}
            >
              Reset form
            </Button>
          </Grid>
        </Grid>

        <Divider className="evaluation-divider" />

        {/* Rubric Form */}
        {alreadyEvaluated ? (
          <Box my={3} p={3} sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Chip icon={<CheckCircle />} label="Already Evaluated" color="success" sx={{ fontWeight: 700 }} />
              <Typography variant="h6" color="#16a34a" fontWeight={700}>
                Marks already submitted for this milestone.
              </Typography>
            </Stack>

            {(() => {
              const normalize = (v) => v?.replace("-", "").toLowerCase();
              const existing = evaluations.find(
                ev => String(ev.groupId) === String(selectedGroup) &&
                  normalize(ev.fypYear) === normalize(selectedMilestone)
              );
              if (!existing) return null;
              return (
                <Box>
                  <Typography variant="body1" color="#374151" mb={1}>
                    <strong>Evaluated Marks:</strong>
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" color="#475569" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                      {existing.studentMarks}
                    </Typography>
                    <Typography variant="h6" color="#01337a" mt={2} fontWeight={800}>
                      Group Total: {existing.totalMarks} / {existing.maxMarks}
                    </Typography>
                  </Box>
                </Box>
              );
            })()}
          </Box>
        ) : (selectedGroup && selectedMilestone) ? (
          /* ── Rubric entry form ── */
          <>
            <Typography fontWeight={700} mb={1} className="rubric-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Supervisor Rubric (Max 50) - {Year.find(y => y.id === selectedMilestone)?.name || selectedMilestone}
            </Typography>
            {(!committeeEval && !fetchingComm) && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: 1 }}>
                <Typography color="#92400e" fontWeight={600} fontSize="0.9rem">
                  You cannot evaluate this group yet because the committee has not published their marks.
                </Typography>
              </Box>
            )}
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" className="rubric-table enhanced-table">
                <TableHead>
                  <TableRow>
                    <TableCell className="table-header">Student</TableCell>
                    <TableCell className="table-header">Committee Marks</TableCell>
                    <TableCell className="table-header">Max Marks</TableCell>
                    <TableCell className="table-header">Marks (out of 50)</TableCell>
                    <TableCell className="table-header">Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rubric.map((item, idx) => (
                    <TableRow key={idx}>
                      <>
                        <TableCell sx={{ fontWeight: 600, color: '#013379' }}>
                          {item.studentName}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>
                          {committeeEval ? (committeeMarksByStudent[item.studentName] ?? "N/A") : "N/A"}
                        </TableCell>
                        <TableCell>{item.maxMarks}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={scores[idx]}
                            disabled={!committeeEval || fetchingComm}
                            inputProps={{ min: 0, max: item.maxMarks, className: "marks-input" }}
                            onChange={e => handleScoreChange(idx, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={feedback[idx]}
                            onChange={e => handleFeedbackChange(idx, e.target.value)}
                            disabled={!committeeEval || fetchingComm}
                            size="small"
                            placeholder="(optional)"
                            inputProps={{ maxLength: 120, className: "feedback-input" }}
                          />
                        </TableCell>
                      </>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center" mb={1} mt={2}>
              <Box sx={{ minWidth: 230 }}>
                <Typography fontWeight={700} className="total-marks">
                  Total Score: {totalMarks}/{maxMarks} &nbsp;
                  <span className="total-percentage">({percentage}%)</span>
                </Typography>
                <Box className="linear-progress-box" sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={percentage} className="custom-linear-progress" />
                </Box>
              </Box>
            </Stack>
            {formError && <Typography color="error" mb={1}>{formError}</Typography>}
            <Button
              variant="contained"
              color="primary"
              size="large"
              className="submit-evaluation-btn"
              onClick={handleSubmit}
              disabled={loading || !committeeEval || fetchingComm}
            >
              {loading ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </>
        ) : (
          <Typography color="#666" fontSize={20} my={3}>
            Select a group and year to fill evaluation.
          </Typography>
        )}
      </Paper>

      <Paper className="evaluation-table-paper" sx={{ mt: 3, p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={2} mb={2}>
          <label fontWeight={700} className="all-evals-title">Evaluation History</label>

          <Box sx={{ display: "flex", gap: 2, marginLeft: "auto", alignItems: "center" }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Year Filter</InputLabel>
              <Select
                value={evalMilestoneFilter}
                label="Year Filter"
                onChange={e => setEvalMilestoneFilter(e.target.value)}
              >
                <MenuItem value="All">All Years</MenuItem>
                <MenuItem value="fyp1">FYP-1</MenuItem>
                <MenuItem value="fyp2">FYP-2</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search group..."
              value={evalSearch}
              onChange={e => setEvalSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>
              }}
            />
          </Box>
        </Stack>

        <AppTable headers={evalHeaders} rows={filteredEvaluations} />

        <Box mt={2} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography color="#666">Showing {filteredEvaluations.length} of {evaluations.length} evaluations</Typography>
          <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={exportCSV}>Export CSV</Button>
        </Box>
      </Paper>
      {/* ── Success Popup Dialog ── */}
      <Dialog
        open={successDialogOpen}
        onClose={handleDialogOk}
        PaperProps={{
          sx: {
            borderRadius: 3,
            px: 2,
            py: 1,
            minWidth: 340,
            boxShadow: "0 20px 60px rgba(1,51,122,0.18)",
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 0 }}>
          <CheckCircle sx={{ color: "#16a34a", fontSize: 32 }} />
          <Typography fontWeight={800} fontSize="1.25rem" color="#15803d">
            Evaluation Submitted!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 1 }}>
          {submittedResult && (
            <>
              <Typography fontSize="1rem" color="#374151" mb={0.5}>
                <strong>Group:</strong> {submittedResult.groupName}
              </Typography>
              <Typography fontSize="1rem" color="#374151" mb={0.5}>
                <strong>Milestone:</strong> {submittedResult.milestoneLabel}
              </Typography>
              <Typography fontSize="1rem" color="#374151" mb={0.5}>
                <strong>Total Marks:</strong> {submittedResult.totalMarks} / {submittedResult.maxMarks} &nbsp;
                <span style={{ color: "#2563eb", fontWeight: 700 }}>({submittedResult.percentage}%)</span>
              </Typography>
              <Typography fontSize="0.9rem" color="#6b7280" mt={1}>
                Submitted on {submittedResult.timestamp}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleDialogOk}
            sx={{
              background: "linear-gradient(90deg, #01337a, #2563eb)",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
              "&:hover": { background: "linear-gradient(90deg, #022a66, #1d4ed8)" }
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Detailed Rubric View Dialog ── */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 2 }}>
          <Typography variant="h6" fontWeight={800} color="#01337a">
            {selectedEvalDetails?.fypYear} - {groups.find(g => g.id === selectedEvalDetails?.groupId)?.maskedId}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Evaluation Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead sx={{ background: "#f1f5f9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Criterion</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Marks</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Feedback</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedEvalDetails?.rawRubric || []).map((row, idx, arr) => (
                <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { background: '#fcfcfc' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#013379' }}>
                    {idx === 0 || arr[idx - 1].studentName !== row.studentName ? row.studentName : ""}
                  </TableCell>
                  <TableCell>{row.name || row.label}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${row.marks || row.score}/${row.maxMarks || 50}`}
                      size="small"
                      sx={{ fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#475569", fontStyle: row.feedback ? "normal" : "italic" }}>
                    {row.feedback || "no comments"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ p: 3, background: "#f8fafc", display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="h6" fontWeight={800} color="#01337a">
              Total Score: {selectedEvalDetails?.totalMarks}/{selectedEvalDetails?.maxMarks}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setDetailsDialogOpen(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
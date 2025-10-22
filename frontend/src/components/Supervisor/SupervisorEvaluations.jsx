import React, { useEffect, useState, useMemo } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { PieChart } from "@mui/x-charts";
import { CheckCircle, FileDownload, RestartAlt } from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import "./SupervisorEvaluations.css";

// Dummy Data
const GROUPS = [
  { id: "G-101", name: "Group 1" },
  { id: "G-102", name: "Group 2" },
  { id: "G-103", name: "Group 3" }
];

const MILESTONES = [
  { id: "Proposal", name: "Proposal", weight: 0.2 },
  { id: "Mid", name: "Mid Evaluation", weight: 0.3 },
  { id: "Final", name: "Final Report/Defense", weight: 0.5 }
];

const RUBRICS = {
  Proposal: [
    { name: "Problem Statement", maxMarks: 5 },
    { name: "Objectives", maxMarks: 5 },
    { name: "Methodology", maxMarks: 10 }
  ],
  Mid: [
    { name: "Progress", maxMarks: 8 },
    { name: "Implementation", maxMarks: 10 },
    { name: "Presentation", maxMarks: 7 }
  ],
  Final: [
    { name: "Final Report", maxMarks: 10 },
    { name: "Defense", maxMarks: 10 },
    { name: "Demo", maxMarks: 10 }
  ]
};

const DUMMY_EVALUATIONS = [
  {
    groupId: "G-101",
    milestone: "Proposal",
    scores: [5, 4, 8],
    feedback: ["Good", "Nice", "Improve methodology"],
    totalMarks: 17,
    maxMarks: 20,
    percentage: 85,
    timestamp: "2025-09-13 10:30",
    supervisor: true
  },
  {
    groupId: "G-102",
    milestone: "Proposal",
    scores: [4, 3, 8],
    feedback: ["Ok", "Objectives missing", "Good"],
    totalMarks: 15,
    maxMarks: 20,
    percentage: 75,
    timestamp: "2025-09-14 11:00",
    supervisor: true
  },
  {
    groupId: "G-103",
    milestone: "Mid",
    scores: [6, 6, 6],
    feedback: ["", "", ""],
    totalMarks: 18,
    maxMarks: 25,
    percentage: 72,
    timestamp: "2025-09-16 13:35",
    supervisor: true
  }
];

export default function SupervisorEvaluations() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [rubric, setRubric] = useState([]);
  const [scores, setScores] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [formError, setFormError] = useState("");
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);

  // UI filters for All Evaluations table
  const [evalSearch, setEvalSearch] = useState("");
  const [evalMilestoneFilter, setEvalMilestoneFilter] = useState("All");

  useEffect(() => {
    setEvaluations(DUMMY_EVALUATIONS);
  }, []);

  useEffect(() => {
    if (selectedMilestone) {
      setRubric(RUBRICS[selectedMilestone] || []);
      setScores(Array((RUBRICS[selectedMilestone] || []).length).fill(""));
      setFeedback(Array((RUBRICS[selectedMilestone] || []).length).fill(""));
    } else {
      setRubric([]);
      setScores([]);
      setFeedback([]);
    }
  }, [selectedMilestone]);

  useEffect(() => {
    if (!selectedGroup || !selectedMilestone) {
      setAlreadyEvaluated(false);
      return;
    }
    const exists = evaluations.some(
      ev => ev.groupId === selectedGroup && ev.milestone === selectedMilestone
    );
    setAlreadyEvaluated(exists);
  }, [selectedGroup, selectedMilestone, evaluations]);

  const totalMarks = scores.reduce((sum, val) => sum + (Number(val) || 0), 0);
  const maxMarks = rubric.reduce((sum, item) => sum + item.maxMarks, 0);
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  const weightedPercent = Math.round(percentage * 0.5);

  const handleScoreChange = (idx, value) => {
    const v = Math.max(0, Math.min(Number(value || 0), rubric[idx].maxMarks));
    setScores(scores.map((s, i) => (i === idx ? v : s)));
  };

  const handleFeedbackChange = (idx, value) => {
    setFeedback(feedback.map((f, i) => (i === idx ? value : f)));
  };

  const handleSubmit = () => {
    if (!selectedGroup || !selectedMilestone) {
      setFormError("Please select a group and milestone.");
      return;
    }
    if (scores.some((s, idx) => s === "" || isNaN(Number(s)) || Number(s) < 0 || Number(s) > rubric[idx].maxMarks)) {
      setFormError("Enter valid marks for all criteria.");
      return;
    }
    const newEval = {
      groupId: selectedGroup,
      milestone: selectedMilestone,
      scores: [...scores],
      feedback: [...feedback],
      totalMarks,
      maxMarks,
      percentage,
      timestamp: new Date().toLocaleString(),
      supervisor: true
    };
    setEvaluations(prev => [newEval, ...prev]);
    setSubmitted(true);
    setFormError("");
  };

  useEffect(() => {
    setSubmitted(false);
    setFormError("");
  }, [selectedGroup, selectedMilestone]);

  // All Evaluations table: apply filters and search
  const filteredEvaluations = useMemo(() => {
    const term = (evalSearch || "").trim().toLowerCase();
    return evaluations
      .filter(ev => {
        if (evalMilestoneFilter !== "All" && ev.milestone !== evalMilestoneFilter) return false;
        if (!term) return true;
        const groupName = GROUPS.find(g => g.id === ev.groupId)?.name || ev.groupId;
        return (
          groupName.toLowerCase().includes(term) ||
          ev.milestone.toLowerCase().includes(term) ||
          (ev.timestamp || "").toLowerCase().includes(term)
        );
      })
      .map(ev => ({
        Group: GROUPS.find(g => g.id === ev.groupId)?.name || ev.groupId,
        Milestone: ev.milestone,
        Score: `${ev.totalMarks}/${ev.maxMarks}`,
        "%": `${ev.percentage}%`,
        When: ev.timestamp.split(" ")[0],
        __meta: ev
      }));
  }, [evaluations, evalSearch, evalMilestoneFilter]);

  // CSV export (simple)
  const exportCSV = () => {
    const headers = ["Group", "Milestone", "Total Marks", "Max Marks", "Percentage", "Timestamp"];
    const rows = evaluations
      .filter(ev => ev.supervisor)
      .map(ev => [
        GROUPS.find(g => g.id === ev.groupId)?.name || ev.groupId,
        ev.milestone,
        ev.totalMarks,
        ev.maxMarks,
        ev.percentage + "%",
        ev.timestamp
      ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluations_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // AppTable headers for All Evaluations
  const evalHeaders = ["Group", "Milestone", "Score", "%", "When"];

  return (
    <Box>
      <DashboardSectionHeader
        description={`Here you can provide evaluations & rubrics. Select a group and milestone to fill marks, then submit, and see all evaluations.`}
      >
        Evaluation & Rubrics
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
                style={{ height: '47px'}}
              >
                <MenuItem value=""><em>Choose group</em></MenuItem>
                {GROUPS.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth className="evaluation-form-control" variant="filled" size="small">
              <InputLabel>Select Milestone</InputLabel>
              <Select
                value={selectedMilestone}
                label="Select Milestone"
                onChange={e => setSelectedMilestone(e.target.value)}
                size="small"
                style={{ height: '47px' , width: '250px'}}
              >
                <MenuItem value=""><em>Choose milestone</em></MenuItem>
                {MILESTONES.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
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
              variant="text"
              size="large"
              startIcon={<RestartAlt />}
              onClick={() => { setSelectedGroup(""); setSelectedMilestone(""); setFormError(""); setSubmitted(false); }}
            >
              Reset form
            </Button>
          </Grid>
        </Grid>

        <Divider className="evaluation-divider" />

        {/* Rubric Table */}
        {(selectedGroup && selectedMilestone && !submitted && !alreadyEvaluated) ? (
          <>
            <Typography fontWeight={700} mb={1} className="rubric-title">
              Rubric for {selectedMilestone}
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" className="rubric-table enhanced-table">
                <TableHead>
                  <TableRow>
                    <TableCell className="table-header">Criteria</TableCell>
                    <TableCell className="table-header">Max Marks</TableCell>
                    <TableCell className="table-header">Marks</TableCell>
                    <TableCell className="table-header">Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rubric.map((item, idx) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.maxMarks}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={scores[idx]}
                          inputProps={{ min: 0, max: item.maxMarks, className: "marks-input" }}
                          onChange={e => handleScoreChange(idx, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={feedback[idx]}
                          onChange={e => handleFeedbackChange(idx, e.target.value)}
                          size="small"
                          placeholder="(optional)"
                          inputProps={{ maxLength: 80, className: "feedback-input" }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center" mb={1} mt={2}>
              <Box sx={{ minWidth: 230 }}>
                <Typography fontWeight={700} className="total-marks">
                  Total: {totalMarks}/{maxMarks} &nbsp;
                  <span className="total-percentage">({percentage}%)</span>
                </Typography>
                <Typography fontWeight={600} fontSize={16} className="supervisor-weight">
                  Supervisor's Weight (50%): {weightedPercent}%
                </Typography>
                <Box className="linear-progress-box">
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    className="custom-linear-progress"
                  />
                </Box>
              </Box>

              <Box className="rubric-piechart-wrap">
                <PieChart
                  series={[
                    {
                      data: [
                        { id: 0, value: totalMarks, label: "Score", color: "#2563eb" },
                        { id: 1, value: Math.max(0, maxMarks - totalMarks), label: "Remaining", color: "#e5e7eb" }
                      ],
                      innerRadius: 35,
                      outerRadius: 55,
                      cx: 80,
                      cy: 60
                    }
                  ]}
                  width={180}
                  height={120}
                  slotProps={{ legend: { hidden: false, position: "right" } }}
                />
              </Box>
            </Stack>

            {formError && <Typography color="error" mb={1}>{formError}</Typography>}
            <Button
              variant="contained"
              color="primary"
              size="large"
              className="submit-evaluation-btn"
              onClick={handleSubmit}
            >
              Submit Evaluation
            </Button>
          </>
        ) : (
          <Typography color="#666" fontSize={20} my={3}>
            {submitted || alreadyEvaluated
              ? "Evaluation submitted for this group and milestone."
              : "Select a group and milestone to fill evaluation."}
          </Typography>
        )}

        {(alreadyEvaluated || submitted) && (
          <Stack direction="row" spacing={1} mt={2}>
            {alreadyEvaluated && (
              <Chip
                icon={<CheckCircle />}
                label="Already Evaluated"
                color="success"
                className="evaluated-chip"
              />
            )}
            {submitted && (
              <Chip
                icon={<CheckCircle />}
                label="Evaluation Submitted"
                color="primary"
                className="evaluated-chip"
              />
            )}
          </Stack>
        )}
      </Paper>

      {/* All Evaluations */}
      <Paper className="evaluation-table-paper" sx={{ mt: 3, p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={2} mb={2}>
          <Typography fontWeight={700} className="all-evals-title">All Evaluations Given</Typography>

          <Box sx={{ display: "flex", gap: 2, marginLeft: "auto", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search group / milestone"
              value={evalSearch}
              onChange={e => setEvalSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>
              }}
            />
            <FormControl size="small">
              <Select value={evalMilestoneFilter} onChange={e => setEvalMilestoneFilter(e.target.value)}>
                <MenuItem value="All">All milestones</MenuItem>
                {MILESTONES.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </Select>
            </FormControl>

            <IconButton size="small" onClick={() => { setEvalSearch(""); setEvalMilestoneFilter("All"); }}>
              <RestartAlt />
            </IconButton>
          </Box>
        </Stack>

        <AppTable headers={evalHeaders} rows={filteredEvaluations} />

        <Box mt={2} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography color="#666">Showing {filteredEvaluations.length} of {evaluations.filter(e => e.supervisor).length} evaluations</Typography>
          <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={exportCSV}>Export CSV</Button>
        </Box>
      </Paper>
    </Box>
  );
}
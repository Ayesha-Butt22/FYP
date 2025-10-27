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


const GROUPS = [
  { id: "G-101", name: "Group 1" },
  { id: "G-102", name: "Group 2" },
  { id: "G-103", name: "Group 3" }
];

const Year = [
  { id: "fyp1", name: "FYP-1", weight: 0.2 },
  { id: "fyp2", name: "FYP-2", weight: 0.3 },
];

const RUBRICS = {
  fyp1: [
    { name: "Ayesha", maxMarks: 50 },
    { name: "Sana", maxMarks: 50 },
    { name: "Eman", maxMarks: 50 },
  ],

  fyp2: [
    { name: "Ayesha", maxMarks: 50 },
    { name: "Sana", maxMarks: 50 },
  ],
};

const DUMMY_EVALUATIONS = [
  {
    groupId: "G-101",
    totalMarks: 17,
    name: 'Ayesha',
    fypYear: 'fyp-1',
    maxMarks: 50,
  },
  {
    groupId: "G-101",
    totalMarks: 15,
    maxMarks: 50,
    fypYear: 'fyp-1',
    name: 'Sana',
  },
  {
    groupId: "G-103",
    totalMarks: 18,
    maxMarks: 50,
    name: 'Eman',
    fypYear: 'fyp-2',
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

  const [evalSearch, setEvalSearch] = useState("");
  const [evalMilestoneFilter, setEvalMilestoneFilter] = useState("All");

  useEffect(() => {
    setEvaluations(DUMMY_EVALUATIONS);
  }, []);

  useEffect(() => {
    if (selectedMilestone) {
      setRubric(RUBRICS[selectedMilestone] || []);
      console.log(RUBRICS);
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
        "Group#": GROUPS.find(g => g.id === ev.groupId)?.name || ev.groupId,
        "FYP Year": ev.fypYear,
        "Name": ev.name,
        Score: ev.totalMarks,
        Max: ev.maxMarks,
      }));
  }, [evaluations, evalSearch, evalMilestoneFilter]);


  const exportCSV = () => {
    const headers = ["Group#", "FYP Year", "Name", "Score", "Max"];
    const rows = evaluations
      .filter(ev => ev.supervisor)
      .map(ev => [
        GROUPS.find(g => g.id === ev.groupId)?.name || ev.groupId,
        ev.fypYear,
        ev.name,
        ev.totalMarks,
        ev.maxMarks,
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


  const evalHeaders = ["Group#", "FYP Year", "Name", "Score", "Max"];

  return (
    <Box>
      <DashboardSectionHeader
        description={`Here you can provide evaluations & rubrics. Select a group and names to fill marks, then submit, and see all evaluations.`}
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
              <InputLabel>Select Year</InputLabel>
              <Select
                value={selectedMilestone}
                label="Select Year"
                onChange={e => setSelectedMilestone(e.target.value)}
                size="small"
                style={{ height: '47px' , width: '250px'}}
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
                    <TableCell className="table-header">Name</TableCell>
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
              ? "Evaluation submitted for this group."
              : "Select a group and name to fill evaluation."}
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
      <Paper className="evaluation-table-paper" sx={{ mt: 3, p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={2} mb={2}>
          <label fontWeight={700} className="all-evals-title">All Evaluations Given</label>

          <Box sx={{ display: "flex", gap: 2, marginLeft: "auto", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search group"
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
          <Typography color="#666">Showing {filteredEvaluations.length} of {evaluations.filter(e => e.supervisor).length} evaluations</Typography>
          <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={exportCSV}>Export CSV</Button>
        </Box>
      </Paper>
    </Box>
  );
}
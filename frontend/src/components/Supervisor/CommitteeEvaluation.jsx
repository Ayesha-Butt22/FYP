import React, { useEffect, useMemo, useState } from "react";
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
  Chip,
  Divider,
  Grid,
  InputAdornment,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Collapse,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownload from "@mui/icons-material/FileDownload";
import RestartAlt from "@mui/icons-material/RestartAlt";
import { PieChart } from "@mui/x-charts";
import { CheckCircle, Lock, Person, Group as GroupIcon, Assessment, History } from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx"; // imported at top for all tables
import { toastService } from '../ToastService/ToastService.jsx';


/**
 * CommitteeEvaluation
 * - UI/UX polished version
 * - All table renderings use AppTable
 * - History section shows two separate tables:
 *    1) Per-member evaluations
 *    2) Group-level evaluations
 *
 * All business logic remains unchanged.
 */

/* Example groups with members + supervisor. Replace with backend data later. */
const GROUPS = [
  {
    id: "G-101",
    name: "Group 1",
    supervisor: "Dr. Asad Qureshi",
    members: [
      { id: "s-101", name: "Ali Khan" },
      { id: "s-102", name: "Sara Ahmed" },
      { id: "s-103", name: "Zain Malik" }
    ]
  },
  {
    id: "G-102",
    name: "Group 2",
    supervisor: "Dr. Maria Tariq",
    members: [
      { id: "s-201", name: "Madiha Sumbal" },
      { id: "s-202", name: "Hamza Shah" }
    ]
  },
  {
    id: "G-103",
    name: "Group 3",
    supervisor: "Dr. Farhan Iqbal",
    members: [
      { id: "s-301", name: "Ayesha Butt" },
      { id: "s-302", name: "Bilal Khan" },
      { id: "s-303", name: "Eman Noor" }
    ]
  }
];

const YEARS = [
  { id: "FYP-1", name: "FYP-1" },
  { id: "FYP-2", name: "FYP-2" }
];

const RUBRICS_BY_YEAR = {
  "FYP-1": [
    { name: "Presentation", maxMarks: 20 },
    { name: "Report Quality", maxMarks: 20 },
    { name: "Viva Performance", maxMarks: 10 }
  ],
  "FYP-2": [
    { name: "Final Report", maxMarks: 25 },
    { name: "Poster/Presentation", maxMarks: 15 },
    { name: "System Demo & Viva", maxMarks: 10 }
  ]
};

// demo history for initial display
const DEMO_HISTORY = [
  {
    id: "ce-9001",
    groupId: "G-101",
    groupName: "Group 1",
    year: "FYP-1",
    committeeMember: "Dr. Ayesha Butt",
    mode: "group",
    criteria: [
      { criterion: "Presentation", marks: 16, max: 20 },
      { criterion: "Report Quality", marks: 14, max: 20 },
      { criterion: "Viva Performance", marks: 8, max: 10 }
    ],
    totals: {
      totalMarks: 38,
      maxMarks: 50,
      percentage: 76
    },
    timestamp: "2025-11-01 10:23:00"
  }
];

export default function CommitteeEvaluation() {
  const theme = useTheme();

  // ---- Selection & state ----
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [rubric, setRubric] = useState([]);
  const [evalPerMember, setEvalPerMember] = useState(true); // default true to enforce per-member first
  const [scoresGroup, setScoresGroup] = useState([]);
  const [commentsGroup, setCommentsGroup] = useState([]);
  const [scoresMembers, setScoresMembers] = useState({}); // { memberId: [scores...] }
  const [commentsMembers, setCommentsMembers] = useState({}); // { memberId: [comments...] }
  const [submitting, setSubmitting] = useState(false);
  const [lockedMap, setLockedMap] = useState({}); // "G-101|FYP-1" => true
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [submittedMembers, setSubmittedMembers] = useState({}); // keys: "G-101|FYP-1|s-101" => true

  // init demo history
  useEffect(() => {
    setHistory(DEMO_HISTORY);
    const locks = {};
    DEMO_HISTORY.forEach(h => { locks[`${h.groupId}|${h.year}`] = true; });
    setLockedMap(locks);
  }, []);

  // ---- Rubric loading & arrays init ----
  useEffect(() => {
    const r = RUBRICS_BY_YEAR[selectedYear] || [];
    setRubric(r);
    setScoresGroup(Array(r.length).fill(""));
    setCommentsGroup(Array(r.length).fill(""));

    if (selectedGroupId) {
      const grp = GROUPS.find(g => g.id === selectedGroupId);
      if (grp) {
        const newScoresMembers = {};
        const newCommentsMembers = {};
        grp.members.forEach(m => {
          newScoresMembers[m.id] = Array(r.length).fill("");
          newCommentsMembers[m.id] = Array(r.length).fill("");
        });
        setScoresMembers(newScoresMembers);
        setCommentsMembers(newCommentsMembers);
      } else {
        setScoresMembers({});
        setCommentsMembers({});
      }
    } else {
      setScoresMembers({});
      setCommentsMembers({});
    }
  }, [selectedYear, selectedGroupId]);

  // ---- Derived values ----
  const selectedGroup = useMemo(() => GROUPS.find(g => g.id === selectedGroupId) || null, [selectedGroupId]);

  const totalGroup = useMemo(() => scoresGroup.reduce((s, v) => s + (Number(v) || 0), 0), [scoresGroup]);
  const maxTotalGroup = useMemo(() => rubric.reduce((s, r) => s + (r.maxMarks || 0), 0), [rubric]);
  const percentGroup = maxTotalGroup ? ((totalGroup / maxTotalGroup) * 100).toFixed(1) : 0;

  const totalMembersTotals = useMemo(() => {
    if (!selectedGroup) return { total: 0, maxTotal: 0, percent: 0 };
    let aggTotal = 0;
    let aggMax = 0;
    selectedGroup.members.forEach(m => {
      const arr = scoresMembers[m.id] || [];
      const memberTotal = arr.reduce((s, v) => s + (Number(v) || 0), 0);
      const memberMax = rubric.reduce((s, r) => s + r.maxMarks, 0);
      aggTotal += memberTotal;
      aggMax += memberMax;
    });
    return { total: aggTotal, maxTotal: aggMax, percent: aggMax ? ((aggTotal / aggMax) * 100).toFixed(1) : 0 };
  }, [selectedGroup, scoresMembers, rubric]);

  const alreadyLocked = !!lockedMap[`${selectedGroupId}|${selectedYear}`];

  // ---- Helpers ----
  const getProgressColor = (perc) => {
    // green >= 75, yellow 50-75, red <50
    if (perc >= 75) return theme.palette.success.main;
    if (perc >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  function clampValue(val, max) {
    if (val === "") return "";
    const n = Number(val);
    if (Number.isNaN(n)) return "";
    return Math.max(0, Math.min(n, max));
  }

  // ---- Handlers ----
  function handleGroupScoreChange(idx, val) {
    const v = clampValue(val, rubric[idx].maxMarks);
    setScoresGroup(prev => prev.map((p, i) => (i === idx ? v : p)));
  }
  function handleGroupCommentChange(idx, val) {
    setCommentsGroup(prev => prev.map((p, i) => (i === idx ? val : p)));
  }

  function handleMemberScoreChange(memberId, idx, val) {
    const v = clampValue(val, rubric[idx].maxMarks);
    setScoresMembers(prev => ({ ...prev, [memberId]: prev[memberId].map((p, i) => (i === idx ? v : p)) }));
  }
  function handleMemberCommentChange(memberId, idx, val) {
    setCommentsMembers(prev => ({ ...prev, [memberId]: prev[memberId].map((p, i) => (i === idx ? val : p)) }));
  }

  function resetForm() {
    setSelectedGroupId("");
    setSelectedYear("");
    setEvalPerMember(true);
    setRubric([]);
    setScoresGroup([]);
    setCommentsGroup([]);
    setScoresMembers({});
    setCommentsMembers({});
    setSubmitting(false);
  }

  function allMembersSubmittedForGroupYear(groupId, year) {
    const grp = GROUPS.find(g => g.id === groupId);
    if (!grp) return false;
    return grp.members.every(m => !!submittedMembers[`${groupId}|${year}|${m.id}`]);
  }

  // ---- Member submit ----
  async function handleSubmitMember(memberId) {
    if (!selectedGroupId || !selectedYear) {
      toastService.error("Select group and year before submitting member evaluation.");
      return;
    }
    if (alreadyLocked) {
      toastService.error("This group & year is locked. Cannot submit member evaluation.");
      return;
    }
    const arr = scoresMembers[memberId] || [];
    if (rubric.some((r, i) => arr[i] === "" || isNaN(Number(arr[i])) || Number(arr[i]) < 0 || Number(arr[i]) > r.maxMarks)) {
      toastService.error("Enter valid marks for all criteria for this member.");
      return;
    }

    setSubmitting(true);
    try {
      const committeeMember = localStorage.getItem("name") || localStorage.getItem("email") || "Committee Member";
      const memberTotal = arr.reduce((s, v) => s + (Number(v) || 0), 0);
      const memberMax = rubric.reduce((s, r) => s + r.maxMarks, 0);
      const record = {
        id: "ce-" + Math.floor(Math.random() * 1000000),
        groupId: selectedGroupId,
        groupName: selectedGroup?.name || "",
        year: selectedYear,
        mode: "per-member",
        member: {
          memberId,
          memberName: (selectedGroup?.members.find(m => m.id === memberId) || {}).name || ""
        },
        criteria: rubric.map((r, i) => ({ criterion: r.name, marks: Number(arr[i]), max: r.maxMarks, comment: (commentsMembers[memberId] || [])[i] || "" })),
        totals: { totalMarks: memberTotal, maxMarks: memberMax, percentage: memberMax ? ((memberTotal / memberMax) * 100).toFixed(1) : 0 },
        supervisedBy: selectedGroup?.supervisor || "",
        committeeMember,
        timestamp: new Date().toISOString()
      };

      // simulate server delay (keep logic)
      await new Promise(r => setTimeout(r, 400));

      setHistory(prev => [record, ...prev]);
      setSubmittedMembers(prev => ({ ...prev, [`${selectedGroupId}|${selectedYear}|${memberId}`]: true }));
      toastService.success(`Submitted evaluation for ${record.member.memberName}.`);
    } catch (err) {
      console.error(err);
      toastService.error("Member submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Group submit ----
  async function handleSubmitGroup() {
    if (!selectedGroupId || !selectedYear) {
      toastService.error("Please select group and year (FYP-1 / FYP-2).");
      return;
    }
    if (alreadyLocked) {
      toastService.error("This group & year evaluation is locked (already submitted).");
      return;
    }
    // enforce: members must be evaluated first
    if (!allMembersSubmittedForGroupYear(selectedGroupId, selectedYear)) {
      toastService.error("Please evaluate all group members first before submitting the group-level evaluation.");
      return;
    }

    if (rubric.some((r, i) => scoresGroup[i] === "" || isNaN(Number(scoresGroup[i])) || Number(scoresGroup[i]) < 0 || Number(scoresGroup[i]) > r.maxMarks)) {
      toastService.error("Enter valid marks for all criteria (group-level).");
      return;
    }

    setSubmitting(true);
    try {
      const committeeMember = localStorage.getItem("name") || localStorage.getItem("email") || "Committee Member";
      const payload = {
        id: "ce-" + Math.floor(Math.random() * 1000000),
        groupId: selectedGroupId,
        groupName: selectedGroup?.name || "",
        year: selectedYear,
        mode: "group",
        criteria: rubric.map((r, i) => ({ criterion: r.name, marks: Number(scoresGroup[i]), max: r.maxMarks, comment: commentsGroup[i] || "" })),
        totals: { totalMarks: totalGroup, maxMarks: maxTotalGroup, percentage: Number(percentGroup) },
        supervisedBy: selectedGroup?.supervisor || "",
        committeeMember,
        timestamp: new Date().toISOString()
      };

      // simulate server delay
      await new Promise(r => setTimeout(r, 600));

      setHistory(prev => [payload, ...prev]);
      setLockedMap(prev => ({ ...prev, [`${selectedGroupId}|${selectedYear}`]: true }));
      toastService.success("Group-level evaluation submitted and locked.");
      // reset form
      setSelectedGroupId("");
      setSelectedYear("");
      setEvalPerMember(true);
      setRubric([]);
      setScoresGroup([]);
      setCommentsGroup([]);
      setScoresMembers({});
      setCommentsMembers({});
    } catch (err) {
      console.error(err);
      toastService.error("Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- CSV Export ----
  function exportCSV(all = false) {
    const rows = (all ? history : history.filter(h => h.committeeMember === (localStorage.getItem("name") || localStorage.getItem("email"))))
      .flatMap(h => {
        if (h.mode === "group") {
          return [{
            group: h.groupId,
            groupName: h.groupName || "",
            year: h.year,
            mode: h.mode,
            committeeMember: h.committeeMember,
            criterion: h.criteria.map(c => c.criterion).join("; "),
            score: h.criteria.map(c => c.marks).join("; "),
            max: h.criteria.map(c => c.max).join("; "),
            comment: h.criteria.map(c => c.comment || "").join("; "),
            total: h.totals.totalMarks,
            maxTotal: h.totals.maxMarks,
            percent: h.totals.percentage,
            timestamp: h.timestamp
          }];
        } else {
          return [{
            group: h.groupId,
            groupName: h.groupName || "",
            year: h.year,
            mode: h.mode,
            committeeMember: h.committeeMember,
            memberId: h.member?.memberId || "",
            memberName: h.member?.memberName || "",
            criterion: h.criteria.map(c => c.criterion).join("; "),
            score: h.criteria.map(c => c.marks).join("; "),
            max: h.criteria.map(c => c.max).join("; "),
            comment: h.criteria.map(c => c.comment || "").join("; "),
            total: h.totals.totalMarks,
            maxTotal: h.totals.maxMarks,
            percent: h.totals.percentage,
            timestamp: h.timestamp
          }];
        }
      });

    if (!rows.length) {
      toastService.info("No evaluations to export.");
      return;
    }

    const keys = Object.keys(rows[0]);
    const headers = keys;
    const csv = [headers, ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`))].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `committee_evaluations_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---- History table rows for AppTable (split into per-member and group) ----
  const perMemberTableRows = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return history
      .filter(h => h.mode === "per-member")
      .filter(h => filterYear === "All" ? true : h.year === filterYear)
      .filter(h => {
        if (!term) return true;
        const groupName = GROUPS.find(g => g.id === h.groupId)?.name || h.groupId;
        return groupName.toLowerCase().includes(term) ||
          (h.year || "").toLowerCase().includes(term) ||
          (h.committeeMember || "").toLowerCase().includes(term) ||
          (h.member?.memberName || "").toLowerCase().includes(term) ||
          (h.timestamp || "").toLowerCase().includes(term);
      })
      .map(h => ({
        "Group#": GROUPS.find(g => g.id === h.groupId)?.name || h.groupId,
        "Year": h.year,
        "Member": h.member?.memberName || "-",
        "Committee Member": h.committeeMember,
        "Total": h.totals?.totalMarks ?? 0,
        "Max": h.totals?.maxMarks ?? 0,
        "Percent": (h.totals?.percentage ?? 0) + "%",
        "Time": h.timestamp
      }));
  }, [history, searchTerm, filterYear]);

  const groupTableRows = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return history
      .filter(h => h.mode === "group")
      .filter(h => filterYear === "All" ? true : h.year === filterYear)
      .filter(h => {
        if (!term) return true;
        const groupName = GROUPS.find(g => g.id === h.groupId)?.name || h.groupId;
        return groupName.toLowerCase().includes(term) ||
          (h.year || "").toLowerCase().includes(term) ||
          (h.committeeMember || "").toLowerCase().includes(term) ||
          (h.timestamp || "").toLowerCase().includes(term);
      })
      .map(h => ({
        "Group#": GROUPS.find(g => g.id === h.groupId)?.name || h.groupId,
        "Year": h.year,
        "Committee Member": h.committeeMember,
        "Total": h.totals?.totalMarks ?? 0,
        "Max": h.totals?.maxMarks ?? 0,
        "Percent": (h.totals?.percentage ?? 0) + "%",
        "Time": h.timestamp
      }));
  }, [history, searchTerm, filterYear]);

  // ---- Build AppTable rows for member and group rubrics ----
  const buildMemberRows = (memberId) => {
    return rubric.map((r, idx) => ({
      "Criterion": r.name,
      "Max Marks": r.maxMarks,
      "Marks": (
        <TextField
          type="number"
          size="small"
          value={(scoresMembers[memberId] || [])[idx] ?? ""}
          inputProps={{ min: 0, max: r.maxMarks, 'aria-label': `marks-${memberId}-${r.name}` }}
          onChange={e => handleMemberScoreChange(memberId, idx, e.target.value)}
          disabled={!!submittedMembers[`${selectedGroupId}|${selectedYear}|${memberId}`] || alreadyLocked}
          sx={{ width: 120 }}
        />
      ),
      "Comments": (
        <TextField
          size="small"
          value={(commentsMembers[memberId] || [])[idx] ?? ""}
          onChange={e => handleMemberCommentChange(memberId, idx, e.target.value)}
          disabled={!!submittedMembers[`${selectedGroupId}|${selectedYear}|${memberId}`] || alreadyLocked}
          sx={{ width: { xs: '100%', md: 360 } }}
          inputProps={{ 'aria-label': `comment-${memberId}-${r.name}` }}
        />
      )
    }));
  };

  const buildGroupRows = () => {
    return rubric.map((r, idx) => ({
      "Criterion": r.name,
      "Max Marks": r.maxMarks,
      "Marks": (
        <TextField
          type="number"
          size="small"
          value={scoresGroup[idx] ?? ""}
          inputProps={{ min: 0, max: r.maxMarks, 'aria-label': `group-marks-${r.name}` }}
          onChange={e => handleGroupScoreChange(idx, e.target.value)}
          disabled={alreadyLocked || !allMembersSubmittedForGroupYear(selectedGroupId, selectedYear)}
          sx={{ width: 120 }}
        />
      ),
      "Comments": (
        <TextField
          size="small"
          value={commentsGroup[idx] ?? ""}
          onChange={e => handleGroupCommentChange(idx, e.target.value)}
          disabled={alreadyLocked || !allMembersSubmittedForGroupYear(selectedGroupId, selectedYear)}
          sx={{ width: { xs: '100%', md: 360 } }}
          inputProps={{ 'aria-label': `group-comment-${r.name}` }}
        />
      )
    }));
  };

  // ---- Render ----
  return (
    <Box>
      <DashboardSectionHeader description="Committee members evaluate groups (FYP-1 / FYP-2). Evaluate individual students first, then submit group-level evaluation.">
        Committee Evaluation
      </DashboardSectionHeader>

      {/* ---- Group Selection ---- */}
      <Paper className="evaluation-form-paper elevated-card" sx={{ mb: 3, p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5} md={4}>
            <FormControl fullWidth variant="filled" size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="select-group-label">Select Group</InputLabel>
              <Select
                labelId="select-group-label"
                aria-label="Select project group"
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
                size="small"
                sx={{ height: 48 }}
              >
                <MenuItem value=""><em>Choose group</em></MenuItem>
                {GROUPS.map(g => <MenuItem key={g.id} value={g.id}>{g.name} ({g.id})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth variant="filled" size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="select-year-label">Select Year</InputLabel>
              <Select
                labelId="select-year-label"
                aria-label="Select FYP year"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                size="small"
                sx={{ height: 48 }}
              >
                <MenuItem value=""><em>Choose year</em></MenuItem>
                {YEARS.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={3} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel
              control={<Switch checked={evalPerMember} onChange={e => setEvalPerMember(e.target.checked)} inputProps={{ 'aria-label': 'Toggle evaluate per member' }} />}
              label="Evaluate per member"
            />
            <Tooltip title="Evaluate each student first (recommended)" arrow>
              <IconButton aria-label="help-eval-mode" size="small">
                <Person fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={12} md={2} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                size="large"
                startIcon={<FileDownload />}
                onClick={() => exportCSV(false)}
                sx={{ px: 2, '&:hover': { transform: 'translateY(-2px)' } }}
                aria-label="Export my CSV"
              >
                Export My CSV
              </Button>
              <Button
                variant="text"
                size="large"
                startIcon={<RestartAlt />}
                onClick={resetForm}
                sx={{ px: 2 }}
                aria-label="Reset form"
              >
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* ---- Group Info ---- */}
        {selectedGroup ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Group Info
            </Typography>

            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography>Group ID: <strong>{selectedGroup.id}</strong></Typography>
                <Typography>Supervisor: <strong>{selectedGroup.supervisor}</strong></Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <Typography>Members:</Typography>
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedGroup.members.map(m => (
                      <Chip
                        key={m.id}
                        label={`${m.name} (${m.id})`}
                        avatar={<Box component="span" sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700 }}>{m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</Box>}
                        sx={{
                          fontWeight: 600,
                          bgcolor: submittedMembers[`${selectedGroupId}|${selectedYear}|${m.id}`] ? theme.palette.action.selected : undefined,
                          border: submittedMembers[`${selectedGroupId}|${selectedYear}|${m.id}`] ? `1px solid ${theme.palette.success.main}` : undefined
                        }}
                        aria-label={`Member ${m.name}`}
                      />
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              <History sx={{ fontSize: 34, opacity: 0.25, display: 'block', mx: 'auto' }} />
            </Typography>
            <Typography color="text.secondary">Select a group and year to begin the evaluation.</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ---- Member Evaluation Table (replaced with AppTable) ---- */}
        <Box>
          
           <label style={{ fontWeight: 700 }}>Member Evaluation</label>
          

          <Collapse in={evalPerMember} timeout={300}>
            {selectedGroup && rubric.length ? (
              <Box>
                {selectedGroup.members.map((m) => {
                  const memberKey = `${selectedGroupId}|${selectedYear}|${m.id}`;
                  const isMemberSubmitted = !!submittedMembers[memberKey];

                  const memberHeaders = ["Criterion", "Max Marks", "Marks", "Comments"];
                  const memberRows = buildMemberRows(m.id);

                  return (
                    <Card key={m.id} variant="outlined" sx={{ mb: 2, transition: 'box-shadow 200ms', '&:hover': { boxShadow: 6 } }}>
                      <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>{m.name} <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>({m.id})</Typography></Typography>
                            <Typography variant="body2" color="text.secondary">Supervisor: {selectedGroup.supervisor}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title={isMemberSubmitted ? "Already submitted" : "Submit individual evaluation"} arrow>
                              <span>
                                <Button
                                  variant={isMemberSubmitted ? "contained" : "outlined"}
                                  color={isMemberSubmitted ? "success" : "primary"}
                                  onClick={() => handleSubmitMember(m.id)}
                                  disabled={isMemberSubmitted || submitting || alreadyLocked || !selectedYear || !selectedGroupId}
                                  aria-label={`Submit evaluation for ${m.name}`}
                                >
                                  {isMemberSubmitted ? "Submitted" : "Submit Member"}
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <Box sx={{ mt: 2 }}>
                          <AppTable headers={memberHeaders} rows={memberRows} />
                          <Box sx={{ mt: 1 }}>
                            <Typography fontWeight={600}>
                              Member total: {(scoresMembers[m.id] || []).reduce((s, v) => s + (Number(v) || 0), 0)} / {rubric.reduce((s, r) => s + r.maxMarks, 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} /> Aggregated Total (members)
                  </Typography>
                  <Typography fontWeight={700} sx={{ color: getProgressColor(Number(totalMembersTotals.percent)) }}>
                    {totalMembersTotals.total}/{totalMembersTotals.maxTotal} &nbsp;
                    <small style={{ color: theme.palette.text.secondary }}>({totalMembersTotals.percent}%)</small>
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">Select a group and year to evaluate members.</Typography>
              </Box>
            )}
          </Collapse>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* ---- Group Evaluation Section (replaced with AppTable) ---- */}
        <Box>
          
           <label style={{ fontWeight: 700 }}>Group Evaluation</label>
          

          <Collapse in={!evalPerMember} timeout={300}>
            {selectedGroup && rubric.length ? (
              <>
                <AppTable headers={["Criterion", "Max Marks", "Marks", "Comments"]} rows={buildGroupRows()} />

                {/* ---- Evaluation Summary ---- */}
                <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Assessment sx={{ mr: 1 }} /> <strong>Summary</strong>
                    </Typography>
                    <Typography fontWeight={700} sx={{ color: getProgressColor(Number(percentGroup)), fontSize: 18 }}>
                      Total: {totalGroup}/{maxTotalGroup} &nbsp;
                      <span style={{ color: theme.palette.text.secondary, fontWeight: 600 }}>({percentGroup}%)</span>
                    </Typography>

                    <Box sx={{ mt: 1, width: { xs: '100%', md: 420 } }}>
                      <LinearProgress
                        variant="determinate"
                        value={Number(percentGroup)}
                        sx={{
                          height: 14,
                          borderRadius: 2,
                          '& .MuiLinearProgress-bar': { background: getProgressColor(Number(percentGroup)) }
                        }}
                        aria-label="Group percentage progress"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box>
                      <PieChart
                        series={[{
                          data: [
                            { id: 0, value: totalGroup, label: "Score", color: "#2563eb" },
                            { id: 1, value: Math.max(0, maxTotalGroup - totalGroup), label: "Remaining", color: "#e5e7eb" }
                          ],
                          innerRadius: 30,
                          outerRadius: 55,
                          cx: 80,
                          cy: 60
                        }]}
                        width={160}
                        height={120}
                      />
                    </Box>
                    <Stack spacing={1}>
                      <Tooltip title={alreadyLocked ? "This group-year is locked" : (allMembersSubmittedForGroupYear(selectedGroupId, selectedYear) ? "All members evaluated" : "Members pending")} arrow>
                        <Chip
                          icon={alreadyLocked ? <Lock /> : <CheckCircle />}
                          label={alreadyLocked ? "Locked" : (allMembersSubmittedForGroupYear(selectedGroupId, selectedYear) ? "All members evaluated" : "Members pending")}
                          color={alreadyLocked ? "default" : allMembersSubmittedForGroupYear(selectedGroupId, selectedYear) ? "success" : "warning"}
                        />
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary">Switch to group evaluation after evaluating each member.</Typography>
              </Box>
            )}
          </Collapse>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmitGroup}
            disabled={
              submitting ||
              alreadyLocked ||
              !selectedGroupId ||
              !selectedYear ||
              !allMembersSubmittedForGroupYear(selectedGroupId, selectedYear)
            }
            aria-disabled={submitting || alreadyLocked}
            aria-label="Submit group evaluation"
          >
            {alreadyLocked ? "Locked" : (submitting ? "Submitting..." : "Submit Group Evaluation")}
          </Button>

          <Button variant="outlined" onClick={() => exportCSV(true)} aria-label="Export all CSV">Export All CSV</Button>
        </Stack>
      </Paper>

      {/* ---- History: two separate AppTables ---- */}
      <Paper className="evaluation-table-paper" sx={{ mt: 3, p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={2} mb={2}>
         
         <label>History</label>
        

          <Box sx={{ display: "flex", gap: 2, marginLeft: "auto", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search group, year, member or committee"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment> }}
              aria-label="Search evaluations"
            />
            <FormControl size="small" variant="filled">
              <Select value={filterYear} onChange={e => setFilterYear(e.target.value)} sx={{ minWidth: 140 }} aria-label="Filter by year">
                <MenuItem value="All">All Years</MenuItem>
                {YEARS.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <label>
          Per-member Evaluations
          </label>
          <AppTable
            headers={["Group#", "Year", "Member", "Committee Member", "Total", "Max", "Percent", "Time"]}
            rows={perMemberTableRows}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={() => exportCSV(true)}>Export Per-member CSV</Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <label>
          Group-level Evaluations
          </label>
          <AppTable
            headers={["Group#", "Year", "Committee Member", "Total", "Max", "Percent", "Time"]}
            rows={groupTableRows}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={() => exportCSV(true)}>Export Group CSV</Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// table headers used by AppTable
const tableHeaders = ["Group#", "Year", "Mode", "Committee Member", "Member", "Total", "Max", "Percent", "Time"];
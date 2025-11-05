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
import CloseIcon from "@mui/icons-material/Close";
import { PieChart } from "@mui/x-charts";
import { CheckCircle, Lock, Person, Group as GroupIcon, Assessment, History } from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from '../ToastService/ToastService.jsx';
import EvaluationService from "../Api/EvaluationService"; // <-- new

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
  const [evalPerMember, setEvalPerMember] = useState(true);
  const [scoresGroup, setScoresGroup] = useState([]);
  const [commentsGroup, setCommentsGroup] = useState([]);
  const [scoresMembers, setScoresMembers] = useState({});
  const [commentsMembers, setCommentsMembers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [lockedMap, setLockedMap] = useState({});
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [submittedMembers, setSubmittedMembers] = useState({});

  // New: faculty status (result from checkFaculty API)
  const [facultyStatus, setFacultyStatus] = useState(null);
  const [showFacultyBanner, setShowFacultyBanner] = useState(true);

  // NEW: booked groups map: { [scheduleId]: [ groupObjects... ] }
  const [bookedGroupsMap, setBookedGroupsMap] = useState({});

  // init demo history
  useEffect(() => {
    setHistory(DEMO_HISTORY);
    const locks = {};
    DEMO_HISTORY.forEach(h => { locks[`${h.groupId}|${h.year}`] = true; });
    setLockedMap(locks);
  }, []);

  // ---- Faculty status check (runs once on mount) ----
  useEffect(() => {
    const fetchFacultyStatus = async () => {
      const email = localStorage.getItem('email');
      if (!email) return;
      try {
        const response = await fetch("http://localhost:5000/api/evaluation/checkFaculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        setFacultyStatus(data);
      } catch (error) {
        console.error("Error fetching faculty status:", error);
      }
    };

    fetchFacultyStatus();
  }, []);

  // Helper to normalize schedules array from various API shapes
  const facultySchedules = useMemo(() => {
    if (!facultyStatus) return [];
    if (facultyStatus.data && Array.isArray(facultyStatus.data)) return facultyStatus.data;
    if (Array.isArray(facultyStatus)) return facultyStatus;
    if (facultyStatus.scheduleId || facultyStatus._id) return [facultyStatus];
    return [];
  }, [facultyStatus]);

  // NEW: when facultySchedules become available, fetch booked groups for each schedule
  useEffect(() => {
    if (!facultySchedules || !facultySchedules.length) return;

    let mounted = true;

    (async () => {
      const map = {};
      for (const sched of facultySchedules) {
        const schedId = sched._id || sched.scheduleId;
        if (!schedId) continue;
        try {
          const resp = await EvaluationService.getBookedGroups({ scheduleId: schedId });
          if (resp?.success && Array.isArray(resp.data)) {
            map[schedId] = resp.data; // array of groups
          } else {
            map[schedId] = [];
          }
        } catch (err) {
          console.error("Error fetching booked groups for schedule", schedId, err);
          map[schedId] = [];
        }
      }
      if (mounted) setBookedGroupsMap(prev => ({ ...prev, ...map }));
    })();

    return () => { mounted = false; };
  }, [facultySchedules]);

  const fmtDateTime = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

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

  // ---- Handlers & submit functions (unchanged) ----
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

  async function handleSubmitGroup() {
    if (!selectedGroupId || !selectedYear) {
      toastService.error("Please select group and year (FYP-1 / FYP-2).");
      return;
    }
    if (alreadyLocked) {
      toastService.error("This group & year evaluation is locked (already submitted).");
      return;
    }
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

      await new Promise(r => setTimeout(r, 600));

      setHistory(prev => [payload, ...prev]);
      setLockedMap(prev => ({ ...prev, [`${selectedGroupId}|${selectedYear}`]: true }));
      toastService.success("Group-level evaluation submitted and locked.");
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

  // ---- CSV Export & History / Tables (unchanged code) ----
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
        {/* Faculty banner (above Select Group) */}
        {showFacultyBanner && facultySchedules.length > 0 && (
          <Box sx={{
            mb: 2,
            p: 2,
            borderRadius: 1,
            background: "linear-gradient(90deg,#ecf6ff,#f7fbff)",
            border: `1px solid ${theme.palette.primary.light}`,
            position: "relative"
          }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800} color="primary">You have been listed as a panel member</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  The following presentation schedule{facultySchedules.length > 1 ? "s" : ""} include you as a panel member:
                </Typography>

                {facultySchedules.map((sched) => {
                  const schedId = sched._id || sched.scheduleId;
                  return (
                    <Box key={schedId} sx={{ mt: 1, pl: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {sched.week ? `Week: ${sched.week}` : "Week: TBD"} — Venue: {sched.venue || "TBD"}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Dates: {Array.from(new Set((sched.slots || []).map(s => {
                          try { return new Date(s.startTime).toLocaleDateString(); } catch { return s.startTime?.slice(0,10) || ""; }
                        }))).join(", ") || "TBD"}
                      </Typography>

                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Slots:</Typography>
                        <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                          {(sched.slots || []).map((s) => (
                            <li key={s._id || `${s.startTime}-${s.endTime}`} style={{ marginBottom: 4 }}>
                              <small style={{ color: "#1f2937" }}>
                                {fmtDateTime(s.startTime)} — {fmtDateTime(s.endTime)}
                                {s.bookedBy ? ` (Booked)` : " (Available)"}
                              </small>
                            </li>
                          ))}
                        </ul>
                      </Box>

                      {/* NEW: Booked groups for this schedule (if any) */}
                      {(bookedGroupsMap[schedId] && bookedGroupsMap[schedId].length > 0) && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Booked Groups:</Typography>
                          {bookedGroupsMap[schedId].map(g => (
                            <Box key={g.groupMongoId} sx={{ mt: 0.5, pl: 1 }}>
                              <Typography variant="body2"><strong>{g.groupId}</strong> — {g.proposalTitle || "No title"}</Typography>
                              <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {g.members.map(m => (
                                  <li key={`${g.groupId}-${m.email || m.studentId || m.userId}`} style={{ marginBottom: 2 }}>
                                    <small>{m.name || "(name missing)"} — {m.email || "(email missing)"} — {m.studentId || "(sap missing)"}</small>
                                  </li>
                                ))}
                              </ul>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ alignSelf: "flex-start" }}>
                <IconButton size="small" onClick={() => setShowFacultyBanner(false)} aria-label="Dismiss schedule banner">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Stack>
          </Box>
        )}

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

        {/* rest of component unchanged... (member evaluation UI, group evaluation UI, history tables) */}
        {/* ... (omitted for brevity) */}
      </Paper>

      {/* ---- History / tables unchanged (omitted for brevity) ---- */}
    </Box>
  );
}

// table headers used by AppTable
const tableHeaders = ["Group#", "Year", "Mode", "Committee Member", "Member", "Total", "Max", "Percent", "Time"];
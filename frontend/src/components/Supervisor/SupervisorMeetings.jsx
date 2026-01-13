// SupervisorMeetings.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { AddCircleOutline, EventAvailable, EventBusy, CheckCircleOutline, Group as GroupIcon, AccessTime } from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable.jsx";  // <--- custom table
import "./SupervisorMeetings.css";

/* ================= CONFIG ================= */
const API = "http://localhost:5000/api/meetings";
const SUPERVISOR_EMAIL = localStorage.getItem("email");

/* ================= HELPERS ================= */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

/* ================= COMPONENT ================= */
export default function SupervisorMeetings() {
  const [slots, setSlots] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [meetingHistory, setMeetingHistory] = useState([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [formError, setFormError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* ================= LOAD DATA FROM API ================= */
  const loadMeetings = async () => {
    try {
      const res = await fetch(`${API}/supervisor/${SUPERVISOR_EMAIL}`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.futureSlots || []);
        setTodayMeetings(data.todayMeetings || []);
        setMeetingHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch supervisor meetings", err);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  /* ================= ADD SLOT ================= */
  const handleAddSlot = async () => {
    if (!date || !time || !duration) {
      setFormError("All fields required");
      return;
    }
    await fetch(`${API}/create-slot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supervisorEmail: SUPERVISOR_EMAIL, date, time, duration }),
    });
    setDate("");
    setTime("");
    setDuration(30);
    setFormError("");
    setOpenDialog(false);
    loadMeetings();
  };

  /* ================= MARK DONE ================= */
  const handleMarkDone = async (slotId) => {
    await fetch(`${API}/mark-done`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    loadMeetings();
  };

  /* ================= UI HELPERS ================= */
  const statusChip = (bookedBy) =>
    bookedBy
      ? <Chip label={`Booked by ${bookedBy}`} color="success" icon={<GroupIcon />} size="small" />
      : <Chip label="Available" color="warning" icon={<AccessTime />} size="small" variant="outlined" />;

  /* ================= RENDER ================= */
  return (
    <>
      <DashboardSectionHeader description="Manage your meetings">Meetings</DashboardSectionHeader>

      <Box width="100%">
        <Button
          variant="contained"
          startIcon={<AddCircleOutline />}
          className="supermeeting-add-slot-btn"
          onClick={() => setOpenDialog(true)}
        >
          Add Available Slot
        </Button>

        {/* ADD SLOT DIALOG */}
        <Dialog open={openDialog} TransitionComponent={Transition} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add New Meeting Slot</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              {formError && <Typography color="error">{formError}</Typography>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddSlot}>Add Slot</Button>
          </DialogActions>
        </Dialog>

        {/* ALL SLOTS */}
        <Paper className="supermeeting-slots-paper" sx={{ mt: 3 }}>
          <Typography className="supermeeting-section-title"><EventBusy /> All Slots</Typography>
          <AppTable
            headers={["Date", "Time", "Duration", "Status"]}
            rows={slots.map(s => [formatDate(s.date), formatTime(s.time), `${s.duration} min`, statusChip(s.bookedBy)])}
          />
        </Paper>

        {/* UPCOMING MEETINGS */}
        <Paper className="supermeeting-slots-paper" sx={{ mt: 3 }}>
          <Typography className="supermeeting-section-title upcoming"><EventAvailable /> Upcoming Meetings</Typography>
          <AppTable
            headers={["Date", "Time", "Student", "Action"]}
            rows={todayMeetings.map(m => [
              formatDate(m.date),
              formatTime(m.time),
              m.bookedBy,
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutline />}
                onClick={() => handleMarkDone(m._id)}
              >
                Mark Done
              </Button>
            ])}
          />
        </Paper>

        {/* MEETING HISTORY      color: #01337a*/}
       
        <Paper className="supermeeting-slots-paper">
           <Typography  className="supermeeting-section-title upcoming"><EventAvailable />Meeting History</Typography>
          <AppTable
            headers={["Date", "Time", "Student", "Done At"]}
            rows={meetingHistory.map(h => [
              formatDate(h.date),
              formatTime(h.time),
              h.bookedBy,
              h.doneAt ? new Date(h.doneAt).toLocaleString() : "-"
            ])}
          />
        </Paper>
      </Box>
    </>
  );
}

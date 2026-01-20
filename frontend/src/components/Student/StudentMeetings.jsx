// StudentMeetings.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Supervisor/AppTable"; 
import "./StudentMeetings.css";
import { toastService } from "../ToastService/ToastService.jsx";

/* ================= CONFIG ================= */
const API_BASE = "http://localhost:5000/api/meetings";

/* ================= HELPERS ================= */
const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTime = (t) => {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ================= COMPONENT ================= */
export default function StudentMeetings() {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myMeetings, setMyMeetings] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const email = localStorage.getItem("email");

  /* ================= LOAD DATA ================= */
  const loadAvailableSlots = async () => {
    try {
      const res = await fetch(`${API_BASE}/available/${email}`);
      const data = await res.json();
      if (data.success) setAvailableSlots(data.slots);
    } catch (err) {
      console.error("Failed to load available slots", err);
      toastService.error("Failed to load available slots");
    }
  };

  const loadMyMeetings = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/${email}`);
      const data = await res.json();
      if (data.success) setMyMeetings(data.meetings);
    } catch (err) {
      console.error("Failed to load my meetings", err);
      toastService.error("Failed to load your meetings");
    }
  };

  useEffect(() => {
    loadAvailableSlots();
    loadMyMeetings();
  }, []);

  /* ================= BOOK SLOT ================= */
  const confirmBooking = async () => {
    if (!selectedSlot) return;

    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot._id,
          studentEmail: email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toastService.success("Meeting booked successfully!");
        setOpenConfirm(false);
        setSelectedSlot(null);
        loadAvailableSlots();
        loadMyMeetings();
      } else {
        toastService.error(data.message || "Failed to book meeting");
      }
    } catch (err) {
      console.error("Booking failed", err);
      toastService.error("Something went wrong while booking");
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <DashboardSectionHeader description="Book and view your supervisor meetings">
        Student Meetings
      </DashboardSectionHeader>

      {/* ================= AVAILABLE SLOTS ================= */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography className="supermeeting-section-title">
          Available Slots
        </Typography>

        <AppTable
          headers={["Date", "Time", "Duration", "Action"]}
          rows={availableSlots.map((s) => [
            formatDate(s.date),
            formatTime(s.time),
            `${s.duration} min`,
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setSelectedSlot(s);
                setOpenConfirm(true);
              }}
            >
              Book
            </Button>,
          ])}
        />
      </Paper>

      {/* ================= MY MEETINGS ================= */}
      <Paper sx={{ p: 2 }}>
        <Typography className="supermeeting-section-title">
          My Meetings
        </Typography>

        <AppTable
          headers={["Date", "Time", "Status"]}
          rows={myMeetings.map((m) => [
            formatDate(m.date),
            formatTime(m.time),
            m.status === 1 ? "Upcoming" : "Completed",
          ])}
        />
      </Paper>

      {/* ================= CONFIRM DIALOG ================= */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <>
              <Typography>Date: {formatDate(selectedSlot.date)}</Typography>
              <Typography>Time: {formatTime(selectedSlot.time)}</Typography>
              <Typography>Duration: {selectedSlot.duration} min</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmBooking}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Modal,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import "./StudentMeetings.css";


const STORAGE_KEY = "student_meetings_v1";


const DEMO_SUPERVISORS = [
  {
    id: "sup-1",
    name: "Dr Rimsha",
    color: "#f59e0b",
    slots: [
      { date: "2025-11-01", time: "10:00 AM" },
      { date: "2025-11-01", time: "02:00 PM" },
    ],
  },
  {
    id: "sup-2",
    name: "Dr Bilal",
    color: "#10b981",
    slots: [
      { date: "2025-11-02", time: "11:00 AM" },
      { date: "2025-11-03", time: "09:30 AM" },
    ],
  },
  {
    id: "sup-3",
    name: "Dr Ayesha",
    color: "#3b82f6",
    slots: [
   
      { date: "2025-10-13", time: "09:00 AM" },
      { date: "2025-10-13", time: "11:30 AM" },
      { date: "2025-10-14", time: "02:00 PM" },
      { date: "2025-11-04", time: "03:00 PM" },
      { date: "2025-11-05", time: "01:00 PM" },
    ],
  },
];


function readMeetingsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeMeetingsToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function callToast(message, type = "success") {
  try {
    if (toastService) {
      if (type === "success" && typeof toastService.success === "function") {
        toastService.success(message);
        return;
      }
      if (type === "error" && typeof toastService.error === "function") {
        toastService.error(message);
        return;
      }
      if (typeof toastService.show === "function") {
        toastService.show(message, { type });
        return;
      }
      if (typeof toastService === "function") {
        toastService(message);
        return;
      }
    }
  } catch (e) {
    
    console.warn("toastService call failed", e);
  }
  
  alert(message);
}


async function confirmPrompt(message) {
  try {
    if (typeof Confirm === "function") {
      const result = Confirm(message);
      if (result && typeof result.then === "function") {
        return await result;
      }
      return !!result;
    }
  } catch (e) {

    console.warn("Confirm service error, falling back to window.confirm", e);
  }
  return window.confirm(message);
}

export default function StudentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [open, setOpen] = useState(false);
  const [supervisors] = useState(DEMO_SUPERVISORS);
  const [filterDate, setFilterDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    setMeetings(readMeetingsFromStorage());
  }, []);


  const handleOpen = () => {
    setSelectedSlot(null);
    setFilterDate("");
    setOpen(true);
  };

 
  const handleClose = () => {
    setOpen(false);
    setSelectedSlot(null);
    setFilterDate("");
  };

  const scheduleMeetingConfirm = () => {
    if (!selectedSlot) return;
    const id = `M-${Date.now().toString().slice(-6)}`;
    const bookedOn = new Date().toISOString();
    const newMeeting = {
      id,
      meetingDate: selectedSlot.date,
      meetingTime: selectedSlot.time,
      bookedOn,
      supervisor: selectedSlot.supervisorName,
    };
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    writeMeetingsToStorage(updated);
    callToast(`Meeting scheduled with ${selectedSlot.supervisorName} on ${selectedSlot.date} at ${selectedSlot.time}`, "success");
    handleClose();
  };

 
  const cancelMeeting = async (id) => {
    const ok = await confirmPrompt("Are you sure you want to cancel this meeting?");
    if (!ok) return;
    const updated = meetings.filter((m) => m.id !== id);
    setMeetings(updated);
    writeMeetingsToStorage(updated);
    callToast("Meeting cancelled", "success");
  };


  const visibleSupervisors = supervisors.map((s) => ({
    ...s,
    slots: s.slots.filter((sl) => (filterDate ? sl.date === filterDate : true)),
  }));

  const slotsList = visibleSupervisors.flatMap((s) =>
    s.slots.map((sl, idx) => ({
      slotId: `${s.id}-slot-${idx + 1}`,
      supervisorId: s.id,
      supervisorName: s.name,
      date: sl.date,
      time: sl.time,
    }))
  );

  
  const toggleSelectSlot = (slot) => {
    if (selectedSlot && selectedSlot.slotId === slot.slotId && selectedSlot.supervisorId === slot.supervisorId) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const headers = ["Meeting ID", "Meeting Date", "Meeting Time", "Booked On"];
  const rowsForTable = meetings.map((m) => ({
    "Meeting ID": m.id,
    "Meeting Date": m.meetingDate,
    "Meeting Time": m.meetingTime,
    "Booked On": new Date(m.bookedOn).toLocaleString(),
    __raw: m,
  }));

  const renderActions = (rowObj) => {
    const id = rowObj["Meeting ID"];
    const sideFormMode = false; 
    return (
      <button
        className="std-meeting-cancel-btn"
        style={{
          background: "#f43f5e",
          color: "#fff",
          padding: "6px 10px",
          border: "none",
          borderRadius: 6,
          cursor: sideFormMode ? "not-allowed" : "pointer",
        }}
        onClick={() => cancelMeeting(id)}
        disabled={sideFormMode}
      >
        Cancel
      </button>
    );
  };

  return (
    <>
      <DashboardSectionHeader description="Schedule and manage meetings with your supervisors.">
        Student Meetings
      </DashboardSectionHeader>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Button
          className="schedule-btn"
          onClick={handleOpen}
          variant="contained"
        >
          Schedule Meeting
        </Button>

        <Typography variant="body2" color="textSecondary">
          {meetings.length} meeting(s)
        </Typography>
      </Box>

    
      <AppTable headers={headers} rows={rowsForTable} renderActions={renderActions} />

      
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="student-meetings-modal-title"
        closeAfterTransition
        BackdropProps={{ style: { backgroundColor: "rgba(15, 23, 42, 0.55)" } }}
      >
        <Box
          className="student-meetings-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-meetings-modal-title"
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(980px, 95vw)",
            maxHeight: "86vh",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff",
            borderRadius: 2,
            boxShadow: "0 32px 96px rgba(1, 51, 122, 0.18)",
            overflow: "hidden",
          }}
        >
          
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, borderBottom: "1px solid #eef2f6" }}>
            <Typography id="student-meetings-modal-title" variant="h6">Available Slots</Typography>
            <IconButton onClick={handleClose} size="small" aria-label="close modal">
              <CloseIcon />
            </IconButton>
          </Box>

         
          <Box sx={{ p: 2, overflowY: "auto" }}>
          
            <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
              <TextField
                size="small"
                type="date"
                label="Filter by date"
                InputLabelProps={{ shrink: true }}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                sx={{ minWidth: 160 }}
              />

              <Button size="small" onClick={() => { setFilterDate(""); }}>
                Clear
              </Button>
            </Box>

           
            <Box sx={{ display: "flex", gap: 2, pb: 1, borderBottom: "1px dashed #e6eef6", mb: 1, fontWeight: 700 }}>
              <Box sx={{ width: "40%", color: "#374151" }}>Slot ID</Box>
              <Box sx={{ width: "30%", color: "#374151" }}>Date</Box>
              <Box sx={{ width: "30%", color: "#374151" }}>Time</Box>
            </Box>

            {/* Rows */}
            {slotsList.length === 0 && (
              <Typography color="textSecondary">No slots available.</Typography>
            )}

            {slotsList.map((slot) => {
              const isSelected = selectedSlot && selectedSlot.slotId === slot.slotId && selectedSlot.supervisorId === slot.supervisorId;
              const supColor = supervisors.find(s => s.id === slot.supervisorId)?.color || "#3b82f6";
              return (
                <Box
                  key={slot.slotId}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelectSlot(slot)}
                  onKeyDown={(e) => { if (e.key === "Enter") toggleSelectSlot(slot); }}
                  aria-pressed={isSelected}
                  className={`slot-row ${isSelected ? "selected" : ""}`}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    p: 1.25,
                    borderRadius: 1,
                    mb: 1,
                    border: isSelected ? `2px solid ${supColor}` : "1px solid #e6eef6",
                    background: isSelected ? `${supColor}14` : "#fff",
                    cursor: "pointer",
                    "&:hover": { boxShadow: "0 6px 18px rgba(2,6,23,0.04)", transform: "translateY(-2px)", transition: "transform .12s ease" },
                  }}
                >
                  <Box sx={{ width: "40%", color: "#0f172a", fontWeight: 700 }}>{slot.slotId}</Box>
                  <Box sx={{ width: "30%", display: "flex", alignItems: "center", gap: 1, color: "#0f172a" }}>
                    <EventIcon fontSize="small" color="action" />
                    <span>{slot.date}</span>
                  </Box>
                  <Box sx={{ width: "30%", display: "flex", alignItems: "center", gap: 1, color: "#0f172a" }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <span>{slot.time}</span>
                  </Box>
                </Box>
              );
            })}
          </Box>

       
          
          <div className="cnf-booking-btn-div">
            <Button className="std-meeting-cancel-btn" onClick={handleClose}>Cancel</Button>
            <Button
  className="confirm-btn-meetingmodal"
  disabled={!selectedSlot}
  onClick={scheduleMeetingConfirm}
>
  Confirm Booking
</Button>

          </div>
        </Box>
      </Modal>
    </>
  );
}
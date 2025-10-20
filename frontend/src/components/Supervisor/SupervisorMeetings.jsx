// components/SupervisorMeetings.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Delete,
  Group as GroupIcon,
  AccessTime,
  CalendarToday,
  AddCircleOutline,
  EventAvailable,
  EventBusy,
} from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./SupervisorMeetings.css";

// ----- Dummy Data -----
const SUPERVISOR_ID = "sup123";
function getDummySlots() {
  return [
    { slotId: "slot1", supervisorId: SUPERVISOR_ID, date: "2025-09-15", time: "14:00", duration: 30, bookedBy: null },
    { slotId: "slot2", supervisorId: SUPERVISOR_ID, date: "2025-09-15", time: "15:00", duration: 30, bookedBy: "Group 1" },
    { slotId: "slot3", supervisorId: SUPERVISOR_ID, date: "2025-09-16", time: "10:00", duration: 30, bookedBy: null },
    { slotId: "slot4", supervisorId: SUPERVISOR_ID, date: "2025-09-16", time: "11:00", duration: 30, bookedBy: "Group 2" },
  ];
}
// -----------------------

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(+h, +m);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Dialog Transition
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SupervisorMeetings() {
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [formError, setFormError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Load dummy slots
  useEffect(() => {
    setSlots(getDummySlots());
  }, []);

  // Add new slot
  const handleAddSlot = () => {
    if (!date || !time || !duration) {
      setFormError("All fields required");
      return;
    }
    const isoDate = new Date(date).toISOString().slice(0, 10);
    setSlots([
      ...slots,
      {
        slotId: `slot${Math.random().toString(36).slice(2)}`,
        supervisorId: SUPERVISOR_ID,
        date: isoDate,
        time,
        duration: Number(duration),
        bookedBy: null,
      },
    ]);
    setDate("");
    setTime("");
    setDuration(30);
    setFormError("");
    setOpenDialog(false);
  };

  // Delete slot
  const handleDeleteSlot = (slotId) => {
    setSlots(slots.filter((s) => s.slotId !== slotId));
  };

  // Sort slots
  const sortedSlots = [...slots].sort(
    (a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
  );

  const upcomingMeetings = sortedSlots.filter((s) => s.bookedBy);

  const statusChipProps = (bookedBy) =>
    bookedBy
      ? { label: `Booked by ${bookedBy}`, color: "success", icon: <GroupIcon fontSize="small" />, variant: "filled" }
      : { label: "Available", color: "warning", icon: <AccessTime fontSize="small" />, variant: "outlined" };

  return (
      <>
        
        <DashboardSectionHeader
                description={`Here you can see all your meetings. Click "Add available slot" to add the time you are free to reach,
          and you can also see your past and upcoming meetings`}
              >
               Meetings
              </DashboardSectionHeader>

        <Box width="100%">
          {/* Add Slot Button */}
          <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircleOutline/>}
              className="add-slot-btn"
              onClick={() => setOpenDialog(true)}
          >
            Add Available Slot
          </Button>

          {/* Add Slot Dialog */}
          <Dialog
              open={openDialog}
              TransitionComponent={Transition}
              onClose={() => setOpenDialog(false)}
              fullWidth
              maxWidth="sm"
          >
            <DialogTitle className="dialog-title">
              <EventAvailable className="dialog-icon"/>
              Add New Meeting Slot
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{shrink: true}}
                    fullWidth
                />
                <TextField
                    label="Time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    InputLabelProps={{shrink: true}}
                    fullWidth
                />
                <TextField
                    label="Duration (min)"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    inputProps={{min: 10, max: 120}}
                    fullWidth
                />
                {formError && <Typography color="error">{formError}</Typography>}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)} color="inherit">
                Cancel
              </Button>
              <Button variant="contained" onClick={handleAddSlot}>
                Add Slot
              </Button>
            </DialogActions>
          </Dialog>

          {/* Slot Summary */}
          <Stack
              direction={{xs: "column", sm: "row"}}
              spacing={2}
              mb={4}
              justifyContent="center"
          >
            <Paper className="summary-card total">
              <Typography className="summary-label">Total Slots</Typography>
              <Typography className="summary-value">{slots.length}</Typography>
            </Paper>
            <Paper className="summary-card available">
              <Typography className="summary-label">Available</Typography>
              <Typography className="summary-value">
                {slots.filter((s) => !s.bookedBy).length}
              </Typography>
            </Paper>
            <Paper className="summary-card booked">
              <Typography className="summary-label">Booked</Typography>
              <Typography className="summary-value">
                {slots.filter((s) => !!s.bookedBy).length}
              </Typography>
            </Paper>
          </Stack>

          {/* All Slots */}
          <Paper className="slots-paper">
            <Typography className="section-title">
              <EventBusy className="section-icon"/>
              All Slots
            </Typography>
            <Divider className="divider"/>
            <Table size="small" className="full-table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <CalendarToday fontSize="small" className="inline-icon"/>
                    Date
                  </TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedSlots.map((slot) => (
                    <TableRow
                        key={slot.slotId}
                        hover
                        className={slot.bookedBy ? "slot-row booked-row" : "slot-row"}
                    >
                      <TableCell>{formatDate(slot.date)}</TableCell>
                      <TableCell>{formatTime(slot.time)}</TableCell>
                      <TableCell>{slot.duration} min</TableCell>
                      <TableCell>
                        <Chip {...statusChipProps(slot.bookedBy)} />
                      </TableCell>
                      <TableCell align="center">
                        {!slot.bookedBy && (
                            <Tooltip title="Delete Slot">
                        <span>
                          <IconButton
                              onClick={() => handleDeleteSlot(slot.slotId)}
                              color="error"
                              size="small"
                          >
                            <Delete/>
                          </IconButton>
                        </span>
                            </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                ))}
                {sortedSlots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography className="no-slots">
                          No slots available.
                        </Typography>
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Upcoming Meetings */}
          <Paper className="slots-paper">
            <Typography className="section-title upcoming">
              <EventAvailable className="section-icon upcoming"/>
              Upcoming Meetings
            </Typography>
            <Divider className="divider"/>
            {upcomingMeetings.length === 0 ? (
                <Typography className="no-meetings">No upcoming meetings.</Typography>
            ) : (
                <Table size="small" className="full-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Group</TableCell>
                      <TableCell>Duration</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingMeetings.map((slot) => (
                        <TableRow key={slot.slotId}>
                          <TableCell>{formatDate(slot.date)}</TableCell>
                          <TableCell>{formatTime(slot.time)}</TableCell>
                          <TableCell>
                            <Chip
                                label={slot.bookedBy}
                                color="success"
                                icon={<GroupIcon fontSize="small"/>}
                                size="small"
                            />
                          </TableCell>
                          <TableCell>{slot.duration} min</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
            )}
          </Paper>
        </Box>
      </>
  );
}

import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Radio,
    Divider,
    CircularProgress
} from "@mui/material";
import ToastService from "../../ToastService/ToastService.jsx";

export default function SlotBookingModal({ open, onClose, slots = [], groupId, scheduleId }) {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleBook = async () => {
        if (!selectedSlot) return ToastService.error("Please select a slot");

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/deadlineSchedule/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId: selectedSlot, groupId, scheduleId }),
            });
            const data = await res.json();

            if (data.success) {
                ToastService.success(" 🎉 Slot booked successfully!");
                onClose();
            } else {
                ToastService.error("Error booking slot");
            }
        } catch (err) {
            console.error(err);
            ToastService.error("Failed to book slot");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    textAlign: "center",
                    color: "#01337a",
                    borderBottom: "1px solid #e0e0e0",
                }}
            >
                📅 Select a Presentation Slot
            </DialogTitle>

            <DialogContent dividers sx={{ backgroundColor: "#fafafa", p: 3 }}>
                {slots.length === 0 ? (
                    <Typography color="textSecondary" align="center">
                        No available slots found.
                    </Typography>
                ) : (
                    <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                        {slots.map((slot, i) => {
                            const start = new Date(slot.startTime).toLocaleString();
                            const end = new Date(slot.endTime).toLocaleString();
                            const isBooked = slot.bookedBy;

                            return (
                                <Box
                                    key={slot._id}
                                    component="li"
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        p: 1.5,
                                        mb: 1.5,
                                        borderRadius: "10px",
                                        backgroundColor: selectedSlot === slot._id ? "#e6f0ff" : "#fff",
                                        border: "1px solid #d0d7de",
                                        transition: "0.2s",
                                        "&:hover": {
                                            backgroundColor: "#f5f8ff",
                                            transform: "scale(1.01)",
                                        },
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Radio
                                            checked={selectedSlot === slot._id}
                                            onChange={() => setSelectedSlot(slot._id)}
                                            disabled={isBooked}
                                            sx={{ color: "#01337a" }}
                                        />
                                        <Box>
                                            <Typography sx={{ fontWeight: 500 }}>
                                                {start} — {end}
                                            </Typography>
                                            {isBooked && (
                                                <Typography variant="body2" color="error">
                                                    (Already booked)
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>

            <Divider />
            <DialogActions sx={{ justifyContent: "center", py: 2 }}>
                <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleBook}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        backgroundColor: "#01337a",
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#002a63" },
                    }}
                >
                    {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Book Slot"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
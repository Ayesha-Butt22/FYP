import React, { useState, useEffect } from "react";
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

export default function SlotBookingModal({ open, onClose, slots = [], groupId, data }) {
    const [selectedSlot, setSelectedSlot] = useState(null); // stores string ID
    const [loading, setLoading] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (open) setSelectedSlot(null);
    }, [open]);

    const filteredSlots = slots.filter(slot => {
        const now = new Date();
        const slotStart = new Date(slot.startTime);
        return slotStart >= now; // only present/future
    });

    const handleBook = async () => {
        if (!selectedSlot) return ToastService.error("Please select a slot first");
        if (!groupId) return ToastService.error("Group not found. Please refresh and try again.");

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/deadlineSchedule/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectedSlot: selectedSlot,   // already a string
                    groupId: groupId.toString(),
                })
            });
            const response = await res.json();

            if (response.success) {
                ToastService.success("🎉 Slot booked successfully!");
                onClose();
                window.location.reload();
            } else {
                ToastService.error(response.message || "Error booking slot");
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
            <DialogTitle sx={{
                fontWeight: 700,
                fontSize: "1.15rem",
                textAlign: "center",
                color: "#01337a",
                borderBottom: "1px solid #e0e0e0",
                pb: 1.5,
            }}>
                📅 Select a Presentation Slot
            </DialogTitle>

            <DialogContent dividers sx={{ backgroundColor: "#fafafa", p: 3 }}>
                {filteredSlots.length === 0 ? (
                    <Typography color="textSecondary" align="center" sx={{ py: 4, fontSize: "0.95rem" }}>
                        No available slots for your next milestone yet.<br />
                        Slots appear here once the coordinator publishes them.
                    </Typography>
                ) : (
                    <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                        {filteredSlots.map(slot => {
                            // Always work with strings to avoid ObjectId === ObjectId reference mismatch
                            const slotId = slot._id?.toString();
                            const isSelected = selectedSlot === slotId;

                            const start = new Date(slot.startTime).toLocaleString([], {
                                weekday: "short", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                            });
                            const end = new Date(slot.endTime).toLocaleTimeString([], {
                                hour: "2-digit", minute: "2-digit",
                            });

                            return (
                                <Box
                                    key={slotId}
                                    component="li"
                                    onClick={() => setSelectedSlot(slotId)}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        p: 1.5,
                                        mb: 1.5,
                                        borderRadius: "10px",
                                        backgroundColor: isSelected ? "#e6f0ff" : "#fff",
                                        border: isSelected ? "2px solid #01337a" : "1px solid #d0d7de",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        "&:hover": { backgroundColor: "#f0f5ff" },
                                    }}
                                >
                                    <Radio
                                        checked={isSelected}
                                        onChange={() => setSelectedSlot(slotId)}
                                        sx={{ color: "#01337a", mr: 1, p: 0.5 }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontWeight: 700, color: "#01337a", fontSize: "0.95rem" }}>
                                            {slot.fypPart?.toUpperCase() || ""}&nbsp;&nbsp;|&nbsp;&nbsp;
                                            {slot.week}{slot.venue ? ` — ${slot.venue}` : ""}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#555", mt: 0.3 }}>
                                            {start} &mdash; {end}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>

            <Divider />
            <DialogActions sx={{ justifyContent: "center", py: 2, gap: 2 }}>
                <Button onClick={onClose} color="inherit" sx={{ textTransform: "none", minWidth: 100 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleBook}
                    disabled={loading || !selectedSlot}
                    variant="contained"
                    sx={{ backgroundColor: "#01337a", textTransform: "none", minWidth: 120, "&:hover": { backgroundColor: "#002a63" } }}
                >
                    {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Book Slot"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
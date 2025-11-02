import React, { useEffect, useState } from "react";
import PresentationService from "../../Api/PresentationService.jsx";
import { DropdownMultiSelect } from "../../Admin/DropDowns.jsx";
import "./Modal.css";
import ToastService from "../../ToastService/ToastService.jsx";

export default function PresentationModal({ week, onClose , year}) {
    const [faculty, setFaculty] = useState([]);
    const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
    const [venue, setVenue] = useState("");
    const [slots, setSlots] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [existingSchedule, setExistingSchedule] = useState(null);
    const [mode, setMode] = useState("create");
    const fypPart = year;

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/deadlineSchedule/getfaculty");
                const data = await res.json();
                setFaculty(data || []);
            } catch (err) {
                console.error("Error fetching faculty:", err);
            }
        };

        const fetchPresentation = async () => {
            try {
                const res = await PresentationService.getPresentation(week.week, fypPart);
                if (res?.data) {
                    setExistingSchedule(res.data);
                }
            } catch (err) {
                console.error("Error fetching presentation:", err);
            }
        };

        fetchFaculty();
        fetchPresentation();
    }, [week.week]);


    const addSlot = () => {
        if (!startTime || !endTime) return;
        setSlots([...slots, { startTime, endTime }]);
        setStartTime("");
        setEndTime("");
    };

    const removeSlot = (index) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                week: week.week,
                fypPart,
                facultyPanels: selectedFacultyIds,
                venue,
                slots,
            };
            const res = await PresentationService.createOrUpdate(payload);
            ToastService.success( "Presentation schedule saved successfully");
            onClose();
        } catch (err) {
            console.error(err);
            ToastService.error("Error saving schedule");
        } finally {
            setLoading(false);
        }
    };


    const selectedFacultyNames = selectedFacultyIds
        .map((id) => {
            const f = faculty.find((fa) => fa._id === id);
            return f ? `${f.name} (${f.email})` : "";
        })
        .filter(Boolean);

    const allFacultyLabels = faculty.map((f) => `${f.name} (${f.email})`);

    return (
        <div className="modal-overlay-week" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label><b>Manage Slots - {week.week}</b></label>
                    <button
                        style={{width: 100}}
                        onClick={() => setMode(mode === "view" ? "create" : "view")}
                        className="btn main-btn"
                    >
                        {mode === "view" ? "Edit" : "View"}
                    </button>
                </div>

                {mode === "view" && existingSchedule ? (
                    <div className="view-section">
                        <p><label>Venue:</label> {existingSchedule.venue}</p>

                        <p><label>Faculty Panels:</label></p>
                        <ul>
                            {existingSchedule.facultyPanels.map((f) => (
                                <li key={f._id}>{f.name} ({f.email})</li>
                            ))}
                        </ul>

                        <p><label>Slots:</label></p>
                        <ul>
                            {existingSchedule.slots.map((s, i) => (
                                <li key={i}>
                                    {new Date(s.startTime).toLocaleString()} -{" "}
                                    {new Date(s.endTime).toLocaleString()}{" "}
                                    {s.bookedBy ? `(${s.bookedBy.groupId})` : "(Available)"}
                                </li>
                            ))}
                        </ul>
                        <div className="slot-adder" style={{ marginTop: "20px" }}>
                            <div className="input-group">
                                <label>Start Time:</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div className="input-group">
                                <label>End Time:</label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <button
                                className="btn btn-success"
                                onClick={async () => {
                                    if (!startTime || !endTime) {
                                        ToastService.error("Please select start and end time");
                                        return;
                                    }
                                    try {
                                        const payload = {
                                            week: week.week,
                                            fypPart,
                                            facultyPanels: existingSchedule.facultyPanels.map(f => f._id),
                                            venue: existingSchedule.venue,
                                            slots: [{ startTime, endTime }],
                                        };
                                        const res = await PresentationService.createOrUpdate(payload);
                                        ToastService.success("Slot added successfully");
                                        setStartTime("");
                                        setEndTime("");
                                        const updated = await PresentationService.getPresentation(week.week, fypPart);
                                        setExistingSchedule(updated.data);
                                    } catch (err) {
                                        console.error(err);
                                        ToastService.error("Error adding slot");
                                    }
                                }}
                            >
                                + Add Slot
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="form-group">
                            <label className="form-label" htmlFor="faculty-select" style={{ marginTop: 20 }}>
                                Faculty Panels:
                            </label>
                            <DropdownMultiSelect
                                value={selectedFacultyNames}
                                options={allFacultyLabels}
                                onChange={(selectedLabels) => {
                                    const selectedIds = faculty
                                        .filter((f) => selectedLabels.includes(`${f.name} (${f.email})`))
                                        .map((f) => f._id);
                                    setSelectedFacultyIds(selectedIds);
                                }}
                                placeholder="Select faculty members"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="venue-input">Venue:</label>
                            <input
                                id="venue-input"
                                type="text"
                                className="form-input"
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                placeholder="Enter venue"
                            />
                        </div>

                        <div className="slot-adder">
                            <div className="input-group">
                                <label className="form-label" htmlFor="start-time">Start Time:</label>
                                <input
                                    id="start-time"
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div className="input-group">
                                <label className="form-label" htmlFor="end-time">End Time:</label>
                                <input
                                    id="end-time"
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <button
                                onClick={addSlot}
                                className="btn btn-success"
                                title="Add slot"
                            >
                                +
                            </button>
                        </div>

                        {slots.length > 0 && (
                            <ul className="slot-list">
                                {slots.map((slot, i) => (
                                    <li key={i} className="slot-item">
                    <span>
                      {new Date(slot.startTime).toLocaleString()} -{" "}
                        {new Date(slot.endTime).toLocaleString()}
                    </span>
                                        <button
                                            onClick={() => removeSlot(i)}
                                            className="slot-remove-btn"
                                            title="Remove slot"
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="modal-footer">
                            <button onClick={onClose} className="btn close">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn main-btn"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

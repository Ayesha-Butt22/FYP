import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import "./SupervisorSlots.css";

const SAMPLE_SUPERVISORS = [
  { id: "sup-001", name: "Ayesha", email: "Ayesha@riphah.edu.pk", department: "CS", speciality: "AI, Cloud", availableSlots: 3, bookedSlots: 1 },
  { id: "sup-002", name: "Warda", email: "warda@riphah.edu.pk", department: "SE", speciality: "Web", availableSlots: 5, bookedSlots: 3 },
  { id: "sup-003", name: "Sobia", email: "Sobia@riphah.edu.pk", department: "SE", speciality: "AI", availableSlots: 0, bookedSlots: 0 },
  { id: "sup-004", name: "Laiba", email: "Laiba@riphah.edu.pk", department: "CS", speciality: "data science", availableSlots: 0, bookedSlots: 0 },
  { id: "sup-005", name: "Alina", email: "Alina@riphah.edu.pk", department: "CA", speciality: "cloud", availableSlots: 0, bookedSlots: 0 },
];

export default function SupervisorSlots() {
  const [supervisors, setSupervisors] = useState([]);
  const [editing, setEditing] = useState(null); // { id, name, available, booked }

  useEffect(() => {
    setSupervisors(SAMPLE_SUPERVISORS);
  }, []);

  const openEdit = (sup) => {
    setEditing({
      id: sup.id,
      name: sup.name,
      available: sup.availableSlots,
      booked: sup.bookedSlots
    });
  };

  const closeEdit = () => setEditing(null);

  const handleDelete = async (sup) => {
    const ok = await Confirm(`Are you sure you want to delete ${sup.name}?`);
    if (!ok) return;
    // TODO: call API to delete supervisor
    setSupervisors(prev => prev.filter(s => s.id !== sup.id));
    toastService.success("Supervisor deleted");
  };

  const handleSave = () => {
    if (!editing) return;
    const available = Number(editing.available);
    const booked = Number(editing.booked);

    if (!Number.isInteger(available) || available < 0) {
      toastService.error("Available slots must be a non-negative integer");
      return;
    }
    if (!Number.isInteger(booked) || booked < 0) {
      toastService.error("Booked slots must be a non-negative integer");
      return;
    }
    if (available < booked) {
      toastService.error("You cannot make available slots less than booked slots.");
      return;
    }

    // TODO: persist via API; for now update local state
    setSupervisors(prev => prev.map(s => s.id === editing.id ? { ...s, availableSlots: available, bookedSlots: booked } : s));
    setEditing(null);
    toastService.success("Supervisor slots updated");
  };

  const headers = ["Name", "Department", "Speciality", "Available Slots", "Booked Slots"];

  const rows = supervisors.map(s => ({
    Name: <strong className="sup-name">{s.name}</strong>,
    Department: s.department,
    Speciality: s.speciality,
    "Available Slots": s.availableSlots,
    "Booked Slots": s.bookedSlots,
    __raw: s
  }));

  const renderActions = (rowObj, index) => {
    const sup = rowObj.__raw || supervisors[index];
    return (
      <>
        <button
          className="table-action-btn"
          onClick={() => openEdit(sup)}
        >
          Edit
        </button>
        <button
          className="table-action-btn delete"
          onClick={() => handleDelete(sup)}
        >
          Delete
        </button>
      </>
    );
  };

  return (
    <>
      <DashboardSectionHeader>Supervisor Slots</DashboardSectionHeader>

      <div className="section-desc">
        You can manage supervisor slots and set a fixed limit for how many groups each supervisor can handle. This helps ensure balanced workload distribution.
      </div>

      <div className="sup-table-card">
        <AppTable headers={headers} rows={rows} renderActions={renderActions} />
      </div>

      {editing && (
        <div className="sup-edit-backdrop" role="dialog" aria-modal="true">
          <div className="sup-edit-modal" role="document">
            <h3 className="sup-edit-title">Edit Slots — {editing.name}</h3>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Available Slots</label>
              <input
                className="sup-edit-input"
                type="number"
                min="0"
                value={String(editing.available)}
                onChange={(e) => setEditing(prev => ({ ...prev, available: e.target.value }))}
              />
            </div>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Booked Slots</label>
              <input
                className="sup-edit-input"
                type="number"
                min="0"
                value={String(editing.booked)}
                onChange={(e) => setEditing(prev => ({ ...prev, booked: e.target.value }))}
              />
            </div>

            <div className="sup-modal-actions">
              <button className="sup-btn-save" onClick={handleSave}>Save</button>
              <button className="sup-btn-cancel" onClick={closeEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
//ProjectCoordinator//SupervisorSlots
import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import { adminSupervisorApi } from "../Api/AdminApi/AdminApis.jsx";
import "./SupervisorSlots.css";
import {
  extractSupervisorList,
  normalizeSupervisor,
  sortSupervisorsByName,
} from "../../utils/supervisorData.js";

const DESIGNATION_DEFAULTS = {
  Dean: 0,
  Professor: 1,
  "Associate Professor": 2,
  "Assistant Professor": 3,
  "Lecturer/Sr. Lecturer": 3,
  "Junior Lecturer": 2,
  "Research Associate/Assistant": 1,
  "Teaching Fellow": 1,
};

export default function SupervisorSlots() {
  const [supervisors, setSupervisors] = useState([]);
  const [editing, setEditing] = useState(null);
 
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const coordinatorRes = await adminSupervisorApi.getSupervisorsForCoordinator();
        const payload = coordinatorRes.success
          ? coordinatorRes.data
          : (await adminSupervisorApi.getSupervisors()).data;

        setSupervisors(
          sortSupervisorsByName(extractSupervisorList(payload).map(normalizeSupervisor))
        );
      } catch (err) {
        toastService.error("Failed to fetch supervisors");
      }
    };
    fetchSupervisors();
  }, []);

  const openEdit = (sup) => {
    const defaultSlots = DESIGNATION_DEFAULTS[sup.designation] ?? sup.availableSlots ?? 0;
    setEditing({
      id: sup.id,
      name: sup.name,
      email: sup.email,
      designation: sup.designation || "",
      available: sup.availableSlots ?? defaultSlots,
      booked: sup.bookedSlots ?? 0,
    });
  };

  const closeEdit = () => setEditing(null);

  const handleDelete = async (sup) => {
    const ok = await Confirm(`Are you sure you want to delete ${sup.name}?`);
    if (!ok) return;
    try {
      const res = await adminSupervisorApi.deleteSupervisor(sup.id);
      if (!res.success) throw new Error(res.error || "Delete failed");
      const updated = supervisors.filter((s) => s.id !== sup.id);
      setSupervisors(updated);
      toastService.success("Supervisor deleted");
    } catch (err) {
      toastService.error("Failed to delete supervisor");
    }
  };

  const handleSave = async () => {
    if (!editing) return;

    const booked = Number(editing.booked);
    const defaultSlots = DESIGNATION_DEFAULTS[editing.designation] ?? 0;
    const available = defaultSlots;

    if (!Number.isInteger(booked) || booked < 0) {
      toastService.error("Booked slots must be a non-negative integer");
      return;
    }
    if (booked > available) {
      toastService.error(
        `Booked slots (${booked}) cannot exceed available slots (${available}).`
      );
      return;
    }

    try {
      const res = await adminSupervisorApi.updateSupervisorSlots(
        editing.email,
        editing.designation,
        booked
      );

      if (!res.success) {
        throw new Error(res.error || res.data?.error || "Failed to update supervisor");
      }

      const refreshedRes = await adminSupervisorApi.getSupervisorsForCoordinator();
      const payload = refreshedRes.success
        ? refreshedRes.data
        : (await adminSupervisorApi.getSupervisors()).data;

      const updated = sortSupervisorsByName(
        extractSupervisorList(payload).map(normalizeSupervisor)
      );

      setSupervisors(updated);
      setEditing(null);
      toastService.success("Supervisor slots updated successfully");
    } catch (err) {
      const message = err.message || err.response?.data?.error || "Failed to update supervisor";
      toastService.error(message);
    }
  };

  const headers = [
    "Name",
    "Department",
    "Speciality",
    "Designation",
    "Available Slots",
    "Booked Slots",
  ];

  const rows = Array.isArray(supervisors)
    ? supervisors.map((s) => ({
        Name: <strong className="sup-name">{s.name}</strong>,
        Department: s.department || "—",
        Speciality: s.specializationText || "—",
        Designation: s.designation || "—",
        "Available Slots": s.availableSlots,
        "Booked Slots": s.bookedSlots,
        __raw: s,
      }))
    : [];

  const renderActions = (rowObj, index) => {
    const sup = rowObj.__raw || supervisors[index];
    return (
      <>
        <button className="table-action-btn" onClick={() => openEdit(sup)}>
          Edit
        </button>
        <button className="table-action-btn delete" onClick={() => handleDelete(sup)}>
          Delete
        </button>
      </>
    );
  };

  return (
    <>
      <DashboardSectionHeader
        description={
          "Manage supervisor slots. Available slots are fixed based on designation ."
        }
      >
        Supervisor Slots
      </DashboardSectionHeader>

      <div className="sup-table-card">
        <AppTable headers={headers} rows={rows} renderActions={renderActions} />
      </div>

      {editing && (
        <div className="sup-edit-backdrop" role="dialog" aria-modal="true">
          <div className="sup-edit-modal" role="document">
            <h3 className="sup-edit-title">Edit Slots — {editing.name}</h3>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Designation</label>
              <select
                className="sup-edit-select"
                value={editing.designation}
                onChange={(e) => {
                  const newDes = e.target.value;
                  const defaultSlots = DESIGNATION_DEFAULTS[newDes] ?? 0;
                  setEditing((prev) => ({
                    ...prev,
                    designation: newDes,
                    available: defaultSlots,
                  }));
                }}
              >
                <option value="">-- Select designation --</option>
                {Object.keys(DESIGNATION_DEFAULTS).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Available Slots</label>
              <input
                className="sup-edit-input"
                type="number"
                value={String(editing.available)}
                disabled
                readOnly
              />
            </div>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Booked Slots</label>
              <input
                className="sup-edit-input"
                type="number"
                min="0"
                value={String(editing.booked)}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, booked: e.target.value }))
                }
              />
            </div>

            <div className="sup-modal-actions">
              <button className="sup-btn-save" onClick={handleSave}>
                Save
              </button>
              <button className="sup-btn-cancel" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../AppTable";
import "../Admin/ManageSupervisor.css";

const headers = [
  "ID",
  "Name",
  "Email",
  "Department",
  "Speciality",
  "Available Slots",
  "Booked Slots"
];

const initialRows = [
  {
    ID: "SUP001",
    Name: "Dr. Ali",
    Email: "ali.raza@riphah.edu.pk",
    Department: "CS",
    Speciality: "Web",
    "Available Slots": 3,
    "Booked Slots": 3
  },
  {
    ID: "SUP002",
    Name: "Ms. Sana Fatima",
    Email: "sana.fatima@riphah.edu.pk",
    Department: "SE",
    Speciality: "Web, Cloud",
    "Available Slots": 2,
    "Booked Slots": 2
  },
  {
    ID: "SUP003",
    Name: "Dr. Imran Haider",
    Email: "imran.haider@riphah.edu.pk",
    Department: "CS",
    Speciality: "Data Science",
    "Available Slots": 3,
    "Booked Slots": 0
  },
  {
    ID: "SUP004",
    Name: "Dr. Samina Tariq",
    Email: "samina.tariq@riphah.edu.pk",
    Department: "IT",
    Speciality: "Networks, Security",
    "Available Slots": 5,
    "Booked Slots": 2
  },
  {
    ID: "SUP005",
    Name: "Engr. Bilal Ahmed",
    Email: "bilal.ahmed@riphah.edu.pk",
    Department: "EE",
    Speciality: "IoT, Embedded",
    "Available Slots": 2,
    "Booked Slots": 1
  }
];

export default function ManageSupervisors() {
  const [rows, setRows] = useState(initialRows);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({
    ID: "",
    Name: "",
    Email: "",
    Department: "",
    Speciality: "",
    "Available Slots": "",
    "Booked Slots": "",
    Password: ""
  });
  const [addIdSuffix, setAddIdSuffix] = useState("");

  // Edit functions
  const handleEdit = (row, idx) => {
    setEditIndex(idx);
    setEditData({ ...row });
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: name.includes("Slots") ? Number(value) : value
    }));
  };
  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedRows = [...rows];
    updatedRows[editIndex] = { ...editData };
    setRows(updatedRows);
    setEditIndex(null);
    setEditData({});
  };
  const handleCancel = () => {
    setEditIndex(null);
    setEditData({});
    setShowAdd(false);
    setAddData({
      ID: "",
      Name: "",
      Email: "",
      Department: "",
      Speciality: "",
      "Available Slots": "",
      "Booked Slots": "",
      Password: ""
    });
    setAddIdSuffix("");
  };

  // Delete
  const handleDelete = (idx) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== idx));
    if (editIndex === idx) handleCancel();
  };

  // Add Supervisor
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    if (name === "ID") {
      setAddIdSuffix(value.replace(/[^0-9]/g, "")); // only allow numbers in suffix
      setAddData((prev) => ({
        ...prev,
        ID: `SUP${value.replace(/[^0-9]/g, "")}`
      }));
    } else {
      setAddData((prev) => ({
        ...prev,
        [name]: name.includes("Slots") ? Number(value) : value
      }));
    }
  };
  const handleAdd = (e) => {
    e.preventDefault();
    const { Password, ...rowData } = addData;
    if (!rowData.ID.startsWith("SUP") || rowData.ID.length < 4) {
      alert("Please enter a valid ID (SUP followed by a number, e.g. SUP006)");
      return;
    }
    setRows((prevRows) => [...prevRows, rowData]);
    handleCancel();
  };

  // When add modal opens, reset everything and focus
  const openAddModal = () => {
    setShowAdd(true);
    setAddIdSuffix("");
    setAddData({
      ID: "SUP",
      Name: "",
      Email: "",
      Department: "",
      Speciality: "",
      "Available Slots": "",
      "Booked Slots": "",
      Password: ""
    });
  };

  return (
    <>
      <DashboardSectionHeader>Manage Supervisors</DashboardSectionHeader>
      <div className="section-desc">
        Admins can view the list of supervisors, add new supervisors, update existing supervisor details, and delete supervisors from the system.
      </div>
      {/* Add Supervisor Button */}
      <div style={{ display: "flex", justifyContent: "center", margin: "20px 0 0 0" }}>
        <button className="add-supervisor-btn" onClick={openAddModal}>
          + Add Supervisor
        </button>
      </div>
      <AppTable
        headers={headers}
        rows={rows}
        renderActions={(row, i) => (
          <>
            <button className="table-action-btn" onClick={() => handleEdit(row, i)}>Edit</button>
            <button className="table-action-btn" style={{ background: "#f43f5e" }} onClick={() => handleDelete(i)}>Delete</button>
          </>
        )}
      />

      {/* Edit Modal */}
      {editIndex !== null && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit Supervisor</div>
            <form onSubmit={handleUpdate} className="edit-form-grid">
              <div className="form-group">
                <label>ID</label>
                <input name="ID" value={editData.ID} onChange={handleEditChange} type="text" required disabled />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input name="Name" value={editData.Name} onChange={handleEditChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="Email" value={editData.Email} onChange={handleEditChange} type="email" required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input name="Department" value={editData.Department} onChange={handleEditChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Speciality</label>
                <input name="Speciality" value={editData.Speciality} onChange={handleEditChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Available Slots</label>
                <input name="Available Slots" value={editData["Available Slots"]} onChange={handleEditChange} type="number" min={0} required />
              </div>
              <div className="form-group">
                <label>Booked Slots</label>
                <input name="Booked Slots" value={editData["Booked Slots"]} onChange={handleEditChange} type="number" min={0} required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="table-action-btn" style={{ minWidth: 120, fontWeight: 800 }}>Update</button>
                <button type="button" className="table-action-btn" style={{ background: "#aaa", minWidth: 120, fontWeight: 800 }} onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Supervisor</div>
            <form onSubmit={handleAdd} className="edit-form-grid">
              <div className="form-group">
                <label>ID</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    background: '#e8eafc',
                    color: '#01337a',
                    fontWeight: '700',
                    padding: '8px 8px 8px 12px',
                    borderRadius: '8px 0 0 8px',
                    border: '1px solid #dbdbec',
                    borderRight: 'none'
                  }}>SUP</span>
                  <input
                    style={{
                      borderRadius: "0 8px 8px 0",
                      borderLeft: "none",
                      flex: 1
                    }}
                    name="ID"
                    value={addIdSuffix}
                    onChange={handleAddChange}
                    type="text"
                    placeholder="e.g. 006"
                    required
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input name="Name" value={addData.Name} onChange={handleAddChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="Email" value={addData.Email} onChange={handleAddChange} type="email" required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input name="Department" value={addData.Department} onChange={handleAddChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Speciality</label>
                <input name="Speciality" value={addData.Speciality} onChange={handleAddChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Available Slots</label>
                <input name="Available Slots" value={addData["Available Slots"]} onChange={handleAddChange} type="number" min={0} required />
              </div>
              <div className="form-group">
                <label>Booked Slots</label>
                <input name="Booked Slots" value={addData["Booked Slots"]} onChange={handleAddChange} type="number" min={0} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input name="Password" value={addData.Password} onChange={handleAddChange} type="password" required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="table-action-btn" style={{ minWidth: 120, fontWeight: 800 }}>Save</button>
                <button type="button" className="table-action-btn" style={{ background: "#aaa", minWidth: 120, fontWeight: 800 }} onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
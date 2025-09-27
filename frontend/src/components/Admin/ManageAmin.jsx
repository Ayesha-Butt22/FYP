import React, { useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import "../Admin/Modal&Button.css";

const headers = ["Name", "Email", "Password"];

const initialRows = [
  {
    Name: "System Admin",
    Email: "admin@riphah.edu.pk",
    Password: "admin123"
  },
  {
    Name: "Ayesha Butt",
    Email: "ayesha.butt@riphah.edu.pk",
    Password: "ayesha321"
  }
];

export default function ManageAdmin() {
  const [rows, setRows] = useState(initialRows);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({
    Name: "",
    Email: "",
    Password: ""
  });

  // Edit
  const handleEdit = (row, idx) => {
    setEditIndex(idx);
    setEditData({ ...row });
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value
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
      Name: "",
      Email: "",
      Password: ""
    });
  };
  // Delete
  const handleDelete = (idx) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== idx));
    if (editIndex === idx) handleCancel();
  };

  // Add
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleAdd = (e) => {
    e.preventDefault();
    setRows((prevRows) => [...prevRows, addData]);
    handleCancel();
  };
  const openAddModal = () => {
    setShowAdd(true);
    setAddData({
      Name: "",
      Email: "",
      Password: ""
    });
  };

  return (
    <>
      <DashboardSectionHeader>Manage Admin</DashboardSectionHeader>
      <div className="section-desc">
        Admins can view, add, update, and delete system administrators.
      </div>
      {/* Add Admin Button */}
      <div style={{ display: "flex", justifyContent: "center", margin: "20px 0 0 0" }}>
        <button className="add-supervisor-btn" onClick={openAddModal}>
          + Add Admin
        </button>
      </div>
      <AppTable
        headers={headers}
        rows={rows.map((row) => ({
          ...row,
          Password: "•".repeat(row.Password.length)
        }))}
        renderActions={(row, i) => (
          <>
            <button className="table-action-btn" onClick={() => handleEdit(rows[i], i)}>Edit</button>
            <button className="table-action-btn" style={{ background: "#f43f5e" }} onClick={() => handleDelete(i)}>Delete</button>
          </>
        )}
      />

      {/* Edit Modal */}
      {editIndex !== null && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit Admin</div>
            <form onSubmit={handleUpdate} className="edit-form-grid">
              <div className="form-group">
                <label>Name</label>
                <input name="Name" value={editData.Name} onChange={handleEditChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="Email" value={editData.Email} onChange={handleEditChange} type="email" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input name="Password" value={editData.Password} onChange={handleEditChange} type="password" required />
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
            <div className="modal-title">Add Admin</div>
            <form onSubmit={handleAdd} className="edit-form-grid">
              <div className="form-group">
                <label>Name</label>
                <input name="Name" value={addData.Name} onChange={handleAddChange} type="text" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="Email" value={addData.Email} onChange={handleAddChange} type="email" required />
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
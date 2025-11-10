import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import noticeboardApi from "../Api/NoticeboardApi.jsx";  
import "./Noticeboard.css";

const AUDIENCE = [
  { value: "All", label: "All" },
  { value: "Student", label: "Student" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Coordinator", label: "Coordinator" },
];

const DEPARTMENTS = [
  { value: "All", label: "All departments" },
  { value: "CS", label: "CS — Computer Science" },
  { value: "SE", label: "SE — Software Engineering" },
  { value: "CA", label: "CA — Computer Arts" },
  { value: "CyberSec", label: "CyberSec — Cyber Security" },
];

export default function Noticeboard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); 
  const [editId, setEditId] = useState(null);
  const role = localStorage.getItem('role');
  const [form, setForm] = useState({
    title: "",
    description: "",
    audience: "All",
    department: "All",
    role: role,
  });


  
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const data = await noticeboardApi.getAll();
      setNotices(data);
    } catch (error) {
      console.error("Fetch notices error:", error);
      toastService.error("Failed to load notices");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      audience: "All",
      department: "All",
    });
    setMode(null);
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  
  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toastService.error("Title is required");
    if (!form.description.trim())
      return toastService.error("Description is required");

    setLoading(true);
    try {
      if (mode === "edit" && editId) {
        await noticeboardApi.update(editId, form);
        toastService.success("Notice updated");
      } else {
        await noticeboardApi.create(form);
        toastService.success("Notice posted");
      }
      resetForm();
      fetchNotices(); // reload data
    } catch (err) {
      console.error("Notice post error", err);
      toastService.error("Could not post notice");
    } finally {
      setLoading(false);
    }
  };

 
  const handleEdit = (row) => {
    setMode("edit");
    setEditId(row.__meta._id);
    setForm({
      title: row.Title,
      description: row.__meta.description || "",
      audience: row.__meta.audience || "All",
      department: row.__meta.department || "All",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const handleDelete = async (row) => {
    const ok = await Confirm(`Delete notice "${row.Title}"?`);
    if (!ok) return;
    try {
      await noticeboardApi.remove(row.__meta._id);
      toastService.success("Notice deleted");
      fetchNotices();
    } catch (error) {
      console.error("Delete error:", error);
      toastService.error("Failed to delete notice");
    }
  };

  
  const headers = ["Title", "Target Role", "Date"];
  const rows = notices.map((n) => ({
    Title: n.title,
    "Target Role": n.audience + (n.department ? ` — ${n.department}` : ""),
    Date: new Date(n.createdAt).toLocaleString(),
    __meta: n,
  }));

  const renderActions = (row) => (
    <>
      <button className="table-action-btn" onClick={() => handleEdit(row)}>
        Edit
      </button>
      <button
        className="table-action-btn"
        style={{ background: "#f43f5e" }}
        onClick={() => handleDelete(row)}
      >
        Delete
      </button>
    </>
  );

  return (
    <div className="nb-root">
      <DashboardSectionHeader description="Post important announcements in one centralized space.">
        Noticeboard
      </DashboardSectionHeader>

      <div className="noticeboard-form-outer">
        <form onSubmit={handlePost} className="nb-form">
          <div className="nb-left">
            <div className="nb-row">
              <label>Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter title"
              />
            </div>

            <div className="nb-row">
              <label>Audience</label>
              <select
                name="audience"
                value={form.audience}
                onChange={handleChange}
              >
                {AUDIENCE.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="nb-row">
              <label>Department</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="nb-right">
            <div className="nb-row" style={{ height: "100%" }}>
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter full description or instructions"
                rows={9}
                style={{ height: "100%" }}
              />
            </div>
          </div>

          <div className="nb-actions" style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="mt-btn primary" disabled={loading}>
              {mode === "edit" ? "Update Notice" : "Post Notice"}
            </button>
            <button
              type="button"
              className="mt-btn cancel"
              onClick={resetForm}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Posted notices</label>
        <AppTable headers={headers} rows={rows} renderActions={renderActions} />
      </div>
    </div>
  );
}

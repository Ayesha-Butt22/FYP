import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import "./Noticeboard.css";

const AUDIENCE = [
  { value: "All", label: "All" },
  { value: "Student", label: "Student" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Coordinator", label: "Coordinator" },
];

const DEPARTMENTS = [
  { value: "", label: "All departments (optional)" },
  { value: "CS", label: "CS — Computer Science" },
  { value: "SE", label: "SE — Software Engineering" },
  { value: "CA", label: "CA — Computer Arts" },
];

export default function Noticeboard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // null | 'add' | 'edit'
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    audience: "All",
    department: "",
  });

  useEffect(() => {
    const demo = [
      {
        id: "n-" + Date.now(),
        title: "Semester Deadlines Published",
        description: "Coordinator has published milestone deadlines for Fall 2025.",
        audience: "All",
        department: "",
        createdAt: new Date().toISOString(),
      },
      {
        id: "n-" + (Date.now() + 1),
        title: "Template Updated (Proposal)",
        description: "New proposal template uploaded for SE department.",
        audience: "Coordinator",
        department: "SE",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];
    setNotices(demo);
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      audience: "All",
      department: "",
    });
    setMode(null);
    setEditIndex(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title.trim())
      return toastService.error("Title is required");
    if (!form.description.trim())
      return toastService.error("Description is required");

    setLoading(true);
    try {
      if (mode === "edit" && editIndex != null) {
        const id = notices[editIndex].id;
        const updated = {
          ...notices[editIndex],
          title: form.title,
          description: form.description,
          audience: form.audience,
          department: form.department,
        };
        setNotices((prev) =>
          prev.map((n) => (n.id === id ? updated : n))
        );
        toastService.success("Notice updated");
      } else {
        const newNotice = {
          id: "n-" + Date.now(),
          title: form.title,
          description: form.description,
          audience: form.audience,
          department: form.department,
          createdAt: new Date().toISOString(),
        };
        setNotices((prev) => [newNotice, ...prev]);
        toastService.success("Notice posted");
      }
      resetForm();
    } catch (err) {
      console.error("Notice post error", err);
      toastService.error("Could not post notice");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row, idx) => {
    setMode("edit");
    setEditIndex(idx);
    setForm({
      title: row.Title,
      description: row.__meta.description || "",
      audience: row.__meta.audience || "All",
      department: row.__meta.department || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (row, idx) => {
    const ok = await Confirm(`Delete notice "${row.Title}"?`);
    if (!ok) return;
    setNotices((prev) => prev.filter((_, i) => i !== idx));
    toastService.success("Notice deleted");
  };

  const headers = ["Title", "Target Role", "Date"];
  const rows = notices.map((n) => ({
    Title: n.title,
    "Target Role":
      n.audience + (n.department ? ` — ${n.department}` : ""),
    Date: new Date(n.createdAt).toLocaleString(),
    __meta: n,
  }));

  const renderActions = (row, i) => (
    <>
      <button
        className="table-action-btn"
        onClick={() => handleEdit(row, i)}
      >
        Edit
      </button>
      <button
        className="table-action-btn"
        style={{ background: "#f43f5e" }}
        onClick={() => handleDelete(row, i)}
      >
        Delete
      </button>
    </>
  );

  return (
    <div className="nb-root">
      <DashboardSectionHeader
        description="Post important announcements for Students and Supervisors in one centralized space."
      >
        Noticeboard
      </DashboardSectionHeader>

      <div className="nb-form-card">
        <form onSubmit={handlePost}>
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
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter full description or instructions"
              rows={4}
            />
          </div>

          <div className="nb-row nb-grid">
            <div>
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
            <div>
              <label>Department (optional)</label>
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

          <div className="nb-actions">
            <button
              type="submit"
              className="mt-btn primary"
              disabled={loading}
            >
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
        <h4>Posted notices</h4>
        <AppTable
          headers={headers}
          rows={rows}
          renderActions={renderActions}
        />
      </div>
    </div>
  );
}

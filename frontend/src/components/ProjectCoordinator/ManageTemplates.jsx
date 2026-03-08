import React, { useEffect, useRef, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import "./ManageTemplates.css";

const API_BASE = "http://localhost:5000";

const TEMPLATES = [
  { id: "t01", label: "Template-01: Project Team (MS Word)" },
  { id: "t02", label: "Template-02: Initial Proposal (MS Word)" },
  { id: "t03", label: "Template-03: Proposal Presentation (PowerPoint)" },
  { id: "t04", label: "Template-04: Proposal & Plan (MS Word)" },
  { id: "t05", label: "Template-05: Project Report (MS Word)" },
  { id: "t06", label: "Template-06: Final Presentation (PowerPoint)" },
  { id: "t07", label: "Template-07: Progress Presentation (PowerPoint)" },
];

const DEPARTMENTS = [
  { value: "CS", label: "CS — Computer Science" },
  { value: "SE", label: "SE — Software Engineering" },
  { value: "CA", label: "CA — Computer Arts" },
];

const ALLOWED_EXTS = [".doc", ".docx", ".ppt", ".pptx"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function hasAllowedExtension(filename = "") {
  const n = filename.toLowerCase();
  return ALLOWED_EXTS.some((ext) => n.endsWith(ext));
}

// ─── Token helper ─────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") || "";

// ─── Log activity helper ──────────────────────────────────────────────────────
const logCoordinatorActivity = async (action, description, category) => {
  try {
    await fetch(`${API_BASE}/api/activity/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ action, description, category }),
    });
  } catch (err) {
    console.warn("Activity log failed:", err);
  }
};

export default function ManageTemplates() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [uploadedList, setUploadedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptFilter, setDeptFilter] = useState("All");

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    setLoading(true);
    try {
      const url =
        deptFilter === "All"
          ? `${API_BASE}/api/templates`
          : `${API_BASE}/api/templates?department=${deptFilter}`;

      const res = await fetch(url);

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("GET /api/templates failed:", res.status, txt);
        toastService.error(`Could not load templates (${res.status})`);
        setUploadedList([]);
        return;
      }

      const data = await res.json();

      if (!data || !data.success) {
        console.error("GET /api/templates returned error:", data);
        toastService.error(data?.message || "Could not load templates");
        setUploadedList([]);
        return;
      }

      const list = data.data.map((d) => ({
        id: d._id || d.id,
        template: d.template,
        department: d.department,
        filePath: d.filePath,
        originalName:
          d.originalName || d.fileName || (d.filePath ? d.filePath.split("/").pop() : "file"),
        uploadedAt: d.createdAt || d.uploadedAt || d.created_at,
      }));

      setUploadedList(list);
    } catch (err) {
      console.error("fetchUploadedFiles error", err);
      toastService.error("Could not load templates (network error)");
      setUploadedList([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setSelectedTemplate("");
    setSelectedDept("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setSelectedFile(null);
    if (!f) return;

    if (!hasAllowedExtension(f.name)) {
      toastService.error("Only MS Word (.doc/.docx) or PowerPoint (.ppt/.pptx) files are allowed.");
      e.target.value = "";
      return;
    }

    if (f.size > MAX_SIZE_BYTES) {
      toastService.error("File is too large. Maximum allowed size is 20 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(f);
  };

  const handleSave = async (ev) => {
    ev.preventDefault();

    if (!selectedTemplate) { toastService.error("Please select a template."); return; }
    if (!selectedDept)     { toastService.error("Please select a department."); return; }
    if (!selectedFile)     { toastService.error("Please upload a file before saving."); return; }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("template", selectedTemplate);
    formData.append("department", selectedDept);
    formData.append("uploadedBy", "Coordinator");

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/templates/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let errorMsg = `Upload failed (${res.status})`;
        try { const j = JSON.parse(txt); errorMsg = j.message || errorMsg; } catch {}
        toastService.error(errorMsg);
        return;
      }

      const json = await res.json();
      if (!json || !json.success) {
        toastService.error(json?.message || "Upload failed");
        return;
      }

      await fetchUploadedFiles();
      toastService.success("Template uploaded successfully.");

      // ─── Log activity ───
      const templateLabel =
        TEMPLATES.find((t) => t.id === selectedTemplate)?.label || selectedTemplate;
      await logCoordinatorActivity(
        "Template Uploaded",
        `Template "${templateLabel}" uploaded for ${selectedDept} department`,
        "template"
      );

      setIsOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload API error", err);
      toastService.error("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (meta) => {
    if (!meta || !meta.filePath) { toastService.error("File not available"); return; }

    let url;
    if (meta.filePath.startsWith("http")) {
      url = meta.filePath;
    } else if (meta.filePath.startsWith("/")) {
      url = `${API_BASE}${meta.filePath}`;
    } else {
      url = `${API_BASE}/uploads/templates/${meta.filePath}`;
    }

    window.open(url, "_blank");
  };

  const handleRemove = async (meta) => {
    if (!meta || !meta.id) { toastService.error("No uploaded file found to remove."); return; }

    const ok = await Confirm(`Remove uploaded file "${meta.originalName}" for ${meta.department}?`);
    if (!ok) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/templates/${meta.id}`, { method: "DELETE" });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let errorMsg = `Delete failed (${res.status})`;
        try { const j = JSON.parse(txt); errorMsg = j.message || errorMsg; } catch {}
        toastService.error(errorMsg);
        return;
      }

      const json = await res.json();
      if (!json || !json.success) { toastService.error(json?.message || "Delete failed"); return; }

      await fetchUploadedFiles();
      toastService.success("Uploaded template removed.");

      // ─── Log activity ───
      await logCoordinatorActivity(
        "Template Removed",
        `Template "${meta.originalName}" removed from ${meta.department} department`,
        "template"
      );
    } catch (err) {
      console.error("Delete API error", err);
      toastService.error("Delete failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const headers = ["Template", "Department", "Filename", "Uploaded At"];

  const filteredUploadedList = uploadedList.filter((r) => {
    if (!deptFilter || deptFilter === "All") return true;
    return String(r.department || "").toUpperCase() === String(deptFilter).toUpperCase();
  });

  const rows = filteredUploadedList.map((r) => ({
    Template: TEMPLATES.find((t) => t.id === r.template)?.label || r.template,
    Department: r.department,
    Filename: r.originalName,
    "Uploaded At": r.uploadedAt ? new Date(r.uploadedAt).toLocaleString() : "—",
    __meta: r,
  }));

  const renderActions = (row) => {
    const meta = row.__meta;
    return (
      <div className="render-actions-btn">
        <button className="table-action-btn" onClick={() => handleDownload(meta)}>Download</button>
        <button className="table-action-btn" style={{ background: "#f43f5e" }} onClick={() => handleRemove(meta)}>Remove</button>
      </div>
    );
  };

  const clearFilters = () => { setDeptFilter("All"); fetchUploadedFiles(); };

  return (
    <div className="mt-root">
      <DashboardSectionHeader description={"Here you can upload templates for each department so students can easily download them through their portal."}>
        Manage Templates
      </DashboardSectionHeader>

      <div className="mt-toolbar">
        <button className="mt-primary" onClick={openModal} disabled={loading}>Upload Template</button>
      </div>

      {loading && <div style={{ color: "#666", marginBottom: 8 }}>Loading…</div>}

      <div className="st-controls" style={{ marginTop: 8, marginBottom: 12 }}>
        <div className="st-filter">
          <label>Department</label>
          <select className="st-dept-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="SE">SE</option>
            <option value="CS">CS</option>
            <option value="CA">CA</option>
          </select>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="st-clear-btn" onClick={clearFilters}>Clear filters</button>
        </div>
      </div>

      <div className="mt-list">
        <h4>Uploaded templates</h4>
        <AppTable headers={headers} rows={rows} renderActions={renderActions} />
      </div>

      {isOpen && (
        <div className="mt-modal-backdrop" role="dialog" aria-modal="true">
          <form className="mt-modal" onSubmit={handleSave}>
            <h3 className="mt-modal-title">Select Template</h3>

            <div className="mt-field">
              <label>Template</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} required>
                <option value="">-- choose template --</option>
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div className="mt-field">
              <label>Department</label>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} required>
                <option value="">-- choose department --</option>
                {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            <div className="mt-field">
              <label>Upload file</label>
              <input ref={fileInputRef} type="file" accept={ALLOWED_EXTS.join(",")} onChange={onFileChange} required />
              <small className="mt-hint">Allowed: {ALLOWED_EXTS.join(", ")} — max 20 MB</small>
            </div>

            <div className="mt-modal-actions">
              <button type="button" className="mt-btn cancel" onClick={closeModal} disabled={loading}>Cancel</button>
              <button type="submit" className="mt-btn primary" disabled={loading || !selectedFile}>Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
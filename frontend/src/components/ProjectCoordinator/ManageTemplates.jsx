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
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function hasAllowedExtension(filename = "") {
  const n = filename.toLowerCase();
  return ALLOWED_EXTS.some((ext) => n.endsWith(ext));
}

export default function ManageTemplates() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // uploadedList: array of { id, template, department, filePath, originalName, uploadedAt }
  const [uploadedList, setUploadedList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/files`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("GET /api/files failed:", res.status, txt);
        toastService.error(`Could not load uploaded templates (${res.status})`);
        setUploadedList([]);
        return;
      }
      const data = await res.json();
      if (!data || !data.success) {
        console.error("GET /api/files returned error:", data);
        toastService.error("Could not load uploaded templates");
        setUploadedList([]);
        return;
      }
      const list = data.data.map((d) => ({
        id: d._id || d.id,
        template: d.template,
        department: d.department,
        filePath: d.filePath,
        originalName: d.originalName || d.fileName || (d.filePath ? d.filePath.split("/").pop() : "file"),
        uploadedAt: d.uploadedAt || d.createdAt || d.created_at,
      }));
      setUploadedList(list);
    } catch (err) {
      console.error("fetchUploadedFiles error", err);
      toastService.error("Could not load uploaded templates (network error)");
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

    if (!selectedTemplate) {
      toastService.error("Please select a template.");
      return;
    }
    if (!selectedDept) {
      toastService.error("Please select a department.");
      return;
    }
    if (!selectedFile) {
      toastService.error("Please upload a file before saving.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("template", selectedTemplate);
    formData.append("department", selectedDept);

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("POST /api/files/upload failed:", res.status, txt);
        toastService.error(`Upload failed (${res.status})`);
        return;
      }

      const json = await res.json();
      if (!json || !json.success) {
        console.error("upload returned error:", json);
        toastService.error(json?.message || "Upload failed");
        return;
      }

      // refresh from server to ensure consistent state
      await fetchUploadedFiles();

      toastService.success("Template uploaded successfully.");
      setIsOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("upload API error", err);
      toastService.error("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (meta) => {
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = meta.filePath.startsWith("http") ? meta.filePath : (API_BASE ? API_BASE + meta.filePath : window.location.origin + meta.filePath);
    window.open(url, "_blank");
  };

  const handleRemove = async (meta) => {
    if (!meta || !meta.id) {
      toastService.error("No uploaded file found to remove.");
      return;
    }

    const ok = await Confirm(`Remove uploaded file "${meta.originalName}" for ${meta.department}?`);
    if (!ok) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/files/${meta.id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("DELETE /api/files/:id failed", res.status, txt);
        toastService.error(`Delete failed (${res.status})`);
        return;
      }
      const json = await res.json();
      if (!json || !json.success) {
        toastService.error(json?.message || "Delete failed");
        return;
      }
      // refresh
      await fetchUploadedFiles();
      toastService.success("Uploaded template removed.");
    } catch (err) {
      console.error("delete API error", err);
      toastService.error("Delete failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare rows for AppTable
  const headers = ["Template", "Department", "Filename", "Uploaded At"];
  const rows = uploadedList.map((r) => ({
    Template: TEMPLATES.find((t) => t.id === r.template)?.label || r.template,
    Department: r.department,
    Filename: r.originalName,
    "Uploaded At": r.uploadedAt ? new Date(r.uploadedAt).toLocaleString() : "—",
    __meta: r,
  }));

  const renderActions = (row) => {
    const meta = row.__meta;
    return (

      <>
      <div className = "render-actions-btn">
        <button className="table-action-btn" onClick={() => handleDownload(meta)}>Download</button>
        <button className="table-action-btn" style={{ background: "#f43f5e" }} onClick={() => handleRemove(meta)}>Remove</button>
        </div>
      </>
    );
  };

  return (
    <div className="mt-root">
      <DashboardSectionHeader description={"Here you can upload templates for each department so students can easily download them through their portal."}>
        Manage Templates
      </DashboardSectionHeader>

      <div className="mt-toolbar">
        <button className="mt-primary" onClick={openModal} disabled={loading}>
          Upload Template
        </button>
      </div>

      {loading && <div style={{ color: "#666", marginBottom: 8 }}>Loading…</div>}

      <div className="mt-list">
        <h4>Uploaded templates</h4>
        <div>
          <AppTable headers={headers} rows={rows} renderActions={renderActions} />
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="mt-modal-backdrop" role="dialog" aria-modal="true">
          <form className="mt-modal" onSubmit={handleSave}>
            <h3 className="mt-modal-title">Select Template</h3>

            <div className="mt-field">
              <label>Template</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} required>
                <option value="">-- choose template --</option>
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-field">
              <label>Department</label>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} required>
                <option value="">-- choose department --</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
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
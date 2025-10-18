import React, { useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import "./ManageTemplates.css";

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

  // uploaded structure: { templateId: { deptCode: { fileName, fileUrl, uploadedAt, department } } }
  const [uploaded, setUploaded] = useState({});

  const openModal = () => {
    setSelectedTemplate("");
    setSelectedDept("");
    setSelectedFile(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
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
    if (!hasAllowedExtension(selectedFile.name)) {
      toastService.error("Only MS Word (.doc/.docx) or PowerPoint (.ppt/.pptx) files are allowed.");
      return;
    }

    try {
      // demo upload: create object URL; replace with real API call when available
      const url = URL.createObjectURL(selectedFile);
      const now = new Date().toISOString();

      setUploaded((prev) => {
        const copy = { ...(prev || {}) };
        if (!copy[selectedTemplate]) copy[selectedTemplate] = {};
        copy[selectedTemplate][selectedDept] = {
          fileName: selectedFile.name,
          fileUrl: url,
          uploadedAt: now,
          department: selectedDept,
          templateLabel: TEMPLATES.find((t) => t.id === selectedTemplate)?.label || selectedTemplate,
        };
        return copy;
      });

      toastService.success("Template uploaded successfully.");
      setIsOpen(false);
    } catch (err) {
      console.error("upload error", err);
      toastService.error("Upload failed. Try again.");
    }
  };

  const handleDownload = (templateId, dept) => {
    const entry = uploaded?.[templateId]?.[dept];
    if (!entry) {
      toastService.error("No uploaded file found.");
      return;
    }
    const a = document.createElement("a");
    a.href = entry.fileUrl;
    a.download = entry.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleRemove = async (templateId, dept) => {
    const entry = uploaded?.[templateId]?.[dept];
    if (!entry) {
      toastService.error("No uploaded file found to remove.");
      return;
    }

    const ok = await Confirm(`Remove uploaded file "${entry.fileName}" for ${dept}?`);
    if (!ok) return;

    try {
      URL.revokeObjectURL(entry.fileUrl);
    } catch (e) {
      /* ignore */
    }

    setUploaded((prev) => {
      const copy = { ...(prev || {}) };
      if (copy[templateId] && copy[templateId][dept]) {
        delete copy[templateId][dept];
        if (Object.keys(copy[templateId]).length === 0) delete copy[templateId];
      }
      return copy;
    });

    toastService.success("Uploaded template removed.");
  };

  // Build a flat list of only uploaded entries to render (user requested: show only uploaded rows)
  const uploadedList = [];
  Object.keys(uploaded).forEach((templateId) => {
    const map = uploaded[templateId];
    if (!map) return;
    Object.keys(map).forEach((dept) => {
      const e = map[dept];
      uploadedList.push({
        templateId,
        templateLabel: e.templateLabel || (TEMPLATES.find((t) => t.id === templateId)?.label || templateId),
        department: dept,
        fileName: e.fileName,
        fileUrl: e.fileUrl,
        uploadedAt: e.uploadedAt,
      });
    });
  });

  const hasUploads = uploadedList.length > 0;

  return (
    <div className="mt-root">
      <DashboardSectionHeader>Manage Templates</DashboardSectionHeader>

      <div className="mt-desc">
        Here you can upload templates for each department so students can easily download them through their portal.
      </div>

      <div className="mt-toolbar">
        <button className="mt-primary" onClick={openModal}>
          Upload Template
        </button>
      </div>

      {/* Render table only when there are uploaded entries.
          NOTE: only uploaded rows are shown (user request). */}
      {hasUploads && (
        <div className="mt-list">
          <h4>Uploaded templates</h4>
          <div className="mt-table">
            <div className="mt-table-head">
              <div>Template</div>
              <div>Department</div>
              <div>Filename</div>
              <div>Uploaded At</div>
              <div>Action</div>
            </div>

            <div className="mt-table-body">
              {uploadedList.map((row) => (
                <div className="mt-row" key={`${row.templateId}_${row.department}`}>
                  <div>{row.templateLabel}</div>
                  <div>{row.department}</div>
                  <div>{row.fileName}</div>
                  <div>{new Date(row.uploadedAt).toLocaleString()}</div>
                  <div>
                    <button className="mt-btn" onClick={() => handleDownload(row.templateId, row.department)}>Download</button>
                    <button className="mt-btn danger" onClick={() => handleRemove(row.templateId, row.department)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Modal */}
      {isOpen && (
        <div className="mt-modal-backdrop" role="dialog" aria-modal="true">
          <form className="mt-modal" onSubmit={handleSave}>
            <h3 className="mt-modal-title">Select Template</h3>

            <div className="mt-field">
              <label>Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                required
              >
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
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                required
              >
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
              <input
                type="file"
                accept={ALLOWED_EXTS.join(",")}
                onChange={onFileChange}
                required
              />
              <small className="mt-hint">Allowed: {ALLOWED_EXTS.join(", ")} — max 20 MB</small>
            </div>

            <div className="mt-modal-actions">
              <button type="button" className="mt-btn cancel" onClick={closeModal}>Cancel</button>
              <button type="submit" className="mt-btn primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
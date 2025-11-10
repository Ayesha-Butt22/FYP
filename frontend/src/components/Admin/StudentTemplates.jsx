import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService";
import "./StudentTemplates.css";

let TemplateService = null;
try {
  TemplateService = require("../ProjectCoordinatorApi/TemplateService.jsx").default;
} catch (e) {
  TemplateService = null;
}

const MOCK_FILES = [
  {
    _id: "m1",
    template: "t03",
    templateLabel: "Template-03: Proposal Presentation (PowerPoint)",
    department: "SE",
    filePath: "/Filesk/mock-proposal-1.docx",
    originalName: "mock-proposal-1.docx",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "m2",
    template: "t03",
    templateLabel: "Template-03: Proposal Presentation (PowerPoint)",
    department: "SE",
    filePath: "/Filesk/mock-proposal-2.docx",
    originalName: "mock-proposal-2.docx",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "m3",
    template: "t01",
    templateLabel: "Template-01: Project Team (MS Word)",
    department: "CS",
    filePath: "/Filesk/mock-team.docx",
    originalName: "mock-team.docx",
    createdAt: new Date().toISOString(),
  },
];

export default function StudentTemplates() {
  const [allFiles, setAllFiles] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  
  const DEPARTMENTS = ["All", "SE", "CS", "CA"];
  const [selectedDept, setSelectedDept] = useState("All");

  const headers = ["Template", "Department", "Filename", "Uploaded At"];

  useEffect(() => {
    loadTemplates();
  
  }, []);

  useEffect(() => {
    applyFilters();

  }, [allFiles, selectedDept]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let files = [];
      if (TemplateService && typeof TemplateService.getFiles === "function") {
        files = await TemplateService.getFiles();
      } else {
        files = MOCK_FILES;
      }

      const normalized = files.map((f) => ({
        id: f._id || f.id,
        templateLabel: f.templateLabel || f.template || "Template",
        department: f.department || "",
        filename: f.originalName || f.fileName || (f.filePath ? f.filePath.split("/").pop() : ""),
        filePath: f.filePath,
        uploadedAt: f.uploadedAt || f.createdAt || f.created_at || "",
        __raw: f,
      }));
      setAllFiles(normalized);
    } catch (err) {
      console.error("Could not load templates", err);
      toastService.error("Could not load templates: " + (err.message || ""));
      setAllFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const buildFileUrl = (filePath) => {
    if (TemplateService && typeof TemplateService.buildFileUrl === "function") {
      return TemplateService.buildFileUrl(filePath);
    }
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    return window.location.origin + filePath;
  };

  const handleView = (row) => {
    const meta = row.__meta || row;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = buildFileUrl(meta.filePath);
    window.open(url, "_blank");
  };

  const handleDownload = (row) => {
    const meta = row.__meta || row;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = buildFileUrl(meta.filePath);
    const a = document.createElement("a");
    a.href = url;
    const filename = row.Filename || meta.filename || url.split("/").pop();
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  function applyFilters() {
    const filtered = allFiles.filter((f) => {
      if (selectedDept && selectedDept !== "All" && f.department !== selectedDept) return false;
      return true;
    });

    const tableRows = filtered.map((f) => ({
      Template: f.templateLabel,
      Department: f.department,
      Filename: f.filename,
      "Uploaded At": f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : "—",
      __meta: f,
    }));
    setRows(tableRows);
  }

  // AppTable action renderer
  const renderActions = (row) => {
    const meta = row.__meta || row;
    return (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <button className="mt-btn" onClick={() => handleView(row)} title="View" style={{ background: "#0b5ed7" }}>
          View
        </button>
        <button className="mt-btn" onClick={() => handleDownload(row)} title="Download" style={{ background: "#2563eb" }}>
          Download
        </button>
      </Box>
    );
  };

  const clearFilters = () => {
    setSelectedDept("All");
  };

  return (
    <Box sx={{ pb: 3 }}>
      <DashboardSectionHeader description={"Here you can view the templates provided by the department and download them."}>
        View Templates
      </DashboardSectionHeader>

      <Box className="st-controls">
        <div className="st-filter">
          <label>Department</label>
          <select className="st-dept-select" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="st-clear-btn" onClick={clearFilters}>Clear filters</button>
        </div>
      </Box>

      {loading ? (
        <div className="st-loading">Loading templates…</div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <AppTable headers={headers} rows={rows} renderActions={renderActions} />
          {rows.length === 0 && <div className="st-empty">No templates found for the selected department.</div>}
        </div>
      )}
    </Box>
  );
}
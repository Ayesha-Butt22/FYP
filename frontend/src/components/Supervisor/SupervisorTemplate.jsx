import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import AppTable from "./AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorTemplates.css";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000");

const TEMPLATES = [
  { id: "t01", label: "Template-01: Project Team (MS Word)" },
  { id: "t02", label: "Template-02: Initial Proposal (MS Word)" },
  { id: "t03", label: "Template-03: Proposal Presentation (PowerPoint)" },
  { id: "t04", label: "Template-04: Proposal & Plan (MS Word)" },
  { id: "t05", label: "Template-05: Project Report (MS Word)" },
  { id: "t06", label: "Template-06: Final Presentation (PowerPoint)" },
  { id: "t07", label: "Template-07: Progress Presentation (PowerPoint)" },
];

export default function SupervisorTemplates() {
  const [allFiles, setAllFiles] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const supervisorDept = localStorage.getItem("department") || "SE";

  // Manage Templates jaisa filter
  const DEPARTMENTS = ["All", "SE", "CS", "AI", "IT", "CY"];

  // Default supervisor ki apni dept selected hogi
  const [selectedDept, setSelectedDept] = useState(supervisorDept);

  const headers = [
    "Template",
    "Department",
    "Filename",
    "Uploaded At",
    "Uploaded By",
  ];

  useEffect(() => {
    loadTemplates();
  }, [selectedDept]);

  const loadTemplates = async () => {
    setLoading(true);

    try {
      const url =
        selectedDept === "All"
          ? `${API_BASE}/api/templates`
          : `${API_BASE}/api/templates?department=${selectedDept}`;

      const res = await fetch(url);

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("GET /api/templates failed:", res.status, txt);
        toastService.error(`Could not load templates (${res.status})`);
        setAllFiles([]);
        return;
      }

      const data = await res.json();

      if (!data || !data.success) {
        console.error("GET /api/templates returned error:", data);
        toastService.error(data?.message || "Could not load templates");
        setAllFiles([]);
        return;
      }

      const normalized = data.data.map((f) => ({
        id: f._id || f.id,
        templateLabel:
          TEMPLATES.find((t) => t.id === f.template)?.label ||
          f.template ||
          "Template",

        department: f.department || "",

        filename:
          f.originalName ||
          f.fileName ||
          (f.filePath ? f.filePath.split("/").pop() : ""),

        filePath: f.filePath,

        uploadedAt:
          f.createdAt ||
          f.uploadedAt ||
          f.created_at ||
          "",

        uploadedBy:
          f.uploadedBy ||
          "Coordinator",

        __raw: f,
      }));

      setAllFiles(normalized);
      applyFilters(normalized);

    } catch (err) {
      console.error("Could not load templates", err);
      toastService.error(
        "Could not load templates: " + (err.message || "")
      );
      setAllFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const buildFileUrl = (filePath) => {
    if (!filePath) return "";

    if (filePath.startsWith("http")) return filePath;

    if (filePath.startsWith("/")) {
      return `${API_BASE}${filePath}`;
    }

    return `${API_BASE}/uploads/templates/${filePath}`;
  };

  const handleDownload = (row) => {
    const meta = row.__meta || row;

    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }

    const url = buildFileUrl(meta.filePath);

    const filename =
      row.Filename ||
      meta.filename ||
      url.split("/").pop();

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toastService.success(`Downloading "${filename}"...`);
  };

  function applyFilters(files) {
    const filtered = files.filter((f) => {
      if (
        selectedDept &&
        selectedDept !== "All" &&
        f.department !== selectedDept
      ) {
        return false;
      }

      return true;
    });

    const tableRows = filtered.map((f) => ({
      Template: f.templateLabel,
      Department: f.department,
      Filename: f.filename,
      "Uploaded At": f.uploadedAt
        ? new Date(f.uploadedAt).toLocaleString()
        : "—",
      "Uploaded By": f.uploadedBy || "Coordinator",
      __meta: f,
    }));

    setRows(tableRows);
  }

  const renderActions = (row) => {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
        }}
      >
        <button
          className="mt-btn"
          onClick={() => handleDownload(row)}
          title="Download template"
          style={{ background: "#2563eb" }}
        >
          Download
        </button>
      </Box>
    );
  };

  const clearFilters = () => {
    setSelectedDept("All");
  };

  const refreshTemplates = () => {
    loadTemplates();
  };

  return (
    <Box sx={{ pb: 3 }}>
      <DashboardSectionHeader
        description={
          "Here you can view all templates uploaded by coordinators for different departments."
        }
      >
        View All Templates
      </DashboardSectionHeader>

      {/* FILTER SECTION */}
      <Box className="st-controls" sx={{ mb: 2 }}>
        <div className="st-filter">
          <label>Filter by Department</label>

          <select
            className="st-dept-select"
            value={selectedDept}
            onChange={(e) =>
              setSelectedDept(e.target.value)
            }
            disabled={loading}
          >
            {DEPARTMENTS.map((d) => (
              <option
                key={d}
                value={d}
              >
                {d}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
          }}
        >
          <button
            className="st-clear-btn"
            onClick={clearFilters}
            disabled={loading}
          >
            Clear Filter
          </button>

          <button
            className="st-clear-btn"
            onClick={refreshTemplates}
            disabled={loading}
            title="Refresh templates"
          >
            ↻ Refresh
          </button>
        </div>
      </Box>

      {loading ? (
        <div className="st-loading">
          Loading templates…
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {rows.length === 0 ? (
            <div className="st-empty">
              No templates found{" "}
              {selectedDept !== "All"
                ? `for ${selectedDept} department`
                : ""}.
            </div>
          ) : (
            <AppTable
              headers={headers}
              rows={rows}
              renderActions={renderActions}
            />
          )}
        </div>
      )}
    </Box>
  );
}
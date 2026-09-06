import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService";
import "./StudentTemplates.css";

// API BASE URL
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000");

// Template types mapping
const TEMPLATES = [
  { id: "t01", label: "Template-01: Project Team (MS Word)" },
  { id: "t02", label: "Template-02: Initial Proposal (MS Word)" },
  { id: "t03", label: "Template-03: Proposal Presentation (PowerPoint)" },
  { id: "t04", label: "Template-04: Proposal & Plan (MS Word)" },
  { id: "t05", label: "Template-05: Project Report (MS Word)" },
  { id: "t06", label: "Template-06: Final Presentation (PowerPoint)" },
  { id: "t07", label: "Template-07: Progress Presentation (PowerPoint)" },
];

export default function StudentTemplates() {
  const [templates, setTemplates] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Student ka department nikalo
  const getStudentDepartment = () => {
    const storedDept = localStorage.getItem("department") || 
                      localStorage.getItem("dept") || 
                      localStorage.getItem("departmentCode") || 
                      localStorage.getItem("userDepartment") ||
                      localStorage.getItem("department_code") || 
                      "SE"; // Default agar na mile
    return storedDept.toUpperCase(); // Ensure uppercase
  };

  const studentDept = getStudentDepartment();

  const headers = ["Template", "Department", "Filename", "Uploaded At"];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Sirf student ke department ke templates fetch karo
      const url = `${API_BASE}/api/templates?department=${studentDept}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("GET /api/templates failed:", res.status, txt);
        toastService.error(`Could not load templates (${res.status})`);
        setTemplates([]);
        return;
      }
      
      const data = await res.json();
      
      if (!data || !data.success) {
        console.error("GET /api/templates returned error:", data);
        toastService.error(data?.message || "Could not load templates");
        setTemplates([]);
        return;
      }
      
      setTemplates(data.data);
      prepareTableRows(data.data);
      
    } catch (err) {
      console.error("loadTemplates error", err);
      toastService.error("Could not load templates (network error)");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const prepareTableRows = (templatesList) => {
    const tableRows = templatesList.map((template) => ({
      Template: TEMPLATES.find(t => t.id === template.template)?.label || template.template,
      Department: template.department,
      Filename: template.originalName,
      "Uploaded At": template.createdAt ? new Date(template.createdAt).toLocaleString() : "—",
      __meta: template,
    }));
    
    setRows(tableRows);
  };

  const buildFileUrl = (filePath) => {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    
    // Backend ka correct URL build karo
    if (filePath.startsWith("/")) {
      return `${API_BASE}${filePath}`;
    } else {
      return `${API_BASE}/uploads/templates/${filePath}`;
    }
  };

  const handleDownload = (row) => {
    const meta = row.__meta;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    
    // DOWNLOAD: Force download
    const url = buildFileUrl(meta.filePath);
    const filename = row.Filename || meta.originalName || url.split("/").pop();
    
    // Create invisible anchor tag for download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Set download attribute for force download
    link.setAttribute('download', filename);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Success message
    toastService.success(`Downloading "${filename}"...`);
  };

  const renderActions = (row) => {
    const meta = row.__meta;
    return (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "left" }}>
        <button 
          className="mt-btn" 
          onClick={() => handleDownload(row)} 
          title="Download file"
          style={{ background: "#2563eb" }}
        >
          Download
        </button>
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 3 }}>
      <DashboardSectionHeader 
        description={`Here you can view and download the templates provided by your Project Coordinator.`}
      >
        View Templates
      </DashboardSectionHeader>

      {/* Empty State Message (only when no templates) */}
      {templates.length === 0 && !loading && (
        <div style={{ 
          marginBottom: "16px",
          padding: "8px 16px",
          background: "#f9fafb",
          borderRadius: "8px",
          border: "1px dashed #d1d5db",
          color: "#6b7280",
          fontSize: "14px"
        }}>
          No templates available for {studentDept} department.
        </div>
      )}

      {loading ? (
        <div className="st-loading">Loading templates…</div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {templates.length === 0 ? (
            <div style={{ height: "200px" }}></div> // Spacer for empty state
          ) : (
            <AppTable headers={headers} rows={rows} renderActions={renderActions} />
          )}
        </div>
      )}
    </Box>
  );
}
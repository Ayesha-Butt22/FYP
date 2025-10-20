import React, { useEffect, useState } from "react";
import { Box } from "@mui/material"; // Only Box is needed now
import { toastService } from "../ToastService/ToastService";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";

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
    department: "SE",
    filePath: "/Filesk/mock-team.docx",
    originalName: "mock-team.docx",
    createdAt: new Date().toISOString(),
  },
];

export default function StudentTemplates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = ["Template", "Department", "Filename", "Uploaded At"];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let files = [];
      if (TemplateService && typeof TemplateService.getFiles === "function") {
        files = await TemplateService.getFiles();
      } else {
        files = MOCK_FILES;
      }

      const tableRows = files.map((f) => {
        const filename = f.originalName || f.fileName || (f.filePath ? f.filePath.split("/").pop() : "");
        const uploadedAt = f.uploadedAt || f.createdAt || f.created_at || "";
        return {
          Template: f.templateLabel || f.template || "Template",
          Department: f.department || "",
          Filename: filename,
          "Uploaded At": uploadedAt ? new Date(uploadedAt).toLocaleString() : "",
          __meta: f,
        };
      });
      setRows(tableRows);
    } catch (err) {
      console.error("Could not load templates", err);
      toastService.error("Could not load templates: " + (err.message || ""));
      setRows([]);
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
    const meta = row.__meta;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = buildFileUrl(meta.filePath);
    window.open(url, "_blank");
  };

  const handleDownload = (row) => {
    const meta = row.__meta;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = buildFileUrl(meta.filePath);
    const a = document.createElement("a");
    a.href = url;
    const filename = row.Filename || url.split("/").pop();
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const renderActions = (row) => (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
      <button className="mt-btn" onClick={() => handleView(row)} title="View" style={{ background: "#0b5ed7" }}>
        View
      </button>
      <button className="mt-btn" onClick={() => handleDownload(row)} title="Download" style={{ background: "#2563eb" }}>
        Download
      </button>
    </Box>
  );

  return (
    <Box sx={{ pb: 3 }}>
     

      <DashboardSectionHeader description={"Here you can view the templates provided by the department and download them."}>View Templates</DashboardSectionHeader>
                
      <AppTable headers={headers} rows={rows} renderActions={renderActions} loading={loading} />
    </Box>
  );
}

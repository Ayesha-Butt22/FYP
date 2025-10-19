import React, { useEffect, useState } from "react";
import { toastService } from "../ToastService/ToastService";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";

/**
 * StudentTemplates (standalone / frontend-only)
 *
 * Behavior:
 * - If TemplateService is available at ../ProjectCoordinatorApi/TemplateService.jsx it will be used.
 * - Otherwise a mock dataset is used so the UI works without a backend.
 *
 * To enable real backend later:
 * - Create src/components/ProjectCoordinatorApi/TemplateService.jsx (as we discussed earlier)
 * - Ensure it exports default with getFiles() and buildFileUrl(filePath)
 * - The component will automatically use it.
 */

let TemplateService = null;
try {
  // try to import TemplateService if it exists
  // eslint-disable-next-line import/no-unresolved, global-require
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let files = [];
      if (TemplateService && typeof TemplateService.getFiles === "function") {
        // use real API service if available
        files = await TemplateService.getFiles();
      } else {
        // no backend/service available -> use mock data (frontend-only mode)
        files = MOCK_FILES;
      }

      // Map DB records to AppTable-friendly rows (object keyed by header text)
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
    // frontend-only: use relative path so dev server can serve /public/Filesk/... if you place mocks there
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
    // Open in new tab for viewing
    window.open(url, "_blank");
  };

  const handleDownload = (row) => {
    const meta = row.__meta;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = buildFileUrl(meta.filePath);
    // Force download
    const a = document.createElement("a");
    a.href = url;
    // use filename if available
    const filename = row.Filename || url.split("/").pop();
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const renderActions = (row) => (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="mt-btn" onClick={() => handleView(row)} title="View" style={{ background: "#0b5ed7" }}>
        View
      </button>
      <button className="mt-btn" onClick={() => handleDownload(row)} title="Download" style={{ background: "#2563eb" }}>
        Download
      </button>
    </div>
  );

  return (
    <div style={{ paddingBottom: 18 }}>
      <DashboardSectionHeader>View templates</DashboardSectionHeader>

      <div style={{ color: "#01337a", fontSize: "1rem", marginBottom: 12 }}>
        Here you can view your templates provided by the department and you can also download them.
      </div>

      <AppTable headers={headers} rows={rows} renderActions={renderActions} />
    </div>
  );
}
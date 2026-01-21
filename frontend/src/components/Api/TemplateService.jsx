import axios from "axios";

const API_BASE = "http://localhost:5000/api/student-templates";

export default class TemplateService {
  // ---------------- UPLOAD FILE ----------------
  static async uploadFile(templateCode, dept, file, groupId, studentId, templateLabel, week) {
    if (!groupId || !studentId) {
      throw new Error("Group ID and Student ID are required for upload.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("templateCode", templateCode);
    formData.append("templateLabel", templateLabel);
    formData.append("groupId", groupId);
    formData.append("studentId", studentId);
    formData.append("week", week);
    formData.append("department", dept);

    const res = await axios.post(`${API_BASE}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  // ---------------- GET FILES BY GROUP ----------------
  static async getFiles(groupId) {
    if (!groupId) return [];
    const res = await axios.get(`${API_BASE}/group/${groupId}`);
    return res.data.success ? res.data.data : [];
  }

  // ---------------- BUILD FILE URL ----------------
  static buildFileUrl(filePath) {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    return window.location.origin + "/" + filePath;
  }
}

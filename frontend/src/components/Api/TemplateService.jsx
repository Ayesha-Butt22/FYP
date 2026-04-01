// TemplateService.jsx
import axios from "axios";

const API_BASE = "http://localhost:5000/api/student-templates";

export default class TemplateService {
  // ---------------- UPLOAD FILE ----------------
  static async uploadFile(templateCode, file, studentId, week, fypPart) {
    if (!studentId) throw new Error("Student ID is required.");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("templateCode", templateCode);
    formData.append("studentId", studentId);
    formData.append("week", week);
    formData.append("fypPart", fypPart);

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

  // ---------------- GET STUDENT INFO ----------------
  static async getStudentInfo(studentId) {
    if (!studentId) throw new Error("Student ID is required.");
    const res = await axios.get(`${API_BASE}/students/${studentId}`);
    return res.data.success ? res.data.data : null;
  }

  // ---------------- BUILD FILE URL ----------------
  static buildFileUrl(filePath) {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    return window.location.origin + "/" + filePath;
  }
}

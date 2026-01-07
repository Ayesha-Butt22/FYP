// ProjectIdeasService.jsx
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const projectIdeasService = {

  // ✅ Get all ideas by supervisor
  getIdeas: async (supervisorEmail) => {
    try {
      const res = await axios.get(
        `${API_BASE}/project-ideas/supervisor/${supervisorEmail}`
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("getIdeas Error:", error);
      return { success: false, data: error.response?.data };
    }
  },

  // ✅ Create idea
  createIdea: async (supervisorEmail, title) => {
    try {
      const res = await axios.post(`${API_BASE}/project-ideas`, {
        supervisorEmail,
        title,
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("createIdea Error:", error);
      return { success: false, data: error.response?.data };
    }
  },

  // ✅ Delete idea
  deleteIdea: async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/project-ideas/${id}`);
      return { success: true };
    } catch (error) {
      console.error("deleteIdea Error:", error);
      return { success: false };
    }
  },
};

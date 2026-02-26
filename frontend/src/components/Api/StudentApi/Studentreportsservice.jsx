// Add to Api/TemplateService.jsx or create StudentReportsService.jsx

const API_BASE = "http://localhost:5000/api";

const StudentReportsService = {
  // Get student's feedback from supervisor
  getStudentFeedback: async (studentId) => {
    const res = await fetch(`${API_BASE}/student/feedback/${studentId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch feedback");
    return res.json();
  },

  // Alternative: Get feedback by email
  getFeedbackByEmail: async (email) => {
    const res = await fetch(`${API_BASE}/student/feedback/by-email/${email}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch feedback");
    return res.json();
  }
};

export default StudentReportsService;
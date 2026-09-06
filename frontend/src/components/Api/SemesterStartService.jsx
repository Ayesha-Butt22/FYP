//components/Api/SemesterStartService.js
const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/semester-start`;

const SemesterStartService = {
  async getDate() {
    const res = await fetch(API);
    return res.json();
  },

  async updateDate(date) {
    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    return res.json();
  },
};

export default SemesterStartService;

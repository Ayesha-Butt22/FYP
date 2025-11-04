// src/Api/PresentationService.jsx
const API_BASE_URL = "http://localhost:5000/api/deadlineSchedule";

const PresentationService = {
  async getPresentation(week, fypPart) {
    const res = await fetch(`${API_BASE_URL}/get?week=${encodeURIComponent(week)}&fypPart=${encodeURIComponent(fypPart)}`);
    if (!res.ok) throw new Error("Failed to fetch presentation schedule");
    return res.json();
  },

  async createOrUpdate(payload) {
    const res = await fetch(`${API_BASE_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save presentation schedule");
    return res.json();
  },

  async createBatch(payload) {
    const res = await fetch(`${API_BASE_URL}/createBatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create batch schedule");
    return res.json();
  },

  async publishSchedule(id) {
    const res = await fetch(`${API_BASE_URL}/publish/${id}`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to publish schedule");
    return res.json();
  },

  async getFaculty() {
    const res = await fetch(`${API_BASE_URL}/getfaculty`);
    if (!res.ok) throw new Error("Failed to fetch faculty list");
    return res.json();
  },

  async bookSlot({ scheduleId, slotId, groupId }) {
    const res = await fetch(`${API_BASE_URL}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, slotId, groupId }),
    });
    if (!res.ok) throw new Error("Failed to book slot");
    return res.json();
  },

  async getSlotsForEmail(email) {
    const res = await fetch(`${API_BASE_URL}/getSlots/${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Failed to fetch slots for email");
    return res.json();
  },
};

export default PresentationService;

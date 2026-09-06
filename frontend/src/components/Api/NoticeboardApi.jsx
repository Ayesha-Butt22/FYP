const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/noticeboard`;

const noticeboardApi = {
  async getAll() {
    const res = await fetch(API_BASE_URL);
    if (!res.ok) throw new Error("Failed to fetch notices");
    const json = await res.json();
    return json.data;
  },

  async create(payload) {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create notice");
    return res.json();
  },

  async update(id, payload) {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update notice");
    return res.json();
  },

  async remove(id) {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete notice");
    return res.json();
  },
};

export default noticeboardApi;

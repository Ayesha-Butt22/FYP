const API_BASE_URL = "http://localhost:5000/api/deadlineSchedule";

const PresentationService = {
    async getPresentation(week, fypPart) {
        const res = await fetch(`${API_BASE_URL}/get?week=${week}&fypPart=${fypPart}`);
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
    return res.json();
  },


    async bookSlot(slotId, groupId) {
        const res = await fetch(`${API_BASE_URL}/book/${slotId}/${groupId}`, {
            method: "POST",
        });
        if (!res.ok) throw new Error("Failed to book slot");
        return res.json();
    },
};

export default PresentationService;

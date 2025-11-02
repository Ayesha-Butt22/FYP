const API_BASE = "http://localhost:5000/api/supervisor-whiteboard";

const SupervisorWhiteboardApi = {
  // Create a new note
  create: async (note) => {
    try {
      const res = await fetch(`${API_BASE}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return await res.json();
    } catch (error) {
      console.error("Error creating note:", error);
      return null;
    }
  },


  // Get all notes grouped by groupId
  getAllByGroups: async () => {
    try {
      const res = await fetch(`${API_BASE}/all-groups`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return await res.json();
    } catch (error) {
      console.error("Error fetching all notes:", error);
      return {};
    }
  },

  // Delete a note by ID
  delete: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/delete/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      return await res.json();
    } catch (error) {
      console.error("Error deleting note:", error);
      return null;
    }
  },

  StudentWhiteboard: async (email) => {
    try {
      const res = await fetch(`${API_BASE}/studentWhiteboard/${email}`);
      if (!res.ok) throw new Error("Failed to fetch student notes");
      return await res.json();
    } catch (error) {
      console.error("Error fetching student notes:", error);
      return { success: false, notes: [] };
    }
  },

};

export default SupervisorWhiteboardApi;

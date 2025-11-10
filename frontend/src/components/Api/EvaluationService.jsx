// Safe EvaluationService that works with Create React App, Vite, or runtime injection.
// Avoids using `typeof import` which causes parse errors with some bundlers.

function getApiBase() {
  // 1) CRA: process.env.REACT_APP_API_BASE (works when built with CRA)
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) {
    return `${process.env.REACT_APP_API_BASE}/evaluation`;
  }

  // 2) Vite: import.meta.env.VITE_API_BASE
  // Access inside try/catch so this file can still parse in environments where import.meta isn't available.
  try {
    // eslint-disable-next-line no-undef
    if (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) {
      return `${import.meta.env.VITE_API_BASE}/evaluation`;
    }
  } catch (e) {
    // import.meta not available in this runtime/build parser — ignore
  }

  // 3) Runtime injection via window (useful for containers or static injection)
  if (typeof window !== "undefined" && window.__ENV && window.__ENV.REACT_APP_API_BASE) {
    return `${window.__ENV.REACT_APP_API_BASE}/evaluation`;
  }

  // 4) Fallback to localhost
  return "http://localhost:5000/api/evaluation";
}

const API_BASE = getApiBase();

const EvaluationService = {
  async getBookedGroups(payload) {
    const res = await fetch(`${API_BASE}/getBookedGroups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
      throw new Error(`Request failed (${res.status}): ${JSON.stringify(parsed)}`);
    }
    return res.json();
  },

  async getSingleGroups(payload) {
    const res = await fetch(`${API_BASE}/getSingleGroups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
      throw new Error(`Request failed (${res.status}): ${JSON.stringify(parsed)}`);
    }
    return res.json();
  },


  // other helpers can be added here (resolveGroup, bulkResolveGroups) if needed
};

export default EvaluationService;
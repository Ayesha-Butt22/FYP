const API_BASE_URL = "http://localhost:5000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const parseJSON = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// Fetch all proposals assigned to this supervisor
export const fetchSupervisorProposals = async () => {
  const response = await fetch(`${API_BASE_URL}/proposals/supervisor`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    const errorData = await parseJSON(response);
    throw new Error(errorData?.error || "Failed to load proposals");
  }

  const json = await response.json();
  return Array.isArray(json.data) ? json.data : [];
};

// Update proposal status with supervisor comments
export const updateProposalStatus = async (proposalId, status, comments) => {
  const response = await fetch(
    `${API_BASE_URL}/proposals/${encodeURIComponent(proposalId)}/review`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        projectStatus: status,
        projectSupervisorComments: comments,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await parseJSON(response);
    throw new Error(errorData?.error || "Failed to update proposal");
  }

  return await response.json();
};

// Fetch pending proposals with time window logic
export const fetchPendingProposals = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/proposals/pending`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch proposals");
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error("[fetchPendingProposals]", err);
    return [];
  }
};

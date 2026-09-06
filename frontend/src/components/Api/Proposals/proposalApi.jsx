//proposalApi
const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const getHeaders = () => {
    const token = localStorage.getItem("token");
    const headers = {"Content-Type": "application/json"};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

const parseJSON = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

export const checkExistingProposal = async (groupId) => {
    const response = await fetch(
        `${API_BASE_URL}/proposals/${encodeURIComponent(groupId)}`,
        {
            method: "GET",
            headers: {"Content-Type": "application/json"},
        }
    );

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        const errorData = await parseJSON(response);
        throw new Error(errorData?.error || `Failed to check proposal (status ${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] || null : data;
};
export const createProposal = async (proposalData) => {
    const response = await fetch(`${API_BASE_URL}/proposals/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(proposalData),
    });

    const jsonData = await parseJSON(response);

    if (!response.ok) {
        const error = new Error(jsonData?.error || "Failed to create proposal");
        error.data = jsonData;
        throw error;
    }
    return jsonData?.proposal || jsonData;
};

export const deleteProposal = async (proposalId) => {
    const response = await fetch(
        `${API_BASE_URL}/proposals/${encodeURIComponent(proposalId)}`,
        {
            method: "Delete",
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        const errorData = await parseJSON(response);
        throw new Error(errorData?.error || "Failed to delete proposal");
    }

    return await response.json();
};
//DeadlineService.jsx
const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/deadline/getdeadline`;

const DeadLineService = {
    async getDeadLines(session) {
        try {
            const res = await fetch(`${BASE_URL}?part=${session}`);
            if (!res.ok) throw new Error("deadline  not found");
            const data = await res.json();
            return data;
        } catch (err) {
            console.error("Error fetching deadline", err);
            return null;
        }
    },
};

export default DeadLineService;

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/profile-pic`;

const ProfileService = {
    async getProfilePic(email) {
        try {
            const res = await fetch(`${BASE_URL}/${email}`);
            if (!res.ok) {
                // Return null silently if file doesn't exist
                return null;
            }
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } catch (err) {
            // Only log actual network/logic errors, not 404s
            return null;
        }
    },

    async uploadProfilePic(email, file) {
        try {
            const formData = new FormData();
            formData.append("email", email);
            formData.append("profilePic", file);

            const res = await fetch(`${BASE_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            return await res.json();
        } catch (err) {
            console.error("Error uploading profile pic:", err);
            throw err;
        }
    },
};

export default ProfileService;

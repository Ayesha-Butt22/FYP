
const BASE_URL = "http://localhost:5000/api/profile-pic";

const ProfileService = {
    async getProfilePic(email) {
        try {
            const res = await fetch(`${BASE_URL}/${email}`);
            if (!res.ok) throw new Error("Profile picture not found");
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } catch (err) {
            console.error("Error fetching profile pic:", err);
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

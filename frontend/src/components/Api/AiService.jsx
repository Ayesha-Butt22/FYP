import ToastService from "../ToastService/ToastService.jsx";
export async function GetTitle(inputTitle) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a helpful AI that generates short, catchy project title ideas.",
                    },
                    {
                        role: "user",
                        content: `Suggest 4 creative project titles similar to: "${inputTitle}". Return only the titles, one per line.`,
                    },
                ],
            }),
        });

        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";

        const titles = text
            .split("\n")
            .map((line) =>
                line
                    .replace(/^[-→•\d.)\s"]+/, "")
                    .replace(/["“”]+/g, "")
                    .replace(/<\/?s>|<[^>]+>|\[OUT\]|\[.*?\]/gi, "")
                    .trim()
            )
            .filter((line) => line.length > 0);

        return titles;
    } catch (err) {
        console.error(err);
        ToastService.error("Failed to fetch title suggestions. Please try again.");
        return [];
    }
}

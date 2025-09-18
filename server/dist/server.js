"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)()); // allow frontend calls
const PORT = Number(process.env.PORT) || 8080;
// Simple in-memory token cache
let cachedToken = null;
let tokenExpiry = 0;
async function getAccessToken() {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry)
        return cachedToken;
    const res = await (0, node_fetch_1.default)("https://api.petfinder.com/v2/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.PETFINDER_ID ?? "",
            client_secret: process.env.PETFINDER_SECRET ?? "",
        }),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch Petfinder token: ${res.statusText}`);
    }
    const data = (await res.json());
    cachedToken = data.access_token;
    tokenExpiry = now + data.expires_in * 1000;
    return cachedToken;
}
// Proxy endpoint
app.get("/api/pets", async (req, res) => {
    try {
        const token = await getAccessToken();
        const { type = "dog", limit = "20", location = "10001" } = req.query; // default to NYC zip
        const query = new URLSearchParams({
            type: String(type),
            limit: String(limit),
            location: String(location)
        });
        const petRes = await (0, node_fetch_1.default)(`https://api.petfinder.com/v2/animals?${query}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!petRes.ok) {
            const text = await petRes.text();
            console.error(" Petfinder error:", petRes.status, text);
            return res.status(500).json({ error: "Failed to fetch pets from Petfinder" });
        }
        const pets = await petRes.json();
        res.json(pets);
    }
    catch (err) {
        console.error(" Error in /api/pets:", err.message);
        res.status(500).json({ error: err.message || "Server error" });
    }
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(` Server running at http://0.0.0.0:${PORT}`);
});
// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`)
// })

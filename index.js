import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { AuthorizationCode } from "simple-oauth2";
import path from "path";
import { fileURLToPath } from "url";
// Uruchamia konfigurację dotenv, która wczytuje zmienne środowiskowe
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;
// Serwowanie plików statycznych z folderu klienta
app.use(express.static(path.join(__dirname, "../client")));
// Tworzy nową instancję obiektu AuthorizationCode dla konfiguracji OAuth2.0 Google
const client = new AuthorizationCode({
client: {
id: process.env.GITHUB_CLIENT_ID,
secret: process.env.GITHUB_CLIENT_SECRET,
},
auth: {
    tokenHost: "https://api.github.com/user",

    authorizePath: "https://github.com/login/oauth/authorize",
    
    tokenPath: "https://github.com/login/oauth/access_token",
},
});
// Generuje URL autoryzacji Google
const authorizationUri = client.authorizeURL({
redirect_uri: process.env.REDIRECT_URI,
scope: ["openid", "profile", "email"],
state: Math.random().toString(36).substring(7), // generate random state for security
});
// Endpoint główny przekierowujący do Google
app.get("/auto", (req, res) => {
res.redirect(authorizationUri);
});
// Endpoint obsługujący przekierowanie po autoryzacji Google
app.get("/callback", async (req, res) => {
const { code } = req.query;
try {
const tokenParams = {
code,
redirect_uri: process.env.REDIRECT_URI,
scope: "openid profile email",
};
// Uzyskuje token dostępu
const accessToken = await client.getToken(tokenParams);
const token = accessToken.token;
// Uzyskuje dane użytkownika (opcjonalnie do użycia)
const userInfo = await axios.get(
"https://www.googleapis.com/oauth2/v3/userinfo",
{
headers: {
Authorization: `Bearer ${token.access_token}`,
},
}
);
console.log("User info:", userInfo.data);
// Przekierowanie na stronę /index po autoryzacji
res.redirect("/forma.html");
} catch (error) {
console.error("Error exchanging code for token:", error.message);
res.status(500).json({ error: "Authentication failed" });
}
});
// Endpoint obsługujący dostęp do strony index.html
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "../client", "index.html"));
});
// Uruchomienie serwera
app.listen(PORT, () => {
console.log(`Aplikacja działa na http://localhost:${PORT}`);
});
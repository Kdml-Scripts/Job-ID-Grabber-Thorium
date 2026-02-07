import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const PLACE_ID = "109983668079237";
const JSON_FILE = "./index.json";

let jobIds = [];

// Function to fetch and update servers
async function updateJobIds() {
  try {
    let newJobIds = [];
    let cursor = null;

    for (let i = 0; i < 3; i++) { // max 300 servers
      const url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const r = await fetch(url);
      const data = await r.json();

      if (!data.data) {
        console.log("No data field in response:", data);
        break; // stop if API returns no servers
      }

      data.data.forEach(server => {
        newJobIds.push({ jobId: server.id });
      });

      if (!data.nextPageCursor) break;
      cursor = data.nextPageCursor;
    }

    jobIds = newJobIds; // overwrite old list

    // Save to JSON
    fs.writeFileSync(JSON_FILE, JSON.stringify({ count: jobIds.length, servers: jobIds }, null, 2));
    console.log(`Updated ${JSON_FILE} with ${jobIds.length} servers.`);
  } catch (err) {
    console.error("Error fetching servers:", err);
  }
}

// Initial fetch
updateJobIds();

// Update every 10 seconds
setInterval(updateJobIds, 10000);

app.get("/", (req, res) => {
  res.json({ count: jobIds.length, servers: jobIds });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

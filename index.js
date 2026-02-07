import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const PLACE_ID = "109983668079237";
const JSON_FILE = "./index.json";

let jobIds = [];

// Load old job IDs if file exists
if (fs.existsSync(JSON_FILE)) {
  try {
    jobIds = fs.readFileSync(JSON_FILE, "utf-8")
      .split("\n")
      .filter(Boolean); // remove empty lines
  } catch (err) {
    console.error("Failed to read old job IDs:", err);
  }
}

async function updateJobIds() {
  try {
    let newJobIds = [];
    let cursor = null;

    for (let i = 0; i < 3; i++) { // max ~300 servers
      const url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.data) {
        console.warn("API returned no data, keeping old job IDs.");
        break; // don't overwrite
      }

      // Push only server IDs
      data.data.forEach(server => newJobIds.push(server.id));

      if (!data.nextPageCursor) break;
      cursor = data.nextPageCursor;
    }

    // Only update if we actually got new servers
    if (newJobIds.length > 0) {
      jobIds = newJobIds;
      fs.writeFileSync(JSON_FILE, jobIds.join("\n"));
      console.log(`Updated ${JSON_FILE} with ${jobIds.length} servers.`);
    } else {
      console.log("No servers fetched, keeping old job IDs.");
    }
  } catch (err) {
    console.error("Error fetching servers, keeping old job IDs:", err);
  }
}

// Initial fetch
updateJobIds();

// Update every 10 seconds
setInterval(updateJobIds, 10000);

// Endpoint returns one job ID per line
app.get("/", (req, res) => {
  res.type("text/plain").send(jobIds.join("\n"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

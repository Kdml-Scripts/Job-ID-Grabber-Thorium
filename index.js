import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const PLACE_ID = "109983668079237";
const JSON_FILE = "./index.json";

let jobIds = [];

// Load old job IDs
if (fs.existsSync(JSON_FILE)) {
  jobIds = fs.readFileSync(JSON_FILE, "utf-8").split("\n").filter(Boolean);
}

async function updateJobIds() {
  try {
    let newJobIds = [];
    let cursor = null;

    while (true) {
      const url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data || !data.data) {
        console.warn("API returned no data, keeping old job IDs.");
        break;
      }

      data.data.forEach(server => {
        if (!newJobIds.includes(server.id)) newJobIds.push(server.id);
      });

      if (!data.nextPageCursor) break; // no more pages
      cursor = data.nextPageCursor;
    }

    if (newJobIds.length > 0) {
      jobIds = newJobIds;
      fs.writeFileSync(JSON_FILE, jobIds.join("\n"));
      console.log(`Updated ${JSON_FILE} with ${jobIds.length} servers.`);
    } else {
      console.log("No new servers fetched, keeping old job IDs.");
    }
  } catch (err) {
    console.error("Error fetching servers, keeping old job IDs:", err);
  }
}


// Refresh every 10s
setInterval(updateJobIds, 5000);

// Endpoint returns a straight list
app.get("/", (req, res) => {
  res.type("text/plain").send(jobIds.join("\n"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

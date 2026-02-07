import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

const PLACE_ID = "109983668079237";
const FILE = "./index.json";

let jobIds = [];

// load old job IDs
if (fs.existsSync(FILE)) {
  jobIds = fs.readFileSync(FILE, "utf8").split("\n").filter(Boolean);
}

async function updateJobIds() {
  try {
    let newJobIds = [];
    let cursor = null;

    for (let i = 0; i < 5; i++) { // try more pages
      const url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const data = await res.json();

      if (!data.data || data.data.length === 0) break;

      data.data.forEach(s => {
        if (!newJobIds.includes(s.id)) newJobIds.push(s.id);
      });

      if (!data.nextPageCursor) break;
      cursor = data.nextPageCursor;

      await new Promise(r => setTimeout(r, 500)); // avoid hitting rate limit
    }

    if (newJobIds.length === 0) {
      console.log("No servers fetched, keeping old job IDs.");
      return;
    }

    jobIds = newJobIds;
    fs.writeFileSync(FILE, jobIds.join("\n"));
    console.log(`Updated index.json with ${jobIds.length} job IDs.`);

  } catch (err) {
    console.error("API failed, keeping old job IDs.", err.message);
  }
}

// refresh every 10–15 seconds
setInterval(updateJobIds, 15000);
updateJobIds();

// serve plain text
app.get("/", (req, res) => {
  res.type("text/plain").send(jobIds.join("\n"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

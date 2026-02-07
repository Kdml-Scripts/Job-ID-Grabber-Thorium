import fs from "fs";
import fetch from "node-fetch";

const PLACE_ID = "109983668079237";
const FILE_PATH = "./index.json";

async function updateJobIds() {
  try {
    let jobIds = [];
    let cursor = null;

    for (let i = 0; i < 3; i++) { // ~300 servers
      const url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const r = await fetch(url);
      const data = await r.json();

      data.data.forEach(server => {
        jobIds.push({ jobId: server.id });
      });

      if (!data.nextPageCursor) break;
      cursor = data.nextPageCursor;
    }

    const jsonData = {
      count: jobIds.length,
      servers: jobIds
    };

    fs.writeFileSync(FILE_PATH, JSON.stringify(jsonData, null, 2));
    console.log(`Updated ${FILE_PATH} with ${jobIds.length} servers.`);
  } catch (err) {
    console.error("Error fetching servers:", err);
  }
}

// Initial run
updateJobIds();

// Auto-update every 10 seconds
setInterval(updateJobIds, 10000);

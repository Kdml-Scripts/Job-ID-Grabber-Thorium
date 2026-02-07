import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const PLACE_ID = "109983668079237";

app.get("/", async (req, res) => {
  try {
    let jobIds = [];
    let cursor = null;

    for (let i = 0; i < 3; i++) { // ~300 servers max
      const url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const r = await fetch(url);
      const data = await r.json();

      data.data.forEach(server => {
        jobIds.push({
          jobId: server.id,
          playing: server.playing,
          maxPlayers: server.maxPlayers
        });
      });

      if (!data.nextPageCursor) break;
      cursor = data.nextPageCursor;
    }

    res.json({
      count: jobIds.length,
      servers: jobIds
    });
  } catch (err) {
    res.status(500).send("Error fetching servers");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      redis = new Redis({ url, token });
    }
  }
  return redis;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const client = getRedis();
      if (!client) {
        return res.status(503).json({ error: "Redis not configured", isConfigured: false });
      }
      
      const leaderboard = await client.zrange("global_leaderboard", 0, 49, { rev: true, withScores: true });
      if (leaderboard.length === 0) {
         return res.json({ isConfigured: true, leaderboard: [] });
      }
      
      const formatted = [];
      const keys = [];
      for (let i = 0; i < leaderboard.length; i += 2) {
        keys.push(leaderboard[i]);
      }
      
      const metaValues = await client.hmget("global_leaderboard_meta", ...keys);
      
      for (let i = 0; i < keys.length; i++) {
        const id = keys[i];
        const score = leaderboard[i * 2 + 1];
        let meta: any = { name: id };
        try {
          // metaValues from @upstash/redis is a Record using fields as keys
          const val = metaValues ? (metaValues as any)[id] : null;
          if (val) {
             meta = typeof val === 'string' ? JSON.parse(val) : val;
          }
        } catch(e) {}
        
        formatted.push({ 
          id, 
          score,
          name: meta.name || id,
          maxStreak: meta.maxStreak,
          customTime: meta.customTime,
          numOptions: meta.numOptions,
          pools: meta.pools
        });
      }
      res.json({ isConfigured: true, leaderboard: formatted });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard/name", async (req, res) => {
    try {
      const { id, name } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: "Invalid data" });
      }
      const client = getRedis();
      if (!client) {
        return res.status(503).json({ error: "Redis not configured" });
      }
      const existingMetaStr = await client.hget("global_leaderboard_meta", id);
      let existing: any = {};
      if (typeof existingMetaStr === 'string') {
         try { existing = JSON.parse(existingMetaStr); } catch(e){}
      } else if (existingMetaStr) {
         existing = existingMetaStr;
      }
      // only update if they already exist in meta
      if (Object.keys(existing).length > 0) {
        await client.hset("global_leaderboard_meta", {
          [id]: JSON.stringify({ ...existing, name })
        });
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to submit name" });
    }
  });

  app.post("/api/leaderboard", async (req, res) => {
    try {
      const { id, name, score, maxStreak, customTime, numOptions, pools } = req.body;
      if (!id || !name || typeof score !== "number") {
        return res.status(400).json({ error: "Invalid data" });
      }

      // Basic mathematical anti-cheat validation
      // Max score per guess is ~100 with streak multipliers growing.
      // A realistic max score in X seconds is severely bounded.
      // Using an upper threshold of customTime * 2500 as an absolute ceiling. 
      // Example: 180s time => 450,000 points max.
      const safeTime = customTime || 60;
      const absoluteMaxScore = safeTime * 4000;
      if (score > absoluteMaxScore || score < 0) {
        return res.status(400).json({ error: "Score mathematically impossible" });
      }

      const client = getRedis();
      if (!client) {
        return res.status(503).json({ error: "Redis not configured" });
      }
      
      const currentScore = await client.zscore("global_leaderboard", id);
      if (currentScore === null || score > Number(currentScore)) {
        await client.zadd("global_leaderboard", { score, member: id });
        await client.hset("global_leaderboard_meta", {
          [id]: JSON.stringify({ name, maxStreak, customTime, numOptions, pools })
        });
      } else {
        const existingMetaStr = await client.hget("global_leaderboard_meta", id);
        let existing: any = {};
        if (typeof existingMetaStr === 'string') {
           try { existing = JSON.parse(existingMetaStr); } catch(e){}
        } else if (existingMetaStr) {
           existing = existingMetaStr;
        }
        await client.hset("global_leaderboard_meta", {
          [id]: JSON.stringify({ 
             name, 
             maxStreak: existing.maxStreak || maxStreak, 
             customTime: existing.customTime || customTime, 
             numOptions: existing.numOptions || numOptions, 
             pools: existing.pools || pools 
          })
        });
      }
      
      const rank = await client.zrevrank("global_leaderboard", id);
      res.json({ success: true, rank: rank !== null ? rank + 1 : -1 });
    } catch (e) {
      res.status(500).json({ error: "Failed to submit score" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

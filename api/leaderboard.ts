import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const client = getRedis();
      if (!client) {
        return res.status(503).json({ error: "Redis not configured", isConfigured: false });
      }

      const leaderboard = await client.zrange("global_leaderboard", 0, 49, { rev: true, withScores: true });
      if (leaderboard.length === 0) {
        return res.status(200).json({ isConfigured: true, leaderboard: [] });
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
          const val = metaValues ? (metaValues as any)[id] : null;
          if (val) {
            meta = typeof val === "string" ? JSON.parse(val) : val;
          }
        } catch (e) {}

        formatted.push({
          id,
          score,
          name: meta.name || id,
          maxStreak: meta.maxStreak,
          customTime: meta.customTime,
          numOptions: meta.numOptions,
          pools: meta.pools,
        });
      }
      return res.status(200).json({ isConfigured: true, leaderboard: formatted });
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  } else if (req.method === "POST") {
    try {
      const { id, name, score, maxStreak, customTime, numOptions, pools } = req.body;
      if (!id || !name || typeof score !== "number") {
        return res.status(400).json({ error: "Invalid data" });
      }

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
          [id]: JSON.stringify({ name, maxStreak, customTime, numOptions, pools }),
        });
      } else {
        const existingMetaStr = await client.hget("global_leaderboard_meta", id);
        let existing: any = {};
        if (typeof existingMetaStr === "string") {
          try {
            existing = JSON.parse(existingMetaStr);
          } catch (e) {}
        } else if (existingMetaStr) {
          existing = existingMetaStr;
        }
        await client.hset("global_leaderboard_meta", {
          [id]: JSON.stringify({
            name,
            maxStreak: existing.maxStreak || maxStreak,
            customTime: existing.customTime || customTime,
            numOptions: existing.numOptions || numOptions,
            pools: existing.pools || pools,
          }),
        });
      }

      const rank = await client.zrevrank("global_leaderboard", id);
      return res.status(200).json({ success: true, rank: rank !== null ? rank + 1 : -1 });
    } catch (e) {
      return res.status(500).json({ error: "Failed to submit score" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

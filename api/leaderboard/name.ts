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
  if (req.method === "POST") {
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
      if (typeof existingMetaStr === "string") {
        try {
          existing = JSON.parse(existingMetaStr);
        } catch (e) {}
      } else if (existingMetaStr) {
        existing = existingMetaStr;
      }
      
      if (Object.keys(existing).length > 0) {
        await client.hset("global_leaderboard_meta", {
          [id]: JSON.stringify({ ...existing, name }),
        });
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to submit name" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

import Redis from "ioredis";

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<any>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
};

const createInMemoryRedis = (): RedisLike => {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  const now = () => Date.now();

  const cleanup = () => {
    for (const [k, v] of store.entries()) {
      if (v.expiresAt && v.expiresAt <= now()) store.delete(k);
    }
  };

  return {
    async get(key: string) {
      cleanup();
      const v = store.get(key);
      return v ? v.value : null;
    },
    async set(key: string, value: string, ...args: any[]) {
      // support EX ttl param: ('EX', seconds)
      let expiresAt: number | undefined;
      if (args.length >= 2 && String(args[0]).toUpperCase() === "EX") {
        const seconds = Number(args[1]);
        if (!Number.isNaN(seconds)) expiresAt = Date.now() + seconds * 1000;
      }
      store.set(key, { value, expiresAt });
      return 'OK';
    },
    async del(...keys: string[]) {
      let removed = 0;
      for (const k of keys) if (store.delete(k)) removed++;
      return removed;
    },
    async keys(pattern: string) {
      cleanup();
      // very simple glob '*' support
      if (pattern === '*') return Array.from(store.keys());
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(store.keys()).filter(k => regex.test(k));
    },
    async exists(key: string) {
      cleanup();
      return store.has(key) ? 1 : 0;
    },
    async ttl(key: string) {
      const v = store.get(key);
      if (!v || !v.expiresAt) return -1;
      const remaining = Math.floor((v.expiresAt - Date.now()) / 1000);
      return remaining >= 0 ? remaining : -2;
    }
  };
};

const REDIS_URL = process.env.REDIS_URL;

// Create a single exported client (either real Redis proxy or in-memory fallback)
let redisClient: RedisLike;

if (!REDIS_URL) {
  // No Redis configured — use in-memory fallback to avoid noisy connection attempts.
  redisClient = createInMemoryRedis();
  console.log("Redis disabled: using in-memory fallback");
} else {
  // Create a lazy client so we don't aggressively retry connections during dev.
  const client = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });

  client.on("connect", () => console.log("Connected to Redis"));
  client.on("error", (err) => console.error("Redis connection error:", err));

  const fallback = createInMemoryRedis();

  redisClient = {
    async get(key: string) {
      if ((client as any).status === "ready") return client.get(key);
      return fallback.get(key);
    },
    async set(key: string, value: string, ...args: any[]) {
      if ((client as any).status === "ready") return client.set(key, value, ...args);
      return fallback.set(key, value, ...args);
    },
    async del(...keys: string[]) {
      if ((client as any).status === "ready") return client.del(...keys);
      return fallback.del(...keys);
    },
    async keys(pattern: string) {
      if ((client as any).status === "ready") return client.keys(pattern);
      return fallback.keys(pattern);
    },
    async exists(key: string) {
      if ((client as any).status === "ready") return client.exists(key);
      return fallback.exists(key);
    },
    async ttl(key: string) {
      if ((client as any).status === "ready") return client.ttl(key);
      return fallback.ttl(key);
    }
  };
}

export default redisClient;
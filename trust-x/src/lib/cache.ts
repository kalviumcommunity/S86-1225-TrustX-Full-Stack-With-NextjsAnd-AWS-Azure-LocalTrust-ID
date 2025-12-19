import redis from "./redis";

export class CacheService {
  private redis = redis;

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set(key: string, data: any, ttlSeconds: number = 60): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Delete a specific cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error("Cache del error:", error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error("Cache delPattern error:", error);
      return 0;
    }
  }

  /**
   * Check if cache key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  /**
   * Get cache key with TTL remaining
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error("Cache ttl error:", error);
      return -1;
    }
  }
}

export const cacheService = new CacheService();
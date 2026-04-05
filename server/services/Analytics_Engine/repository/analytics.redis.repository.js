/*
    REFERENCE:
    - Upstash Redis XREAD. Available at: https://upstash.com/docs/redis/sdks/ts/commands/stream/xread
*/

import { redis } from "../config/redis.config.js";

export class AnalyticsRedisRepository {

    // constructor(redis){
    //     this.redis = redis;
    // }

    async addToStream(streamName, data, limit = 1000) {
      
        if (!data || typeof data !== 'object') {
            console.error(`Cannot add to stream ${streamName}: invalid data`, data);
            return;
        }
    
        return await redis.xadd(
            streamName,
            '*',              
            data,     
            { maxlen: { threshold: limit },
              approximate: true
            }
        );
    };

    // Upstash does not support blocking xread, commenting due to error
    // async readStream(streamKey, lastId = '0-0') {
    //   return await this.redis.xread(
    //     [{ key: streamKey, id: lastId }],
    //     { block: 0, count: 10 }
    //   );
    // }


    async readStream(streamKey, lastId = "0-0", count = 10) {
        const keys = await redis.keys("ticks:*");
        console.log("All tick streams:", keys);
    try {
      console.log("streaKey: " + streamKey);
      const redisData = await redis.xread(streamKey, lastId, { count });
      return redisData;
    } catch (err) {
      console.error("Error in readStream:", err);
      return null;
    }
  }

    /*
    // Read data from a Redis stream starting from lastId
    async readStream(streamKey, lastId = "0-0", count = 10) {

        const UPSTASH_REDIS_REST_URL="https://accurate-unicorn-91780.upstash.io"
        const UPSTASH_REDIS_REST_TOKEN="gQAAAAAAAWaEAAIncDFiYTg1NzIxN2U0ZWM0ZWNhODNhODBjY2IwZDMxNDkxNHAxOTE3ODA"

        const redis = new Redis({
            url: UPSTASH_REDIS_REST_URL,
            token: UPSTASH_REDIS_REST_TOKEN
        });

        try {
            const result = await redis.request("XRANGE", [
            streamKey,
            lastId,
            "+",
            "COUNT",
            count,
        ]);

        // Upstash returns array of [id, {field:value}]
        // Convert to object { id: tick } for easy iteration
        const ticks = {};
        for (const [id, fields] of result) {
            ticks[id] = fields;
        }

        return ticks;
    } catch (err) {
      console.error("Error in readStream:", err);
      return null;
    }
  } */

}
  

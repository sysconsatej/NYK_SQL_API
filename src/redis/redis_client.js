const redis = require("ioredis");

const client = new redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASS,
});

client.on("connect", () => {
  console.log("Connected to Redis server");
});

client.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = client;
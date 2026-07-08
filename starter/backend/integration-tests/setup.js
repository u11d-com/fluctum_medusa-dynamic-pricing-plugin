const { loadEnv } = require("@medusajs/utils")
loadEnv("test", process.cwd())

// BullMQ/ioredis emit "Connection is closed" errors during test teardown when
// Redis connections are forcefully closed. These are not test failures — suppress them.
process.on("unhandledRejection", (reason) => {
  const msg = reason?.message ?? String(reason)
  if (msg.includes("Connection is closed") || msg.includes("stream isn't writeable")) {
    return
  }
  throw reason
})

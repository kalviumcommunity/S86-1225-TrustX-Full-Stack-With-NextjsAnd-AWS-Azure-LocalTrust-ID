export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(JSON.stringify({ level: "info", message, meta, timestamp: new Date() }));
  },
  error: (message: string, meta?: unknown) => {
    console.error(JSON.stringify({ level: "error", message, meta, timestamp: new Date() }));
  },
};
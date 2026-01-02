export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(JSON.stringify({ level: "info", message, meta, timestamp: new Date() }));
  },
  error: (message: string, meta?: unknown) => {
    console.error(JSON.stringify({ level: "error", message, meta, timestamp: new Date() }));
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(JSON.stringify({ level: "warn", message, meta, timestamp: new Date() }));
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({ level: "debug", message, meta, timestamp: new Date() }));
    }
  },
};
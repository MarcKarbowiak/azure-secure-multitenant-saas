type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(extra ?? {})
  };
  console.log(JSON.stringify(payload));
}

export const logger = {
  info: (message: string, extra?: Record<string, unknown>) => log("INFO", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) => log("WARN", message, extra),
  error: (message: string, extra?: Record<string, unknown>) => log("ERROR", message, extra),
  audit: (extra: Record<string, unknown>) => log("INFO", "audit", { eventType: "audit", ...extra })
};


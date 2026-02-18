import { useAzureMonitor } from "@azure/monitor-opentelemetry";
import { logger } from "../services/logger";

let started = false;

export function initTelemetry(): void {
  if (started) {
    return;
  }
  started = true;

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) {
    logger.warn("Application Insights connection string not set; telemetry exporter disabled");
    return;
  }

  useAzureMonitor({ azureMonitorExporterOptions: { connectionString } });
  logger.info("OpenTelemetry exporter initialized");
}


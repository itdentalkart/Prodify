// Application types - used across the frontend

export interface Screenshot {
  id: string;
  deviceId: string;
  filePath: string;
  capturedAt: Date;
  sessionId?: string;
  deviceHostname?: string;
  userName?: string;
  meta?: Record<string, unknown>;
}

export interface TimelineDataPoint {
  time: string;
  activeSeconds: number;
  idleSeconds: number;
}

export interface ProductivityMetrics {
  totalActiveTime: number;
  totalIdleTime: number;
  totalSessions: number;
  screenshotCount: number;
  productivityScore: number;
}

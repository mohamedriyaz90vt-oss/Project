
export enum PortStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FILTERED = 'FILTERED'
}

export interface PortInfo {
  port: number;
  status: PortStatus;
  service: string;
  latency?: number;
}

export interface ScanResult {
  target: string;
  timestamp: string;
  totalPorts: number;
  openPorts: number;
  timeElapsed: number;
  ports: PortInfo[];
}

export interface SecurityInsight {
  vulnerability: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

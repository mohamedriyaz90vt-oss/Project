
import { PortInfo, PortStatus, ScanResult } from "../types";
import { COMMON_PORTS, COMMON_PORTS_LIST } from "../constants";

// For demonstration, we simulate port responses. 
// In a real full-stack app, this would be a fetch() call to a Python/Go backend.
export const simulateScan = async (
  target: string, 
  mode: 'common' | 'range', 
  rangeStart?: number, 
  rangeEnd?: number
): Promise<ScanResult> => {
  const startTime = Date.now();
  
  // Validation (Simple Regex)
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
  const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(target);
  
  if (!isIP && !isDomain) {
    throw new Error("Invalid IP address or domain name format.");
  }

  // Prevent local/loopback for security simulation safety
  if (target === 'localhost' || target === '127.0.0.1') {
    throw new Error("Scanning localhost or loopback addresses is restricted in this demo.");
  }

  const portsToScan: number[] = [];
  if (mode === 'common') {
    portsToScan.push(...COMMON_PORTS_LIST);
  } else if (rangeStart !== undefined && rangeEnd !== undefined) {
    // Limit range for safety/performance in simulation
    const start = Math.max(1, rangeStart);
    const end = Math.min(65535, rangeEnd);
    const count = end - start + 1;
    
    if (count > 256) {
      throw new Error("For performance, the maximum scan range in this simulator is 256 ports.");
    }
    
    for (let i = start; i <= end; i++) {
      portsToScan.push(i);
    }
  }

  const results: PortInfo[] = [];
  
  // Simulate network latency and randomization of "open" ports
  // In a real scan, we'd use TCP connect_ex
  for (const port of portsToScan) {
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100)); // Simulate work
    
    // Logic to make it look "realistic" for a demo:
    // If it's a popular domain like google.com, simulate 80/443 open.
    const isPopular = target.includes('google') || target.includes('github') || target.includes('microsoft');
    let status = PortStatus.CLOSED;
    
    if (isPopular && (port === 80 || port === 443)) {
      status = PortStatus.OPEN;
    } else if (Math.random() > 0.92) { // Random chance for other ports
      status = PortStatus.OPEN;
    }

    results.push({
      port,
      status,
      service: COMMON_PORTS[port] || 'Unknown',
      latency: status === PortStatus.OPEN ? Math.floor(Math.random() * 50) + 10 : undefined
    });
  }

  const timeElapsed = (Date.now() - startTime) / 1000;
  const openPortsCount = results.filter(p => p.status === PortStatus.OPEN).length;

  return {
    target,
    timestamp: new Date().toISOString(),
    totalPorts: results.length,
    openPorts: openPortsCount,
    timeElapsed,
    ports: results
  };
};


export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending',
  RUNNING = 'running',
  IDLE = 'idle',
}

export interface ComplianceReport {
  id: string;
  timestamp: string;
  deviceId: string;
  configHash: string;
  evidenceLogUrl: string;
  hashValidationStatus: ComplianceStatus;
  logScanResult: {
    status: ComplianceStatus;
    summary: string;
  };
  finalStatus: ComplianceStatus;
  geminiReport: string;
}

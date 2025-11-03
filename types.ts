
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending',
}

export interface ComplianceLog {
  id: string;
  timestamp: string;
  hash: string;
  status: ComplianceStatus;
  requirementId: string;
  reasoning: string;
}

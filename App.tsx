import React, { useState, useCallback } from 'react';
import { ComplianceReport, ComplianceStatus } from './types';
import { generateComplianceReport } from './services/geminiService';
import Header from './components/Header';
import ReportTable from './components/LogTable';
import Chatbot from './components/Chatbot';
import { 
    CloudSchedulerIcon, CloudRunIcon, PubSubIcon, FirestoreIcon, CloudStorageIcon, AgentIcon, 
    CheckCircleIcon, XCircleIcon, ClockIcon, ChatIcon, AlertTriangleIcon
} from './components/icons';

const PCI_BASELINE_CONFIG = "pci_baseline_v1.2";
const TAMPERED_CONFIG = "pci_baseline_v1.2_tampered_config";
const EXPECTED_HASH_PROMISE = (async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(PCI_BASELINE_CONFIG);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
})();


// --- Sub-component: ArchitectureDiagram ---
const archStatusClasses = {
  [ComplianceStatus.IDLE]: 'border-gray-700 text-gray-400',
  [ComplianceStatus.PENDING]: 'border-gray-700 text-gray-400',
  [ComplianceStatus.RUNNING]: 'border-yellow-500 text-yellow-300 animate-pulse',
  [ComplianceStatus.COMPLIANT]: 'border-green-500 text-green-300',
  [ComplianceStatus.NON_COMPLIANT]: 'border-red-500 text-red-300',
}

const StepCard: React.FC<{ name: string; icon: React.ReactNode; status: ComplianceStatus; description: string }> = ({ name, icon, status, description }) => (
  <div className={`bg-gray-900 p-3 rounded-lg border-2 transition-all duration-500 flex-1 min-w-[180px] ${archStatusClasses[status]}`}>
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 flex-shrink-0 ${status === ComplianceStatus.RUNNING ? 'text-yellow-400' : 'text-cyan-400'}`}>{icon}</div>
      <div>
        <h4 className="font-bold text-sm">{name}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

const Arrow: React.FC = () => (
    <div className="text-gray-600 text-3xl font-light hidden lg:block px-2">→</div>
);

const ArchitectureDiagram: React.FC<{statuses: any}> = ({ statuses }) => {
  const steps = [
    { name: 'Cloud Scheduler', icon: <CloudSchedulerIcon />, status: statuses.scheduler, description: "Triggers inspection job." },
    { name: 'Inspector Agent (Job)', icon: <CloudRunIcon />, status: statuses.inspector, description: "Generates hash & evidence." },
    { name: 'Cloud Storage', icon: <CloudStorageIcon />, status: statuses.storage, description: "Stores evidence file." },
    { name: 'Pub/Sub', icon: <PubSubIcon />, status: statuses.pubsub, description: "Publishes event." },
    { name: 'Compliance Agent', icon: <CloudRunIcon />, status: statuses.complianceAgent, description: "Runs AI analysis." },
    { name: 'Firestore', icon: <FirestoreIcon />, status: statuses.firestore, description: "Stores compliance report." },
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Event-Driven Architecture Flow</h2>
      <div className="flex flex-wrap items-stretch justify-center gap-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.name}>
            <StepCard {...step} />
            {index < steps.length - 1 && <Arrow />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};


// --- Sub-component: ComplianceAgentDetail ---
const AgentStatusIcon: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  switch (status) {
    case ComplianceStatus.RUNNING:
      return <ClockIcon className="w-6 h-6 text-yellow-400 animate-spin" />;
    case ComplianceStatus.COMPLIANT:
      return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
    case ComplianceStatus.NON_COMPLIANT:
      return <XCircleIcon className="w-6 h-6 text-red-400" />;
    default:
      return <ClockIcon className="w-6 h-6 text-gray-600" />;
  }
}

const ComplianceAgentDetail: React.FC<{statuses: any}> = ({ statuses }) => {
  const subAgents = [
    { name: 'ComplyAgent (Root)', description: 'Orchestrates the compliance workflow.', status: statuses.complyAgent },
    { name: 'ValidationAgent', description: 'Validates config hash against baseline.', status: statuses.validationAgent },
    { name: 'LogScannerAgent', description: 'Scans evidence log for PCI violations.', status: statuses.logScannerAgent },
    { name: 'ReportAgent', description: 'Generates final structured report.', status: statuses.reportAgent },
  ];
  
  const validationFailed = statuses.validationAgent === ComplianceStatus.NON_COMPLIANT;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 h-full">
      <div className="flex items-center mb-4">
        <div className="text-cyan-400 mr-4"><AgentIcon className="w-10 h-10" /></div>
        <div>
          <h3 className="text-xl font-bold text-white">Compliance Agent Workflow</h3>
          <p className="text-sm text-gray-400">Live status of the internal multi-agent system.</p>
        </div>
      </div>
      
      {validationFailed && (
        <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-md mb-4 flex items-center gap-3">
          <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
          <div>
            <h4 className="font-bold">Configuration Drift Detected!</h4>
            <p className="text-sm">ValidationAgent reported a non-compliant status. The device configuration hash does not match the secure baseline.</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {subAgents.map(agent => (
          <div key={agent.name} className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
            <div>
              <p className="font-semibold text-gray-200">{agent.name}</p>
              <p className="text-xs text-gray-500">{agent.description}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-mono capitalize">{agent.status}</span>
                <AgentStatusIcon status={agent.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTampered, setIsTampered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const initialArchStatus = {
    scheduler: ComplianceStatus.IDLE,
    inspector: ComplianceStatus.IDLE,
    storage: ComplianceStatus.IDLE,
    pubsub: ComplianceStatus.IDLE,
    complianceAgent: ComplianceStatus.IDLE,
    firestore: ComplianceStatus.IDLE,
  };

  const initialAgentStatus = {
    complyAgent: ComplianceStatus.IDLE,
    validationAgent: ComplianceStatus.IDLE,
    logScannerAgent: ComplianceStatus.IDLE,
    reportAgent: ComplianceStatus.IDLE,
  };

  const [archStatuses, setArchStatuses] = useState(initialArchStatus);
  const [agentStatuses, setAgentStatuses] = useState(initialAgentStatus);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const triggerInspection = useCallback(async () => {
    setIsLoading(true);
    setArchStatuses(initialArchStatus);
    setAgentStatuses(initialAgentStatus);

    const deviceId = `prod-pos-${Math.floor(1000 + Math.random() * 9000)}`;
    const evidenceLogUrl = `gs://pci-evidence-logs/${deviceId}-${Date.now()}.log`;
    
    // 1. Cloud Scheduler
    setArchStatuses(prev => ({ ...prev, scheduler: ComplianceStatus.RUNNING }));
    await delay(500);
    setArchStatuses(prev => ({ ...prev, scheduler: ComplianceStatus.COMPLIANT, inspector: ComplianceStatus.RUNNING }));

    // 2. Inspector Agent
    const configToHash = isTampered ? TAMPERED_CONFIG : PCI_BASELINE_CONFIG;
    const encoder = new TextEncoder();
    const data = encoder.encode(configToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const generatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    await delay(1000);
    setArchStatuses(prev => ({ ...prev, inspector: ComplianceStatus.COMPLIANT, storage: ComplianceStatus.RUNNING }));

    // 3. Cloud Storage
    await delay(500);
    setArchStatuses(prev => ({ ...prev, storage: ComplianceStatus.COMPLIANT, pubsub: ComplianceStatus.RUNNING }));
    
    // 4. Pub/Sub
    await delay(500);
    setArchStatuses(prev => ({ ...prev, pubsub: ComplianceStatus.COMPLIANT, complianceAgent: ComplianceStatus.RUNNING }));
    
    // 5. Compliance Agent Workflow
    setAgentStatuses(prev => ({ ...prev, complyAgent: ComplianceStatus.RUNNING, validationAgent: ComplianceStatus.RUNNING }));
    await delay(1000);

    // 5a. ValidationAgent
    const expectedHashValue = await EXPECTED_HASH_PROMISE;
    const hashValidationStatus = generatedHash === expectedHashValue ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT;
    setAgentStatuses(prev => ({ ...prev, validationAgent: hashValidationStatus, logScannerAgent: ComplianceStatus.RUNNING }));
    await delay(1000);
    
    // 5b. LogScannerAgent
    const logScanResult = {
        status: isTampered ? ComplianceStatus.NON_COMPLIANT : ComplianceStatus.COMPLIANT,
        summary: isTampered 
            ? "CRITICAL: Found 2 unauthorized root login attempts and 1 unexpected outbound connection to a foreign IP."
            : "No anomalies or PCI violations detected in the device log."
    };
    setAgentStatuses(prev => ({ ...prev, logScannerAgent: logScanResult.status, reportAgent: ComplianceStatus.RUNNING }));
    await delay(1500);

    // 5c. ReportAgent
    const geminiReport = await generateComplianceReport({
        deviceId,
        hashValidationStatus,
        logScanSummary: logScanResult.summary,
    });
    
    const finalStatus = (hashValidationStatus === ComplianceStatus.COMPLIANT && logScanResult.status === ComplianceStatus.COMPLIANT)
        ? ComplianceStatus.COMPLIANT
        : ComplianceStatus.NON_COMPLIANT;
        
    setAgentStatuses(prev => ({ ...prev, reportAgent: finalStatus, complyAgent: finalStatus }));

    const newReport: ComplianceReport = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        deviceId,
        configHash: generatedHash,
        evidenceLogUrl,
        hashValidationStatus,
        logScanResult,
        finalStatus,
        geminiReport,
    };
    
    await delay(500);
    setArchStatuses(prev => ({ ...prev, complianceAgent: finalStatus, firestore: ComplianceStatus.RUNNING }));
    
    // 6. Firestore
    setReports(prevReports => [newReport, ...prevReports]);
    await delay(500);
    setArchStatuses(prev => ({ ...prev, firestore: ComplianceStatus.COMPLIANT }));

    setIsLoading(false);

  }, [isTampered]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-grow">
              <h2 className="text-xl font-bold">Simulation Control</h2>
              <p className="text-gray-400">Trigger the event-driven workflow. Toggle 'Simulate Tampering' to test failure conditions.</p>
            </div>
            <div className="flex items-center gap-4">
               <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isTampered} onChange={() => setIsTampered(!isTampered)} className="sr-only peer" disabled={isLoading} />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">Simulate Tampering</span>
              </label>
              <button
                onClick={triggerInspection}
                disabled={isLoading}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                  </>
                ) : 'Trigger Inspector Agent'}
              </button>
            </div>
          </div>
        </div>
        
        <ArchitectureDiagram statuses={archStatuses} />

        <ComplianceAgentDetail statuses={agentStatuses} />

        <ReportTable reports={reports} />
      </main>
      
      <div className="fixed bottom-6 right-6 z-50">
          <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-transform transform hover:scale-110"
              aria-label="Toggle Chatbot"
            >
              <ChatIcon className="w-8 h-8" />
          </button>
      </div>

      {isChatOpen && <Chatbot onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default App;
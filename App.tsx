
import React, { useState, useCallback, useEffect } from 'react';
import { ComplianceLog, ComplianceStatus } from './types';
import { getComplianceReasoning } from './services/geminiService';
import Header from './components/Header';
import AgentCard from './components/AgentCard';
import LogTable from './components/LogTable';
import { PubSubIcon, FirestoreIcon } from './components/icons';

const PCI_BASELINE_CONFIG = "pci_baseline_v1.2";
const TAMPERED_CONFIG = "pci_baseline_v1.2_tampered_config";
const EXPECTED_HASH_PROMISE = (async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(PCI_BASELINE_CONFIG);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
})();


const App: React.FC = () => {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTampered, setIsTampered] = useState(false);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<string>('Idle. Ready to inspect.');
  // Fix: Use state to manage and display the resolved promise value for the expected hash.
  const [expectedHash, setExpectedHash] = useState<string | null>(null);

  useEffect(() => {
    EXPECTED_HASH_PROMISE.then(hash => {
      setExpectedHash(hash);
    });
  }, []);

  const runInspection = useCallback(async () => {
    setIsLoading(true);
    setCurrentHash(null);
    setAgentStatus('Inspector Agent: Generating configuration hash...');
    
    const configToHash = isTampered ? TAMPERED_CONFIG : PCI_BASELINE_CONFIG;
    const encoder = new TextEncoder();
    const data = encoder.encode(configToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const generatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    setCurrentHash(generatedHash);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setAgentStatus('Inspector Agent: Publishing hash to Pub/Sub...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setAgentStatus('Compliance Agent: Received hash. Validating...');
    const expectedHashValue = await EXPECTED_HASH_PROMISE;
    const status = generatedHash === expectedHashValue ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT;
    const requirementId = "Req-2.2";

    await new Promise(resolve => setTimeout(resolve, 1000));
    setAgentStatus(`Compliance Agent: Hash is ${status}. Fetching analysis from Gemini...`);
    
    const reasoning = await getComplianceReasoning(status, requirementId);

    const newLog: ComplianceLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      hash: generatedHash,
      status,
      requirementId,
      reasoning
    };

    setLogs(prevLogs => [newLog, ...prevLogs]);
    setAgentStatus('Compliance Agent: Stored result in Firestore. System is idle.');
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
              <p className="text-gray-400">Trigger a simulated compliance check. Toggle 'Simulate Tampering' to test failure conditions.</p>
            </div>
            <div className="flex items-center gap-4">
               <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isTampered} onChange={() => setIsTampered(!isTampered)} className="sr-only peer" disabled={isLoading} />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">Simulate Tampering</span>
              </label>
              <button
                onClick={runInspection}
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
                ) : 'Run Hourly Inspection'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AgentCard title="Inspector Agent" description="Simulates a device generating and publishing configuration hashes." icon={<PubSubIcon className="w-8 h-8"/>}>
            <p><span className="font-semibold text-gray-300">Configuration Source:</span> <span className={`font-mono p-1 rounded ${isTampered ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>{isTampered ? TAMPERED_CONFIG : PCI_BASELINE_CONFIG}</span></p>
            <p><span className="font-semibold text-gray-300">Generated SHA-256 Hash:</span></p>
            <div className="font-mono text-cyan-400 bg-gray-900 p-2 rounded break-all h-20 overflow-y-auto">{currentHash || '...'}</div>
             <p><span className="font-semibold text-gray-300">Status:</span> <span className="text-yellow-300">{agentStatus}</span></p>
          </AgentCard>

          <AgentCard title="Compliance Agent" description="Listens for hashes, validates them, and logs the result." icon={<FirestoreIcon className="w-8 h-8"/>}>
             <p><span className="font-semibold text-gray-300">Expected Baseline Hash:</span></p>
             {/* Fix: Display the expected hash from state and remove the incorrect script tag. */}
             <div className="font-mono text-green-400 bg-gray-900 p-2 rounded break-all h-20 overflow-y-auto">{expectedHash || 'loading...'}</div>
             <p><span className="font-semibold text-gray-300">Last Action:</span> <span className="text-gray-400">{logs.length > 0 ? `Logged ${logs[0].status} status at ${new Date(logs[0].timestamp).toLocaleTimeString()}` : 'Awaiting inspection.'}</span></p>
          </AgentCard>
        </div>

        <LogTable logs={logs} />
      </main>
    </div>
  );
};

export default App;

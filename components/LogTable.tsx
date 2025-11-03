
import React from 'react';
import { ComplianceLog, ComplianceStatus } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';

interface LogTableProps {
  logs: ComplianceLog[];
}

const StatusIndicator: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  switch (status) {
    case ComplianceStatus.COMPLIANT:
      return <span className="flex items-center text-green-400"><CheckCircleIcon className="w-5 h-5 mr-2" /> Compliant</span>;
    case ComplianceStatus.NON_COMPLIANT:
      return <span className="flex items-center text-red-400"><XCircleIcon className="w-5 h-5 mr-2" /> Non-Compliant</span>;
    default:
      return <span className="flex items-center text-yellow-400"><ClockIcon className="w-5 h-5 mr-2" /> Pending</span>;
  }
};


const LogTable: React.FC<LogTableProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold">No Compliance Logs</h3>
        <p className="text-gray-400 mt-1">Run an inspection to see results here.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
        <h3 className="text-xl font-bold text-white p-4 border-b border-gray-700">Compliance Log (Firestore Simulation)</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3">Timestamp</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Requirement</th>
                    <th scope="col" className="px-6 py-3">Generated Hash</th>
                    <th scope="col" className="px-6 py-3">Gemini Analysis</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((log) => (
                    <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                    <td className="px-6 py-4 font-mono">{log.timestamp}</td>
                    <td className="px-6 py-4"><StatusIndicator status={log.status} /></td>
                    <td className="px-6 py-4">{log.requirementId}</td>
                    <td className="px-6 py-4 font-mono text-cyan-300 break-all">{log.hash}</td>
                    <td className="px-6 py-4 text-gray-400">{log.reasoning}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default LogTable;

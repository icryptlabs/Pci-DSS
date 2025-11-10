
import React from 'react';
import { ComplianceReport, ComplianceStatus } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';

declare global {
    interface Window {
        marked: any;
    }
}

interface ReportTableProps {
  reports: ComplianceReport[];
}

const StatusIndicator: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  switch (status) {
    case ComplianceStatus.COMPLIANT:
      return <span className="flex items-center text-green-400 text-xs md:text-sm"><CheckCircleIcon className="w-5 h-5 mr-2" /> Compliant</span>;
    case ComplianceStatus.NON_COMPLIANT:
      return <span className="flex items-center text-red-400 text-xs md:text-sm"><XCircleIcon className="w-5 h-5 mr-2" /> Non-Compliant</span>;
    default:
      return <span className="flex items-center text-yellow-400 text-xs md:text-sm"><ClockIcon className="w-5 h-5 mr-2" /> Pending</span>;
  }
};


const ReportTable: React.FC<ReportTableProps> = ({ reports }) => {
  if (reports.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold">No Compliance Reports</h3>
        <p className="text-gray-400 mt-1">Trigger an inspection to see results here.</p>
      </div>
    );
  }

  const renderMarkdown = (markdown: string) => {
    if (window.marked) {
        const html = window.marked.parse(markdown);
        return { __html: html };
    }
    return {__html: "<p>Markdown renderer not available.</p>" }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
        <h3 className="text-xl font-bold text-white p-4 border-b border-gray-700">Compliance Reports (Firestore Real-time Simulation)</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3">Timestamp</th>
                    <th scope="col" className="px-6 py-3">Device ID</th>
                    <th scope="col" className="px-6 py-3">Final Status</th>
                    <th scope="col" className="px-6 py-3">Details</th>
                    <th scope="col" className="px-6 py-3">Gemini Report</th>
                </tr>
                </thead>
                <tbody>
                {reports.map((report) => (
                    <tr key={report.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                    <td className="px-6 py-4 font-mono align-top">{new Date(report.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono align-top">{report.deviceId}</td>
                    <td className="px-6 py-4 align-top"><StatusIndicator status={report.finalStatus} /></td>
                    <td className="px-6 py-4 align-top space-y-2">
                        <p><strong className="text-gray-400">Hash Check:</strong> <StatusIndicator status={report.hashValidationStatus} /></p>
                        <p><strong className="text-gray-400">Log Scan:</strong> <StatusIndicator status={report.logScanResult.status} /></p>
                        <p className="font-mono text-xs text-cyan-300 break-all" title={report.configHash}>Hash: {report.configHash.substring(0,10)}...</p>
                        <a href={report.evidenceLogUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs block">Evidence Log</a>
                    </td>
                    <td className="px-6 py-4 text-gray-400 prose prose-invert prose-sm max-w-lg" dangerouslySetInnerHTML={renderMarkdown(report.geminiReport)}></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default ReportTable;

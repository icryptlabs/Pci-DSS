
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-6 border-b border-gray-700">
      <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">PCI DSS Compliance Monitoring Dashboard</h1>
      <p className="text-md text-gray-400 mt-2">
        Simulating a multi-agent system for automated compliance verification.
      </p>
    </header>
  );
};

export default Header;

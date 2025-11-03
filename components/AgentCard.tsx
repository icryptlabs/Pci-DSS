
import React from 'react';

interface AgentCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const AgentCard: React.FC<AgentCardProps> = ({ title, description, children, icon }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <div className="text-cyan-400 mr-4">{icon}</div>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="flex-grow space-y-4 text-sm">{children}</div>
    </div>
  );
};

export default AgentCard;

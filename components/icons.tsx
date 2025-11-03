
import React from 'react';

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const PubSubIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.38 5.62L6.32 2.34L.25 5.62v6.75l6.06 3.28l6.07-3.28V5.62zm-1.13 6.07l-4.7 2.54v-5.1l4.7-2.53v5.09zm1.13-4.1V2.5l6.06 3.28v6.75l-6.06 3.28v-5.09l4.7-2.54v-5.1l-4.7 2.54z" />
        <path d="M12.38 12.38L6.32 9.09l-6.07 3.28v6.75l6.07 3.28l6.06-3.28v-6.75zm-1.13 6.07l-4.7 2.54v-5.1l4.7-2.53v5.09zm1.13-4.1V9.25l6.06 3.28v6.75l-6.06 3.28v-5.09l4.7-2.54v-5.1l-4.7 2.54z" />
    </svg>
);

export const FirestoreIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4.82 10.59L12 2.12l7.18 8.47l-1.9 1.62l-5.28-6.22l-5.28 6.22zM18.82 12l-6.82 8.05l-6.82-8.05L3 13.41l9 10.59l9-10.59z" />
    </svg>
);

import React from 'react';

export const HdIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h3v16H3V4zm7 0h3v16h-3V4zm7 0h3v7h-3V4zm0 9h3v7h-3v-7z" />
  </svg>
);
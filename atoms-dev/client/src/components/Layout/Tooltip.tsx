import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-secondary text-text-secondary text-xs rounded whitespace-nowrap border border-border z-10">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-l-4 border-l-transparent border-t-4 border-t-bg-secondary border-r-4 border-r-transparent"></div>
        </div>
      )}
    </div>
  );
};

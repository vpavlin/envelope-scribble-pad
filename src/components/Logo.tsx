
import React from "react";

export interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={className}>
      <h1 className="text-xl font-bold">Note Envelopes</h1>
    </div>
  );
};

export default Logo;

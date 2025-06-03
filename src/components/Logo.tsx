
import React from "react";
import { Mail } from "lucide-react";

export interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Mail className="h-6 w-6 text-blue-600 mr-2" />
      <h1 className="text-xl font-bold">Lope</h1>
    </div>
  );
};

export default Logo;

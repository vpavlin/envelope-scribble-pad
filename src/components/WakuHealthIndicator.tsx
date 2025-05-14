
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CircleX, CircleAlert, CircleCheck, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isWakuInitialized } from "@/utils/wakuSync";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type WakuHealthStatus = "unhealthy" | "minimally-healthy" | "sufficiently-healthy" | "unknown";

const healthStatusConfig = {
  "unhealthy": {
    color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    icon: <CircleX className="h-3.5 w-3.5 mr-1" />,
    label: "Unhealthy",
    description: "Waku node is not functioning properly"
  },
  "minimally-healthy": {
    color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    icon: <CircleAlert className="h-3.5 w-3.5 mr-1" />,
    label: "Minimally Healthy",
    description: "Waku node has minimal functionality"
  },
  "sufficiently-healthy": {
    color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    icon: <CircleCheck className="h-3.5 w-3.5 mr-1" />,
    label: "Healthy",
    description: "Waku node is functioning properly"
  },
  "unknown": {
    color: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
    icon: <Network className="h-3.5 w-3.5 mr-1" />,
    label: "Unknown",
    description: "Waku node status is unknown or sync is disabled"
  }
};

const WakuHealthIndicator = () => {
  const [healthStatus, setHealthStatus] = useState<WakuHealthStatus>("unknown");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  useEffect(() => {
    // Function to update health status based on Waku node events
    const updateHealthStatus = () => {
      if (!isWakuInitialized()) {
        setHealthStatus("unknown");
        setIsConnected(false);
        return;
      }

      // Get dispatcher from window global (it's added by the wakuSync utility)
      const dispatcher = (window as any).wakuDispatcher;
      if (!dispatcher || !dispatcher.node) {
        setHealthStatus("unknown");
        setIsConnected(false);
        return;
      }

      setIsConnected(true);
      
      // Subscribe to health status changes
      const unsubscribeHealthStatus = dispatcher.node.libp2p.addEventListener('peer:discovery', () => {
        // Check peer count to determine health
        const peerCount = dispatcher.node.libp2p.getPeers().length;
        
        if (peerCount === 0) {
          setHealthStatus("unhealthy");
        } else if (peerCount < 2) {
          setHealthStatus("minimally-healthy");
        } else {
          setHealthStatus("sufficiently-healthy");
        }
      });

      // Initial health check
      const peerCount = dispatcher.node.libp2p.getPeers().length;
      if (peerCount === 0) {
        setHealthStatus("unhealthy");
      } else if (peerCount < 2) {
        setHealthStatus("minimally-healthy");
      } else {
        setHealthStatus("sufficiently-healthy");
      }

      // Cleanup function
      return () => {
        if (unsubscribeHealthStatus) {
          dispatcher.node.libp2p.removeEventListener('peer:discovery', unsubscribeHealthStatus);
        }
      };
    };

    // Set up an interval to check Waku status periodically
    updateHealthStatus();
    const intervalId = setInterval(updateHealthStatus, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const config = healthStatusConfig[healthStatus];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Badge 
              variant="outline"
              className={cn("flex items-center", config.color)}
            >
              <Network className="h-3.5 w-3.5 mr-1" />
              Waku {isConnected ? config.label : "Disconnected"}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">Waku P2P Sync Status</p>
            <p>{config.description}</p>
            {!isConnected && <p className="italic mt-1">Enable sync in settings for cross-device functionality</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WakuHealthIndicator;

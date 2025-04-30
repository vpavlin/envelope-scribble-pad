
import React, { useState, useEffect } from "react";
import { ChevronLeft, Key, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { initializeWaku, getSyncConfig, setSyncConfig } from "@/utils/wakuSync";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [syncPassword, setSyncPassword] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isSyncInitializing, setIsSyncInitializing] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Load the API key from localStorage on component mount
    const savedApiKey = localStorage.getItem("akash-api-key") || "";
    setApiKey(savedApiKey);
    
    // Load sync config
    const syncConfig = getSyncConfig();
    setSyncPassword(syncConfig.password);
    setSyncEnabled(syncConfig.enabled);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem("akash-api-key", apiKey);
    toast.success("API key saved successfully");
  };

  const clearApiKey = () => {
    localStorage.removeItem("akash-api-key");
    setApiKey("");
    toast.success("API key removed");
  };
  
  const toggleSync = async (enabled: boolean) => {
    if (enabled && !syncPassword) {
      toast.error("Please enter a sync password first");
      return;
    }
    
    setSyncEnabled(enabled);
    setSyncConfig({ password: syncPassword, enabled });
    
    if (enabled) {
      setIsSyncInitializing(true);
      const success = await initializeWaku(syncPassword);
      setIsSyncInitializing(false);
      
      if (success) {
        toast.success("Cross-device sync initialized successfully");
      } else {
        setSyncEnabled(false);
        setSyncConfig({ password: syncPassword, enabled: false });
        toast.error("Failed to initialize cross-device sync");
      }
    }
  };
  
  const saveSyncPassword = async () => {
    if (!syncPassword) {
      toast.error("Please enter a sync password");
      return;
    }
    
    setSyncConfig({ password: syncPassword, enabled: syncEnabled });
    toast.success("Sync password saved");
    
    // If sync is already enabled, reinitialize Waku with the new password
    if (syncEnabled) {
      setIsSyncInitializing(true);
      const success = await initializeWaku(syncPassword);
      setIsSyncInitializing(false);
      
      if (success) {
        toast.success("Cross-device sync reinitialized with new password");
      } else {
        toast.error("Failed to reinitialize cross-device sync");
      }
    }
  };

  return (
    <div className={`container ${isMobile ? "px-4 py-6" : "max-w-4xl py-10"}`}>
      <div className="mb-6">
        <Link to="/" className="flex items-center text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Notes
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold tracking-tight`}>Settings</h1>
        <p className="text-muted-foreground">Configure your application preferences</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5" />
              Cross-Device Sync
            </CardTitle>
            <CardDescription>
              Enable synchronization of notes across multiple devices using secure encrypted communication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sync-toggle">Enable Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Synchronize your notes across all your devices
                  </p>
                </div>
                <Switch 
                  id="sync-toggle" 
                  checked={syncEnabled}
                  onCheckedChange={toggleSync}
                  disabled={isSyncInitializing || !syncPassword}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="syncPassword">Sync Password</Label>
                <p className="text-xs text-muted-foreground">
                  This password is used to encrypt your data during synchronization. 
                  Make sure to remember this password as it cannot be recovered.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="syncPassword"
                    type="password"
                    placeholder="Enter sync password"
                    value={syncPassword}
                    onChange={(e) => setSyncPassword(e.target.value)}
                  />
                  <Button 
                    onClick={saveSyncPassword}
                    disabled={!syncPassword || isSyncInitializing}
                    className="whitespace-nowrap"
                  >
                    Save Password
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Akash Chat API Configuration
            </CardTitle>
            <CardDescription>
              Configure your Akash Chat API key to enable AI features like note summarization and enhancement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter Akash API key (sk-xxxxxxxx)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely in your browser&apos;s local storage.
              </p>
            </div>
          </CardContent>
          <CardFooter className={`${isMobile ? "flex-col space-y-2" : "flex justify-between"}`}>
            <Button 
              variant="outline" 
              onClick={clearApiKey}
              className={isMobile ? "w-full" : ""}
            >
              Clear API Key
            </Button>
            <Button 
              onClick={saveApiKey} 
              disabled={!apiKey}
              className={isMobile ? "w-full" : ""}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

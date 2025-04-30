
import React, { useState, useEffect } from "react";
import { ChevronLeft, Key, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    // Load the API key from localStorage on component mount
    const savedApiKey = localStorage.getItem("akash-api-key") || "";
    setApiKey(savedApiKey);
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

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link to="/" className="flex items-center text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Notes
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your application preferences</p>
      </div>

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
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={clearApiKey}>
            Clear API Key
          </Button>
          <Button onClick={saveApiKey} disabled={!apiKey}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Settings;

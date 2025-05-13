import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Key, Save, RefreshCw, Eye, EyeOff, QrCode, FileDown, FileUp, Plus, Trash2, Edit, Sparkles, Network, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { initializeWaku, getSyncConfig, setSyncConfig, generateSecurePassword } from "@/utils/wakuSync";
import { exportAllData, importAllData, downloadJson, readFileAsText } from "@/utils/exportImport";
import { useNotes } from "@/context/NotesContext";
import { getConfiguredPrompts, savePromptConfig } from "@/utils/aiUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";

// Schema for custom prompt form
const customPromptSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Button label is required"),
  description: z.string().min(1, "Description is required"),
  prompt: z.string().min(1, "Prompt text is required"),
  systemPrompt: z.string().optional()
});

// Schema for built-in prompt form
const builtInPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt text is required"),
  systemPrompt: z.string().min(1, "System prompt is required")
});

const Settings = () => {
  // AI Prompts state
  const [apiKey, setApiKey] = useState("");
  const [syncPassword, setSyncPassword] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isSyncInitializing, setIsSyncInitializing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notes, envelopes, labels } = useNotes();
  const isMobile = useIsMobile();
  const [promptConfig, setPromptConfig] = useState<any>({});
  const [customPrompts, setCustomPrompts] = useState<any[]>([]);
  const [isEditingPrompt, setIsEditingPrompt] = useState<string | null>(null);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState<"summary" | "enhancement" | null>(null);

  // Forms
  const customPromptForm = useForm<z.infer<typeof customPromptSchema>>({
    resolver: zodResolver(customPromptSchema),
    defaultValues: {
      label: "",
      description: "",
      prompt: "",
      systemPrompt: "You are a helpful assistant analyzing the provided text."
    }
  });

  const summaryPromptForm = useForm<z.infer<typeof builtInPromptSchema>>({
    resolver: zodResolver(builtInPromptSchema),
    defaultValues: {
      prompt: "",
      systemPrompt: ""
    }
  });
  
  const enhancementPromptForm = useForm<z.infer<typeof builtInPromptSchema>>({
    resolver: zodResolver(builtInPromptSchema),
    defaultValues: {
      prompt: "",
      systemPrompt: ""
    }
  });

  useEffect(() => {
    // Load the API key from localStorage on component mount
    const savedApiKey = localStorage.getItem("akash-api-key") || "";
    setApiKey(savedApiKey);
    
    // Load sync config
    const syncConfig = getSyncConfig();
    setSyncPassword(syncConfig.password);
    setSyncEnabled(syncConfig.enabled);
    
    // Load AI prompts config
    loadPromptConfig();
  }, []);
  
  const loadPromptConfig = () => {
    const allPrompts = getConfiguredPrompts();
    const savedConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
    
    // Set custom prompts
    setCustomPrompts(savedConfig.customPrompts || []);
    
    // Set overall config
    setPromptConfig(savedConfig);
    
    // Set form values for built-in prompts
    const summaryPrompt = allPrompts.find(p => p.id === "summary");
    if (summaryPrompt) {
      summaryPromptForm.reset({
        prompt: summaryPrompt.prompt,
        systemPrompt: summaryPrompt.systemPrompt || ""
      });
    }
    
    const enhancePrompt = allPrompts.find(p => p.id === "enhancement");
    if (enhancePrompt) {
      enhancementPromptForm.reset({
        prompt: enhancePrompt.prompt,
        systemPrompt: enhancePrompt.systemPrompt || ""
      });
    }
  };

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
      try {
        await initializeWaku(syncPassword);
        toast.success("Cross-device sync initialized successfully");
      } catch (error) {
        console.error("Error initializing Waku:", error);
        setSyncEnabled(false);
        setSyncConfig({ password: syncPassword, enabled: false });
        toast.error("Failed to initialize cross-device sync");
      } finally {
        setIsSyncInitializing(false);
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
      try {
        await initializeWaku(syncPassword);
        toast.success("Cross-device sync reinitialized with new password");
      } catch (error) {
        console.error("Error reinitializing Waku:", error);
        toast.error("Failed to reinitialize cross-device sync");
      } finally {
        setIsSyncInitializing(false);
      }
    }
  };

  const generatePassword = () => {
    const newPassword = generateSecurePassword();
    setSyncPassword(newPassword);
    setSyncConfig({ password: newPassword, enabled: syncEnabled });
    toast.success("New secure password generated");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // AI Prompt handling functions
  const handleSaveBuiltInPrompt = (type: "summary" | "enhancement") => {
    const form = type === "summary" ? summaryPromptForm : enhancementPromptForm;
    const formData = form.getValues();
    
    const newConfig = { ...promptConfig };
    newConfig[type] = {
      prompt: formData.prompt,
      systemPrompt: formData.systemPrompt
    };
    
    savePromptConfig(newConfig);
    setPromptConfig(newConfig);
    
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} prompt updated`);
    setSelectedPromptType(null);
  };
  
  const handleAddCustomPrompt = (data: z.infer<typeof customPromptSchema>) => {
    const newPrompt = {
      ...data,
      id: data.id || uuidv4()
    };
    
    let updatedPrompts;
    
    if (isEditingPrompt) {
      // Update existing prompt
      updatedPrompts = customPrompts.map(prompt => 
        prompt.id === isEditingPrompt ? newPrompt : prompt
      );
    } else {
      // Add new prompt
      updatedPrompts = [...customPrompts, newPrompt];
    }
    
    const newConfig = { 
      ...promptConfig,
      customPrompts: updatedPrompts
    };
    
    savePromptConfig(newConfig);
    setCustomPrompts(updatedPrompts);
    setPromptConfig(newConfig);
    setIsPromptDialogOpen(false);
    setIsEditingPrompt(null);
    
    toast.success(isEditingPrompt ? "Custom prompt updated" : "Custom prompt added");
    
    // Reset form
    customPromptForm.reset({
      label: "",
      description: "",
      prompt: "",
      systemPrompt: "You are a helpful assistant analyzing the provided text."
    });
  };
  
  const handleEditCustomPrompt = (promptId: string) => {
    const prompt = customPrompts.find(p => p.id === promptId);
    if (prompt) {
      customPromptForm.reset({
        id: prompt.id,
        label: prompt.label,
        description: prompt.description,
        prompt: prompt.prompt,
        systemPrompt: prompt.systemPrompt || "You are a helpful assistant analyzing the provided text."
      });
      
      setIsEditingPrompt(promptId);
      setIsPromptDialogOpen(true);
    }
  };
  
  const handleDeleteCustomPrompt = (promptId: string) => {
    const updatedPrompts = customPrompts.filter(p => p.id !== promptId);
    
    const newConfig = { 
      ...promptConfig,
      customPrompts: updatedPrompts
    };
    
    savePromptConfig(newConfig);
    setCustomPrompts(updatedPrompts);
    setPromptConfig(newConfig);
    
    toast.success("Custom prompt removed");
  };
  
  const openBuiltInPromptEditor = (type: "summary" | "enhancement") => {
    setSelectedPromptType(type);
  };
  
  const openNewCustomPromptDialog = () => {
    setIsEditingPrompt(null);
    customPromptForm.reset({
      label: "",
      description: "",
      prompt: "",
      systemPrompt: "You are a helpful assistant analyzing the provided text."
    });
    setIsPromptDialogOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      downloadJson(data, `noteenvelope-export-${date}.json`);
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const jsonData = await readFileAsText(file);
      
      // Preview the data to let the user confirm
      const dataObj = JSON.parse(jsonData);
      const noteCount = dataObj.notes?.length || 0;
      const envelopeCount = dataObj.envelopes?.length || 0;
      const labelCount = dataObj.labels?.length || 0;
      
      // Reset file input for future imports
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Show preview dialog with counts
      document.getElementById("import-dialog-trigger")?.click();
      
      // Store the data in a state or ref to use when the user confirms
      (window as any).importData = jsonData;
      
      // Update UI with counts
      document.getElementById("import-notes-count")!.textContent = noteCount.toString();
      document.getElementById("import-envelopes-count")!.textContent = envelopeCount.toString();
      document.getElementById("import-labels-count")!.textContent = labelCount.toString();
      
    } catch (error) {
      console.error("Error reading import file:", error);
      toast.error("Invalid import file format");
    }
  };
  
  const confirmImport = async () => {
    setIsImporting(true);
    try {
      const jsonData = (window as any).importData;
      if (!jsonData) {
        throw new Error("No import data found");
      }
      
      await importAllData(jsonData);
      toast.success("Data imported successfully");
      
      // Clean up
      (window as any).importData = null;
      
      // Recommend refresh
      setTimeout(() => {
        toast("Please refresh the page to see imported data", {
          action: {
            label: "Refresh",
            onClick: () => window.location.reload()
          }
        });
      }, 1000);
      
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import data");
    } finally {
      setIsImporting(false);
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
        {/* AI Prompts Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              AI Prompts Configuration
            </CardTitle>
            <CardDescription>
              Customize built-in AI prompts and create your own custom prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="builtin" className="space-y-4">
              <TabsList>
                <TabsTrigger value="builtin">Built-in Prompts</TabsTrigger>
                <TabsTrigger value="custom">Custom Prompts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="builtin" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Built-in Prompts</h3>
                  <p className="text-sm text-muted-foreground">Customize the default prompts used for summarizing and enhancing notes.</p>
                  
                  <div className="space-y-4 mt-4">
                    {/* Summary Prompt */}
                    <Card>
                      <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Summarize</CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openBuiltInPromptEditor("summary")}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </div>
                        <CardDescription>
                          Generate a concise summary of the note
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    
                    {/* Enhancement Prompt */}
                    <Card>
                      <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Enhance</CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openBuiltInPromptEditor("enhancement")}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </div>
                        <CardDescription>
                          Get suggestions to improve the note
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Custom Prompts</h3>
                    <Button onClick={openNewCustomPromptDialog}>
                      <Plus className="h-4 w-4 mr-1" /> Add Prompt
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Create your own AI prompts to appear in the note editor.</p>
                  
                  {customPrompts.length === 0 ? (
                    <Card className="p-4 border-dashed bg-muted/50 my-4">
                      <p className="text-center text-muted-foreground">
                        No custom prompts created yet. Create one to get started.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {customPrompts.map(prompt => (
                        <Card key={prompt.id}>
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{prompt.label}</CardTitle>
                              <div className="space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditCustomPrompt(prompt.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteCustomPrompt(prompt.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <CardDescription>
                              {prompt.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileDown className="mr-2 h-5 w-5" />
              Data Export & Import
            </CardTitle>
            <CardDescription>
              Export all your data for backup or import data from another device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">
                  You currently have <strong>{notes.length} notes</strong>, <strong>{envelopes.length} envelopes</strong>, and <strong>{labels.length} labels</strong>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleExport} 
                    disabled={isExporting}
                    className="flex items-center"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export All Data"}
                  </Button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={handleFileSelection}
                  />
                  
                  <Button 
                    variant="outline" 
                    onClick={handleImportClick}
                    className="flex items-center"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                The exported file includes all your notes, envelopes, labels, comments, and attachments.
                You can use it to transfer your data to another device or as a backup.
              </p>
            </div>
          </CardContent>
        </Card>

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
                  This password is used to encrypt your data during synchronization and to create a private channel. 
                  Make sure to remember this password as it cannot be recovered.
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <Input
                      id="syncPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter sync password"
                      value={syncPassword}
                      onChange={(e) => setSyncPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={saveSyncPassword}
                    disabled={!syncPassword || isSyncInitializing}
                    className="whitespace-nowrap"
                  >
                    Save Password
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="outline"
                    onClick={generatePassword}
                    disabled={isSyncInitializing}
                  >
                    Generate Secure Password
                  </Button>
                  
                  {syncPassword && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <QrCode className="mr-2 h-4 w-4" />
                          Show QR Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Sync Password QR Code</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center p-6">
                          <QRCodeSVG 
                            value={syncPassword} 
                            size={200} 
                            level="H"
                          />
                          <p className="mt-4 text-center text-sm text-muted-foreground">
                            Scan this QR code on another device to enter the same sync password
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5" />
              About Waku P2P Network
            </CardTitle>
            <CardDescription>
              Learn about the decentralized technology powering cross-device synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                NoteEnvelope uses <strong>Waku</strong>, a privacy-preserving, decentralized communication protocol 
                for secure synchronization between your devices. Unlike traditional cloud sync services, Waku:
              </p>
              
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>Encrypts your data end-to-end for maximum privacy</li>
                <li>Operates in a decentralized manner with no central server storing your notes</li>
                <li>Uses peer-to-peer technology to sync directly between your devices</li>
                <li>Requires no account creation or personal information</li>
              </ul>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
                <h4 className="text-sm font-medium mb-2">How Your Data Stays Private</h4>
                <p className="text-sm text-muted-foreground">
                  Your notes are encrypted with your sync password before leaving your device. 
                  Only devices with the same password can decrypt and access your notes.
                  The password itself is never transmitted over the network.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://waku.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    Learn more about Waku
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </Button>
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
      
      {/* Hidden AlertDialog for import confirmation */}
      <AlertDialog>
        <AlertDialogTrigger id="import-dialog-trigger" className="hidden">Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Data</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import:
              <ul className="list-disc pl-5 mt-2">
                <li><span id="import-notes-count">0</span> notes</li>
                <li><span id="import-envelopes-count">0</span> envelopes</li>
                <li><span id="import-labels-count">0</span> labels</li>
              </ul>
              <p className="mt-2">
                This will overwrite your existing data. Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} disabled={isImporting}>
              {isImporting ? "Importing..." : "Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Custom Prompt Dialog */}
      <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditingPrompt ? "Edit Custom Prompt" : "Add Custom Prompt"}</DialogTitle>
            <DialogDescription>
              Create a custom AI prompt that will appear in the note editor.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...customPromptForm}>
            <form onSubmit={customPromptForm.handleSubmit(handleAddCustomPrompt)} className="space-y-4">
              <FormField
                control={customPromptForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Action Items" {...field} />
                    </FormControl>
                    <FormDescription>
                      The text that will appear on the button in the UI.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customPromptForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Extract action items from the note" {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief description of what this prompt does.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customPromptForm.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Extract action items and tasks from this note and format them as a checklist:" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The specific instructions sent to the AI. The note content will be appended to this prompt.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customPromptForm.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., You are an assistant that helps organize tasks and action items." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Context instructions for the AI that define its role or approach.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPromptDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditingPrompt ? "Update Prompt" : "Add Prompt"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Built-in Prompt Edit Dialog */}
      <Dialog 
        open={selectedPromptType !== null} 
        onOpenChange={(open) => !open && setSelectedPromptType(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit {selectedPromptType === "summary" ? "Summary" : "Enhancement"} Prompt
            </DialogTitle>
            <DialogDescription>
              Customize the built-in {selectedPromptType === "summary" ? "summary" : "enhancement"} prompt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromptType === "summary" && (
            <Form {...summaryPromptForm}>
              <form className="space-y-4">
                <FormField
                  control={summaryPromptForm.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[100px]" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The specific instructions sent to the AI.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={summaryPromptForm.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[80px]" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Context instructions for the AI that define its role or approach.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedPromptType(null)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => handleSaveBuiltInPrompt("summary")}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
          
          {selectedPromptType === "enhancement" && (
            <Form {...enhancementPromptForm}>
              <form className="space-y-4">
                <FormField
                  control={enhancementPromptForm.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[100px]" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The specific instructions sent to the AI.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={enhancementPromptForm.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[80px]" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Context instructions for the AI that define its role or approach.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedPromptType(null)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => handleSaveBuiltInPrompt("enhancement")}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

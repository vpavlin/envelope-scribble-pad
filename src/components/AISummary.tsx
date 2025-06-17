
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lightbulb, RefreshCw, Settings, Plus } from "lucide-react";
import { AISummary as AISummaryType } from "@/types/note";
import { 
  getNoteSummary, 
  getNoteEnhancement, 
  executeCustomPrompt, 
  getConfiguredPrompts 
} from "@/utils/aiUtils";
import { useNotes } from "@/context/NotesContext";
import { Link } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";

interface AISummaryProps {
  noteId: string;
  noteContent: string;
  summaries?: AISummaryType[];
}

interface PromptConfig {
  id: string;
  label: string;
  description: string;
  prompt: string;
  systemPrompt?: string;
  builtin?: boolean;
}

const AISummary: React.FC<AISummaryProps> = ({ noteId, noteContent, summaries = [] }) => {
  const { updateNote } = useNotes();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [storedApiKey, setStoredApiKey] = useState(
    localStorage.getItem("akash-api-key") || ""
  );
  const [configuredPrompts, setConfiguredPrompts] = useState<PromptConfig[]>([]);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);

  const hasApiKey = !!storedApiKey;
  const hasSummaries = summaries.length > 0;

  // Load configured prompts
  useEffect(() => {
    const prompts = getConfiguredPrompts();
    setConfiguredPrompts(prompts);
  }, []);

  const handleGenerateContent = async (promptId: string) => {
    if (!storedApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setCurrentPromptId(promptId);
    
    try {
      let content: string;
      const promptConfig = configuredPrompts.find(p => p.id === promptId);
      
      if (!promptConfig) {
        throw new Error("Prompt configuration not found");
      }
      
      // Handle built-in prompts with specific functions
      if (promptId === 'summary') {
        content = await getNoteSummary(noteContent, storedApiKey);
      } else if (promptId === 'enhancement') {
        content = await getNoteEnhancement(noteContent, storedApiKey);
      } else {
        // Handle custom prompts
        content = await executeCustomPrompt(noteContent, storedApiKey, promptId);
      }
      
      const newSummary: AISummaryType = {
        content,
        generatedAt: new Date().toISOString(),
        type: promptId
      };

      // Replace existing summary of the same type or add new one
      const currentSummaries = summaries || [];
      const updatedSummaries = currentSummaries.filter(summary => summary.type !== promptId);
      updatedSummaries.push(newSummary);

      updateNote(noteId, {
        aiSummaries: updatedSummaries
      });

      toast.success(`AI ${promptConfig.label.toLowerCase()} generated successfully`);
    } catch (error) {
      console.error("Error generating AI content:", error);
      toast.error("Failed to generate AI content. Please try again.");
    } finally {
      setIsGenerating(false);
      setCurrentPromptId(null);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem("akash-api-key", apiKey);
    setStoredApiKey(apiKey);
    setIsSettingsOpen(false);
    toast.success("API key saved successfully");
  };

  // Group prompts by built-in and custom
  const builtInPrompts = configuredPrompts.filter(p => p.builtin);
  const customPrompts = configuredPrompts.filter(p => !p.builtin);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          AI Insights
        </h3>
        
        <div className="flex space-x-2">
          {/* Built-in prompts as direct buttons */}
          {builtInPrompts.map(prompt => (
            <Button
              key={prompt.id}
              variant="outline"
              size="sm"
              onClick={() => handleGenerateContent(prompt.id)}
              disabled={isGenerating || !noteContent}
              title={prompt.description}
            >
              {isGenerating && currentPromptId === prompt.id ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {prompt.label}
            </Button>
          ))}
          
          {/* Custom prompts in dropdown */}
          {customPrompts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Custom AI Prompts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {customPrompts.map(prompt => (
                  <DropdownMenuItem 
                    key={prompt.id}
                    onClick={() => handleGenerateContent(prompt.id)}
                    disabled={isGenerating}
                  >
                    {prompt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Link to="/settings">
            <Button
              variant="ghost"
              size="sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Display AI summaries if available - limit height to prevent UI overflow */}
      {hasSummaries && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {summaries.map((summary, index) => {
            // Find the prompt configuration for this summary type
            const promptConfig = configuredPrompts.find(p => p.id === summary.type);
            const summaryLabel = promptConfig?.label || 
              (summary.type === 'summary' ? 'Summary' : 
               summary.type === 'enhancement' ? 'Suggestions' : summary.type);
            
            return (
              <Card key={`${summary.type}-${index}`} className="p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  {summaryLabel} • {new Date(summary.generatedAt).toLocaleDateString()}
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {summary.content}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!hasApiKey && !hasSummaries && (
        <Card className="p-3 bg-muted/50 border-dashed">
          <p className="text-sm text-muted-foreground text-center">
            <Link to="/settings" className="hover:underline">
              Configure your Akash API key
            </Link>{" "}
            to get AI-powered insights
          </p>
        </Card>
      )}

      {/* API Key Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akash AI API Settings</DialogTitle>
            <DialogDescription>
              Enter your Akash Chat API key to enable AI features.
              Your API key is stored locally in your browser.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Enter Akash API key (sk-xxxxxxxx)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveApiKey} disabled={!apiKey}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AISummary;

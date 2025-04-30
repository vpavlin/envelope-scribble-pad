import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lightbulb, RefreshCw, Settings } from "lucide-react";
import { AISummary as AISummaryType } from "@/types/note";
import { getNoteSummary, getNoteEnhancement } from "@/utils/aiUtils";
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
import { toast } from "@/components/ui/sonner";
import ReactMarkdown from "react-markdown";

interface AISummaryProps {
  noteId: string;
  noteContent: string;
  summaries?: AISummaryType[];
}

const AISummary: React.FC<AISummaryProps> = ({ noteId, noteContent, summaries = [] }) => {
  const { updateNote } = useNotes();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [storedApiKey, setStoredApiKey] = useState(
    localStorage.getItem("akash-api-key") || ""
  );

  const hasApiKey = !!storedApiKey;
  const hasSummaries = summaries.length > 0;

  const handleGenerateSummary = async (type: 'summary' | 'enhancement') => {
    if (!storedApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const content = type === 'summary' 
        ? await getNoteSummary(noteContent, storedApiKey)
        : await getNoteEnhancement(noteContent, storedApiKey);
      
      const newSummary: AISummaryType = {
        content,
        generatedAt: new Date().toISOString(),
        type
      };

      // Update the note with the new summary
      const currentSummaries = summaries || [];
      updateNote(noteId, {
        aiSummaries: [...currentSummaries, newSummary]
      });

      toast.success(`AI ${type} generated successfully`);
    } catch (error) {
      console.error("Error generating AI content:", error);
      toast.error("Failed to generate AI content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem("akash-api-key", apiKey);
    setStoredApiKey(apiKey);
    setIsSettingsOpen(false);
    toast.success("API key saved successfully");
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          AI Insights
        </h3>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateSummary('summary')}
            disabled={isGenerating || !noteContent}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Summarize
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateSummary('enhancement')}
            disabled={isGenerating || !noteContent}
          >
            Enhance
          </Button>
          
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

      {/* Display AI summaries if available */}
      {hasSummaries && (
        <div className="space-y-2">
          {summaries.slice(-2).map((summary, index) => (
            <Card key={index} className="p-3 text-sm">
              <div className="text-xs text-muted-foreground mb-1">
                {summary.type === 'summary' ? 'Summary' : 'Suggestions'} • {new Date(summary.generatedAt).toLocaleDateString()}
              </div>
              <div className="prose-sm prose max-w-none">
                <ReactMarkdown>{summary.content}</ReactMarkdown>
              </div>
            </Card>
          ))}
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

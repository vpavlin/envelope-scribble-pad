import React, { useState } from "react";
import { useNotes } from "@/context/NotesContext";
import NoteCard from "./NoteCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, ListFilter, Check, ChevronDown, Lightbulb } from "lucide-react";
import SearchBar from "./SearchBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SortOptions } from "@/types/note";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { getNoteSummary } from "@/utils/aiUtils";
import ReactMarkdown from "react-markdown";

const NoteList = () => {
  const { 
    filteredNotes, 
    addNote, 
    activeEnvelopeId,
    activeNoteId, 
    envelopes,
    defaultEnvelopeId,
    sortNotes,
    sortOption
  } = useNotes();

  const isMobile = useIsMobile();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [envelopeSummary, setEnvelopeSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleAddNote = () => {
    // Use activeEnvelopeId as first choice, then defaultEnvelopeId if available, then first envelope as fallback
    let envelopeId = activeEnvelopeId || defaultEnvelopeId || (envelopes.length > 0 ? envelopes[0].id : "");
    addNote("New Note", "", envelopeId, []);
  };

  const handleSortChange = (value: SortOptions) => {
    sortNotes(value);
  };

  const generateEnvelopeSummary = async () => {
    const apiKey = localStorage.getItem("akash-api-key");
    
    if (!apiKey) {
      toast.error("Please configure your API key in Settings first");
      return;
    }

    if (filteredNotes.length === 0) {
      toast.error("No notes to summarize");
      return;
    }

    setIsGeneratingSummary(true);
    setIsSummaryDialogOpen(true);
    try {
      // Combine content from all notes in the envelope
      const combinedContent = filteredNotes.map(note => 
        `Note: ${note.title}\n${note.content}`
      ).join("\n\n");

      const prompt = `Summarize these notes into 3-5 key points or themes:\n\n${combinedContent}`;
      
      const summary = await getNoteSummary("", apiKey, prompt);
      setEnvelopeSummary(summary);
    } catch (error) {
      console.error("Error generating envelope summary:", error);
      toast.error("Failed to generate summary");
      setEnvelopeSummary("Failed to generate summary. Please try again later.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const sortOptions = [
    { value: "dateNewest", label: "Date (Newest)" },
    { value: "dateOldest", label: "Date (Oldest)" },
    { value: "envelope", label: "Envelope" },
    { value: "latestComment", label: "Latest Comment" }
  ];

  const currentEnvelope = activeEnvelopeId 
    ? envelopes.find(env => env.id === activeEnvelopeId)?.name 
    : "All Notes";

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{currentEnvelope}</h2>
          {activeEnvelopeId && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                generateEnvelopeSummary();
              }}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Summarize
            </Button>
          )}
        </div>
        <SearchBar />
      </div>
      
      {(!isMobile || (isMobile && !activeNoteId)) && (
        <div className="p-4 flex-grow overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
              </span>
              
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center justify-between w-[180px] h-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>
                        {sortOptions.find(option => option.value === sortOption)?.label || "Sort by"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={5} className="w-[180px]">
                    {sortOptions.map((option) => (
                      <DropdownMenuItem 
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSortChange(option.value as SortOptions);
                        }}
                        className="flex items-center justify-between"
                      >
                        {option.label}
                        {sortOption === option.value && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                handleAddNote();
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Button>
          </div>
          
          <ScrollArea className="flex-grow relative">
            <div className="grid gap-2">
              {filteredNotes.length > 0 ? (
                filteredNotes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No notes found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Envelope Summary Dialog */}
      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Summary of {currentEnvelope}</DialogTitle>
            <DialogDescription>
              AI-generated summary of all notes in this envelope
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[50vh] overflow-y-auto">
            {isGeneratingSummary ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <p className="text-sm text-muted-foreground">Generating summary...</p>
              </div>
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown>{envelopeSummary}</ReactMarkdown>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsSummaryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoteList;

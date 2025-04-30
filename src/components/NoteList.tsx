
import React from "react";
import { useNotes } from "@/context/NotesContext";
import NoteCard from "./NoteCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SearchBar from "./SearchBar";

const NoteList = () => {
  const { 
    filteredNotes, 
    addNote, 
    activeEnvelopeId, 
    envelopes
  } = useNotes();

  const handleAddNote = () => {
    const envelopeId = activeEnvelopeId || (envelopes.length > 0 ? envelopes[0].id : "");
    addNote("New Note", "", envelopeId, []);
  };

  const currentEnvelope = activeEnvelopeId 
    ? envelopes.find(env => env.id === activeEnvelopeId)?.name 
    : "All Notes";

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium mb-4">{currentEnvelope}</h2>
        <SearchBar />
      </div>
      
      <div className="p-4 flex-grow overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={handleAddNote}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Note
          </Button>
        </div>
        
        <ScrollArea className="flex-grow">
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
    </div>
  );
};

export default NoteList;

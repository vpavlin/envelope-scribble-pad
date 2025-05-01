
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import NoteList from "@/components/NoteList";
import NoteEditor from "@/components/NoteEditor";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotes } from "@/context/NotesContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

// Component to handle the note view with context access
const NoteView = () => {
  const isMobile = useIsMobile();
  const { activeNoteId, isLoading } = useNotes();
  
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-full">
          {activeNoteId ? <NoteEditor /> : <NoteList />}
        </div>
      </div>
    );
  }
  
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
      <ResizablePanel 
        defaultSize={25} 
        minSize={20} 
        maxSize={40} 
        className="bg-white h-full"
      >
        <NoteList />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="bg-white h-full">
        <NoteEditor />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

// Main Index component
const Index = () => {
  const isMobile = useIsMobile();
  const { 
    setActiveNoteId, 
    setActiveEnvelopeId, 
    notes,
    envelopes,
    labels
  } = useNotes();
  const params = useParams();
  const navigate = useNavigate();

  // Handle URL parameters on component mount and when they change
  useEffect(() => {
    // Handle envelope routes
    if (params.envelopeId) {
      // Check if envelope exists
      const envelopeExists = envelopes.some(env => env.id === params.envelopeId);
      
      if (envelopeExists) {
        setActiveEnvelopeId(params.envelopeId);
        setActiveNoteId(null); // Clear active note when switching to envelope view
      } else {
        // Redirect to home if envelope doesn't exist
        navigate('/', { replace: true });
      }
    } 
    
    // Handle label routes (future implementation)
    else if (params.labelId) {
      // For now, just redirect to home as we'll implement label filtering later
      const labelExists = labels.some(label => label.id === params.labelId);
      if (!labelExists) {
        navigate('/', { replace: true });
      }
      // We'll implement label filtering in a future update
    } 
    
    // Handle note routes
    else if (params.noteId) {
      // Check if note exists
      const note = notes.find(note => note.id === params.noteId);
      
      if (note) {
        setActiveNoteId(params.noteId);
        // Also set the active envelope to the note's envelope
        setActiveEnvelopeId(note.envelopeId || null);
      } else {
        // Redirect to home if note doesn't exist
        navigate('/', { replace: true });
      }
    } 
    
    // Handle root route
    else {
      // Clear active filters if on home page
      setActiveEnvelopeId(null);
    }
  }, [params, notes, envelopes, labels, setActiveNoteId, setActiveEnvelopeId, navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
      <Sidebar />
      <div className={`flex flex-col flex-1 ${isMobile ? "ml-0 pt-14" : "md:ml-64"}`}>
        <NoteView />
      </div>
    </div>
  );
};

export default Index;

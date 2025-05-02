
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
    setActiveLabelId,
    setActiveEnvelopeId, 
    notes,
    envelopes,
    labels,
    activeNoteId,
    activeEnvelopeId,
    activeLabelId
  } = useNotes();
  const params = useParams();
  const navigate = useNavigate();

  // Handle URL parameters on component mount and when they change
  useEffect(() => {
    const handleRouting = async () => {
      try {
        console.log("Routing params:", params);
        console.log("Current state:", { activeNoteId, activeEnvelopeId, activeLabelId });
        
        // Handle envelope routes
        if (params.envelopeId) {
          console.log("Handling envelope route:", params.envelopeId);
          const envelopeExists = envelopes.some(env => env.id === params.envelopeId);
          
          if (envelopeExists) {
            setActiveEnvelopeId(params.envelopeId);
            // Only clear active note if we're changing envelopes
            if (activeEnvelopeId !== params.envelopeId) {
              setActiveNoteId(null);
            }
            // Clear active label when viewing an envelope
            setActiveLabelId(null);
          } else {
            // Only redirect if envelopes have loaded (prevents redirect on initial load)
            if (envelopes.length > 0) {
              navigate('/', { replace: true });
            }
          }
        } 
        
        // Handle label routes
        else if (params.labelId) {
          console.log("Handling label route:", params.labelId);
          const labelExists = labels.some(label => label.id === params.labelId);
          
          if (labelExists) {
            setActiveLabelId(params.labelId);
            // Only clear active note if we're changing labels
            if (activeLabelId !== params.labelId) {
              setActiveNoteId(null);
            }
            // Clear active envelope when viewing by label
            setActiveEnvelopeId(null);
          } else {
            // Only redirect if labels have loaded (prevents redirect on initial load)
            if (labels.length > 0) {
              navigate('/', { replace: true });
            }
          }
        } 
        
        // Handle note routes
        else if (params.noteId) {
          console.log("Handling note route:", params.noteId);
          // Find the note if it exists
          const note = notes.find(note => note.id === params.noteId);
          
          if (note) {
            setActiveNoteId(params.noteId);
            // Also set the active envelope to the note's envelope if it has one
            if (note.envelopeId) {
              setActiveEnvelopeId(note.envelopeId);
            }
            // Clear active label when viewing a specific note
            setActiveLabelId(null);
          } else {
            // Only redirect if notes have loaded (prevents redirect on initial load)
            if (notes.length > 0) {
              navigate('/', { replace: true });
            }
          }
        }
      } catch (error) {
        console.error("Error in routing logic:", error);
      }
    };
    
    handleRouting();
  }, [
    params, 
    notes, 
    envelopes, 
    labels, 
    setActiveNoteId, 
    setActiveEnvelopeId, 
    setActiveLabelId, 
    navigate,
    activeEnvelopeId,
    activeLabelId,
    activeNoteId
  ]);

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

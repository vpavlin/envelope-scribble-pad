
import React, { useEffect } from "react";
import { NotesProvider } from "@/context/NotesContext";
import Sidebar from "@/components/Sidebar";
import NoteList from "@/components/NoteList";
import NoteEditor from "@/components/NoteEditor";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotes } from "@/context/NotesContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { getSyncConfig, initializeWaku } from "@/utils/wakuSync";
import { toast } from "@/components/ui/sonner";

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

  return (
    <NotesProvider>
      <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
        <Sidebar />
        <div className={`flex flex-col flex-1 ${isMobile ? "ml-0 pt-14" : "md:ml-64"}`}>
          <NoteView />
        </div>
      </div>
    </NotesProvider>
  );
};

export default Index;

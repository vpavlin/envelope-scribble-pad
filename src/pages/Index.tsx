
import React from "react";
import { NotesProvider } from "@/context/NotesContext";
import Sidebar from "@/components/Sidebar";
import NoteList from "@/components/NoteList";
import NoteEditor from "@/components/NoteEditor";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotes } from "@/context/NotesContext";

// Component to handle the note view with context access
const NoteView = () => {
  const isMobile = useIsMobile();
  const { activeNoteId } = useNotes();
  
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
    <div className="flex flex-1">
      <div className="w-80 flex-shrink-0 bg-white h-full border-r">
        <NoteList />
      </div>
      <div className="flex-1 bg-white h-full">
        <NoteEditor />
      </div>
    </div>
  );
};

// Main Index component
const Index = () => {
  const isMobile = useIsMobile();

  return (
    <NotesProvider>
      <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
        <Sidebar />
        <div className={`flex flex-col flex-1 ${isMobile ? "ml-0" : "md:ml-64"}`}>
          <NoteView />
        </div>
      </div>
    </NotesProvider>
  );
};

export default Index;

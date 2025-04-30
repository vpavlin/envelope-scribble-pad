
import React from "react";
import { NotesProvider } from "@/context/NotesContext";
import Sidebar from "@/components/Sidebar";
import NoteList from "@/components/NoteList";
import NoteEditor from "@/components/NoteEditor";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <NotesProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className={`flex flex-1 ${isMobile ? "ml-0" : "ml-64"}`}>
          <div className="w-80 flex-shrink-0 bg-white h-full">
            <NoteList />
          </div>
          <div className="flex-1 bg-white h-full">
            <NoteEditor />
          </div>
        </div>
      </div>
    </NotesProvider>
  );
};

export default Index;

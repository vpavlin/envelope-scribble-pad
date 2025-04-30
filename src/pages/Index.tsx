
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
      <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
        <Sidebar />
        
        <div className={`flex flex-col flex-1 ${isMobile ? "ml-0" : "md:ml-64"}`}>
          {isMobile ? (
            <div className="flex flex-col h-full">
              <div className="h-full">
                <NoteList />
              </div>
            </div>
          ) : (
            <div className="flex flex-1">
              <div className="w-80 flex-shrink-0 bg-white h-full border-r">
                <NoteList />
              </div>
              <div className="flex-1 bg-white h-full">
                <NoteEditor />
              </div>
            </div>
          )}
        </div>
      </div>
    </NotesProvider>
  );
};

export default Index;

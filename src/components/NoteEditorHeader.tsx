
import React from "react";
import { useNavigate } from "react-router-dom";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface NoteEditorHeaderProps {
  note: Note;
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onSync: () => void;
  onBackToList: () => void;
  isSyncing: boolean;
  isMobile: boolean;
}

const NoteEditorHeader = ({
  note,
  title,
  onTitleChange,
  onDelete,
  onSync,
  onBackToList,
  isSyncing,
  isMobile
}: NoteEditorHeaderProps) => {
  const navigate = useNavigate();

  const handleBackToList = () => {
    navigate(-1); // Use browser back functionality
  };

  return (
    <div className="flex items-center justify-between mb-4">
      {isMobile && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToList}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      
      <input
        type="text"
        value={title}
        onChange={onTitleChange}
        className="flex-1 text-xl font-semibold bg-transparent border-none outline-none focus:ring-0"
        placeholder="Note title..."
      />
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {!isMobile && <span className="ml-1">Sync</span>}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {!isMobile && <span className="ml-1">Delete</span>}
        </Button>
      </div>
    </div>
  );
};

export default NoteEditorHeader;

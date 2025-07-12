
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, RefreshCcw, ArrowLeft, ArrowDownUp } from "lucide-react";
import NoteHistory from "./NoteHistory";
import { Note } from "@/types/note";
import { isWakuInitialized } from "@/utils/wakuSync";

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

const NoteEditorHeader: React.FC<NoteEditorHeaderProps> = ({
  note,
  title,
  onTitleChange,
  onDelete,
  onSync,
  onBackToList,
  isSyncing,
  isMobile
}) => {
  return (
    <>
      {isMobile && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2 flex items-center" 
          onClick={onBackToList}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to notes
        </Button>
      )}
      
      <div className="mb-4 flex items-center justify-between">
        <Input
          value={title}
          onChange={onTitleChange}
          className="flex-grow text-xl font-medium"
          placeholder="Note title"
        />
        <div className="flex space-x-1">
          {/* Add version info if available */}
          <div className="text-xs text-muted-foreground px-2 py-1 flex items-center">
            {note.version && note.version > 1 && (
              <span>v{note.version}</span>
            )}
            {note.restoredFrom && (
              <div className="flex items-center text-xs text-blue-500 ml-2">
                <ArrowDownUp className="h-3 w-3 mr-1" />
                <span>Restored from v{note.restoredFrom}</span>
              </div>
            )}
          </div>
          
          {/* Only show history button if there are previous versions */}
          {note.previousVersions && note.previousVersions.length > 0 && (
            <NoteHistory noteId={note.id} />
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          
          {isWakuInitialized() && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSync}
              disabled={isSyncing}
            >
              <RefreshCcw className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default NoteEditorHeader;

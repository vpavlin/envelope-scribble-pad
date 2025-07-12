
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image, RefreshCcw } from "lucide-react";
import NFCWriter from "./NFCWriter";
import { isWakuInitialized } from "@/utils/wakuSync";
import { Note } from "@/types/note";

interface NoteEditorActionsProps {
  note: Note;
  isUploading: boolean;
  isSyncing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  onTakePhoto: () => void;
  onSync: () => void;
}

const NoteEditorActions: React.FC<NoteEditorActionsProps> = ({
  note,
  isUploading,
  isSyncing,
  fileInputRef,
  onFileInputChange,
  onUploadClick,
  onTakePhoto,
  onSync
}) => {
  return (
    <div className="mb-4">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={onFileInputChange}
        multiple
      />
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUploadClick}
          disabled={isUploading}
          className="flex items-center"
        >
          <Upload className="h-4 w-4 mr-1" />
          <span>Upload File</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onTakePhoto}
          disabled={isUploading}
          className="flex items-center"
        >
          <Image className="h-4 w-4 mr-1" />
          <span>Take Photo</span>
        </Button>
        <NFCWriter noteId={note.id} noteTitle={note.title} />
        {isWakuInitialized() && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center"
          >
            <RefreshCcw className={`h-4 w-4 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Sync Note</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default NoteEditorActions;

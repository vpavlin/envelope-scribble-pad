
import React from "react";
import { useNotes } from "@/context/NotesContext";
import { NoteVersion } from "@/types/note";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, Clock } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

interface NoteHistoryProps {
  noteId: string;
}

const NoteHistory = ({ noteId }: NoteHistoryProps) => {
  const { viewNoteHistory, restoreNoteVersion } = useNotes();
  const versions = viewNoteHistory(noteId) || [];
  
  if (versions.length === 0) {
    return null;
  }
  
  // Sort versions from newest to oldest
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
  
  const handleRestore = async (version: number) => {
    await restoreNoteVersion(noteId, version);
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center"
        >
          <Clock className="h-4 w-4 mr-1" />
          <span>History ({versions.length})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Note Version History</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {sortedVersions.map((version) => (
              <div 
                key={`${version.version}-${version.deviceId}`}
                className="border rounded-md p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium">Version {version.version}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(version.updatedAt), "MMM d, yyyy h:mm a")}
                    </p>
                    {version.deviceId && (
                      <p className="text-xs text-muted-foreground">
                        Device: {version.deviceId.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                  <DialogClose asChild>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleRestore(version.version)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  </DialogClose>
                </div>
                
                <div className="bg-gray-50 rounded-md p-2 text-sm mt-2">
                  <p className="font-medium">{version.title}</p>
                  <p className="truncate text-muted-foreground">{version.content.substring(0, 100)}{version.content.length > 100 ? "..." : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NoteHistory;

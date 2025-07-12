import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNotes } from "@/context/NotesContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { emit, isWakuInitialized } from "@/utils/wakuSync";
import { MessageType } from "@/types/note";

// Import the new components
import NoteEditorHeader from "./NoteEditorHeader";
import NoteEditorMetadata from "./NoteEditorMetadata";
import NoteEditorContent from "./NoteEditorContent";
import NoteEditorActions from "./NoteEditorActions";
import CommentSection from "./CommentSection";
import AISummary from "./AISummary";
import AttachmentList from "./AttachmentList";

// Custom hook for debounced auto-save
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

const NoteEditor = () => {
  const { 
    activeNote, 
    updateNote, 
    deleteNote, 
    envelopes,
    labels,
    setActiveNoteId,
    addAttachment,
    isLoading
  } = useNotes();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const isMobile = useIsMobile();

  // Auto-save debounced function
  const debouncedSave = useDebounce(async () => {
    if (isDirty && activeNote) {
      await handleSave();
      setIsDirty(false);
    }
  }, 2000);

  useEffect(() => {
    console.log("NoteEditor: activeNote changed", activeNote);
    if (activeNote) {
      console.log("Setting note data:", {
        title: activeNote.title,
        content: activeNote.content,
        contentLength: activeNote.content?.length || 0
      });
      setTitle(activeNote.title || "");
      setContent(activeNote.content || "");
      setEnvelopeId(activeNote.envelopeId || "");
      setSelectedLabelIds(activeNote.labelIds || []);
      setIsDirty(false);
    }
  }, [activeNote]);

  // Call debounced save whenever note content changes
  useEffect(() => {
    if (isDirty) {
      debouncedSave();
    }
  }, [title, content, envelopeId, selectedLabelIds, isDirty]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!activeNote) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select or create a note to get started
      </div>
    );
  }

  const handleSave = async () => {
    console.log("Saving note with content:", content);
    await updateNote(activeNote.id, {
      title,
      content,
      envelopeId,
      labelIds: selectedLabelIds
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log("Content changed:", e.target.value);
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleEnvelopeChange = (value: string) => {
    setEnvelopeId(value);
    setIsDirty(true);
  };

  const handleDelete = async () => {
    await deleteNote(activeNote.id);
    setIsDeleteDialogOpen(false);
  };

  const handleSyncNote = async () => {
    if (!activeNote || !isWakuInitialized()) {
      toast({
        title: "Sync not available",
        description: "Sync is not enabled or initialized properly",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const success = await emit(MessageType.NOTE_UPDATED, activeNote);
      
      if (success) {
        toast({
          title: "Note synced",
          description: "Note was successfully synced to other devices"
        });
      } else {
        toast({
          title: "Sync failed",
          description: "Failed to sync note to other devices",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error syncing note:", error);
      toast({
        title: "Sync error",
        description: "An error occurred while syncing the note",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
    setIsDirty(true);
  };

  const handleBackToList = () => {
    console.log("handleBackToList called - clearing active note");
    setActiveNoteId(null);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "File too large",
              description: `${file.name} is larger than 5MB`,
              variant: "destructive"
            });
            continue;
          }

          await addAttachment(activeNote.id, file);
        }
        toast({
          title: "Attachment added",
          description: files.length > 1 
            ? `${files.length} files were uploaded successfully` 
            : "File was uploaded successfully"
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "There was a problem uploading your file(s)",
          variant: "destructive"
        });
        console.error("Error uploading file:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.removeAttribute("capture");
        }
      }, 1000);
    }
  };

  console.log("NoteEditor rendering with content:", content);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <NoteEditorHeader
          note={activeNote}
          title={title}
          onTitleChange={handleTitleChange}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onSync={handleSyncNote}
          onBackToList={handleBackToList}
          isSyncing={isSyncing}
          isMobile={isMobile}
        />
        
        <NoteEditorMetadata
          note={activeNote}
          envelopeId={envelopeId}
          selectedLabelIds={selectedLabelIds}
          envelopes={envelopes}
          labels={labels}
          onEnvelopeChange={handleEnvelopeChange}
          onToggleLabel={toggleLabel}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <NoteEditorContent
          content={content}
          activeTab={activeTab}
          onContentChange={handleContentChange}
          onTabChange={setActiveTab}
        />
        
        {/* Bottom Section */}
        <div className="p-4 space-y-4 border-t bg-background">
          <NoteEditorActions
            note={activeNote}
            isUploading={isUploading}
            isSyncing={isSyncing}
            fileInputRef={fileInputRef}
            onFileInputChange={handleFileInputChange}
            onUploadClick={handleUploadClick}
            onTakePhoto={handleTakePhoto}
            onSync={handleSyncNote}
          />
          
          <AttachmentList 
            noteId={activeNote.id} 
            attachments={activeNote.attachments || []}
          />
          
          <AISummary 
            noteId={activeNote.id}
            noteContent={content}
            noteTitle={title}
            summaries={activeNote.aiSummaries}
          />
          
          <CommentSection 
            noteId={activeNote.id}
            comments={activeNote.comments}
          />
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileInputChange}
        multiple
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{activeNote.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NoteEditor;

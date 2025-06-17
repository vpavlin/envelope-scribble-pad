import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNotes } from "@/context/NotesContext";
import CommentSection from "./CommentSection";
import AISummary from "./AISummary";
import AttachmentList from "./AttachmentList";
import NoteHistory from "./NoteHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar, Trash2, Tag, ArrowLeft, Image, Upload, RefreshCcw, Clock, ArrowDownUp, Edit, Eye } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { emit, isWakuInitialized } from "@/utils/wakuSync";
import { MessageType } from "@/types/note";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Debounce function for delaying sync
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
  }, 2000); // 2 second delay

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setEnvelopeId(activeNote.envelopeId);
      setSelectedLabelIds(activeNote.labelIds);
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
      // Force sync the note to other devices
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
    setActiveNoteId(null);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // Check file size (limit to 5MB)
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
        // Reset the file input
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
      // Reset after click
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.removeAttribute("capture");
        }
      }, 1000);
    }
  };

  const formattedDate = format(new Date(activeNote.createdAt), "MMM d, yyyy h:mm a");
  const noteLabels = labels.filter(label => selectedLabelIds.includes(label.id));

  return (
    <div className={`flex flex-col h-full ${isMobile ? "p-4" : "p-6"}`}>
      {isMobile && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2 flex items-center" 
          onClick={handleBackToList}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to notes
        </Button>
      )}
      
      <div className="mb-4 flex items-center justify-between">
        <Input
          value={title}
          onChange={handleTitleChange}
          className="flex-grow text-xl font-medium"
          placeholder="Note title"
        />
        <div className="flex space-x-1">
          {/* Add version info if available */}
          <div className="text-xs text-muted-foreground px-2 py-1 flex items-center">
            {activeNote.version && activeNote.version > 1 && (
              <span>v{activeNote.version}</span>
            )}
            {activeNote.restoredFrom && (
              <div className="flex items-center text-xs text-blue-500 ml-2">
                <ArrowDownUp className="h-3 w-3 mr-1" />
                <span>Restored from v{activeNote.restoredFrom}</span>
              </div>
            )}
          </div>
          
          {/* Only show history button if there are previous versions */}
          {activeNote.previousVersions && activeNote.previousVersions.length > 0 && (
            <NoteHistory noteId={activeNote.id} />
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          
          {isWakuInitialized() && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSyncNote}
              disabled={isSyncing}
            >
              <RefreshCcw className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <Calendar className="h-4 w-4 mr-1" />
        <span>{formattedDate}</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {noteLabels.map(label => (
          <Badge 
            key={label.id}
            style={{ 
              backgroundColor: `${label.color}20`, 
              color: label.color,
              borderColor: label.color 
            }}
            variant="outline"
          >
            {label.name}
          </Badge>
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-6">
              <Tag className="h-3 w-3 mr-1" />
              <span>Labels</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Select Labels</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {labels.map(label => (
              <DropdownMenuCheckboxItem
                key={label.id}
                checked={selectedLabelIds.includes(label.id)}
                onCheckedChange={() => toggleLabel(label.id)}
              >
                <div className="flex items-center">
                  <div 
                    className="h-2 w-2 rounded-full mr-2"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mb-4">
        <Select 
          value={envelopeId}
          onValueChange={handleEnvelopeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select envelope" />
          </SelectTrigger>
          <SelectContent>
            {envelopes.map(envelope => (
              <SelectItem key={envelope.id} value={envelope.id}>
                {envelope.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-grow mb-4 overflow-auto">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="editor" className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="flex-grow h-full">
            <Textarea
              value={content}
              onChange={handleContentChange}
              className="resize-none h-full min-h-[300px]"
              placeholder="Note content (supports markdown)"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="flex-grow h-full overflow-auto">
            <div className="prose max-w-none h-full border rounded p-4 bg-gray-50 overflow-y-auto">
              {content ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <div className="text-muted-foreground">
                  No content to preview
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* File Upload Interface */}
      <div className="mb-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileInputChange}
          multiple
        />
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center"
          >
            <Upload className="h-4 w-4 mr-1" />
            <span>Upload File</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTakePhoto}
            disabled={isUploading}
            className="flex items-center"
          >
            <Image className="h-4 w-4 mr-1" />
            <span>Take Photo</span>
          </Button>
          {isWakuInitialized() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNote}
              disabled={isSyncing}
              className="flex items-center"
            >
              <RefreshCcw className={`h-4 w-4 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Sync Note</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Attachment List */}
      <AttachmentList 
        noteId={activeNote.id} 
        attachments={activeNote.attachments || []}
      />
      
      {/* AI Summary Section */}
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

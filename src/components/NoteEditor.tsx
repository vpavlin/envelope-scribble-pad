
import React, { useState, useEffect } from "react";
import { useNotes } from "@/context/NotesContext";
import CommentSection from "./CommentSection";
import AISummary from "./AISummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar, Edit, Save, Trash2, Tag, ArrowLeft } from "lucide-react";
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

const NoteEditor = () => {
  const { 
    activeNote, 
    updateNote, 
    deleteNote, 
    envelopes,
    labels,
    setActiveNoteId
  } = useNotes();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setEnvelopeId(activeNote.envelopeId);
      setSelectedLabelIds(activeNote.labelIds);
      setIsEditing(false);
    }
  }, [activeNote]);

  if (!activeNote) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select or create a note to get started
      </div>
    );
  }

  const handleSave = () => {
    updateNote(activeNote.id, {
      title,
      content,
      envelopeId,
      labelIds: selectedLabelIds
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteNote(activeNote.id);
    setIsDeleteDialogOpen(false);
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleBackToList = () => {
    setActiveNoteId(null);
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
      {isEditing ? (
        <div className="mb-4 flex items-center">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-grow text-xl font-medium"
            placeholder="Note title"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2"
            onClick={handleSave}
          >
            <Save className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`${isMobile ? "text-lg" : "text-xl"} font-medium truncate`}>{activeNote.title}</h2>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
      
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
        
        {isEditing && (
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
        )}
      </div>
      
      {isEditing && (
        <div className="mb-4">
          <Select 
            value={envelopeId}
            onValueChange={setEnvelopeId}
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
      )}
      
      <div className="flex-grow mb-4 overflow-auto">
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none h-full"
            placeholder="Note content"
          />
        ) : (
          <div className="prose max-w-none">
            {activeNote.content.split("\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>
      
      {/* AI Summary Section */}
      {!isEditing && (
        <AISummary 
          noteId={activeNote.id}
          noteContent={activeNote.content}
          summaries={activeNote.aiSummaries}
        />
      )}
      
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

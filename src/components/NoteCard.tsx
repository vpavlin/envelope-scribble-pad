
import React from "react";
import { useNotes } from "@/context/NotesContext";
import { Note } from "@/types/note";
import { Calendar, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const { setActiveNote, labels, activeNote } = useNotes();

  const noteLabels = labels.filter(label => note.labelIds.includes(label.id));
  const formattedDate = format(new Date(note.createdAt), "MMM d, yyyy");

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-shadow",
        activeNote?.id === note.id ? "ring-1 ring-primary" : ""
      )}
      onClick={() => setActiveNote(note)}
    >
      <h3 className="font-medium text-lg mb-2 line-clamp-1">{note.title}</h3>
      <p className="text-muted-foreground line-clamp-2 text-sm mb-3">
        {note.content.replace(/<[^>]*>/g, '')}
      </p>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
        
        {note.comments.length > 0 && (
          <div className="flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" />
            <span>{note.comments.length}</span>
          </div>
        )}
      </div>
      
      {noteLabels.length > 0 && (
        <div className="flex mt-3 flex-wrap gap-1">
          {noteLabels.map(label => (
            <div
              key={label.id}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.name}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default NoteCard;

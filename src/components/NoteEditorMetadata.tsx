
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { Note, Envelope, Label } from "@/types/note";

interface NoteEditorMetadataProps {
  note: Note;
  envelopeId: string;
  selectedLabelIds: string[];
  envelopes: Envelope[];
  labels: Label[];
  onEnvelopeChange: (value: string) => void;
  onToggleLabel: (labelId: string) => void;
}

const NoteEditorMetadata: React.FC<NoteEditorMetadataProps> = ({
  note,
  envelopeId,
  selectedLabelIds,
  envelopes,
  labels,
  onEnvelopeChange,
  onToggleLabel
}) => {
  const formattedDate = format(new Date(note.createdAt), "MMM d, yyyy h:mm a");
  const noteLabels = labels.filter(label => selectedLabelIds.includes(label.id));

  return (
    <>
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
                onCheckedChange={() => onToggleLabel(label.id)}
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
          onValueChange={onEnvelopeChange}
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
    </>
  );
};

export default NoteEditorMetadata;

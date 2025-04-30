
import React from "react";
import { useNotes } from "@/context/NotesContext";
import { Attachment } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Trash2, FileImage, Upload, Download } from "lucide-react";
import { format } from "date-fns";

interface AttachmentListProps {
  noteId: string;
  attachments: Attachment[];
}

const AttachmentList: React.FC<AttachmentListProps> = ({ noteId, attachments }) => {
  const { deleteAttachment } = useNotes();

  if (!attachments.length) {
    return null;
  }

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="font-medium mb-2">Attachments ({attachments.length})</h3>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div 
            key={attachment.id}
            className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
          >
            <div className="flex items-center overflow-hidden">
              {isImage(attachment.type) ? (
                <div className="h-10 w-10 rounded bg-gray-200 flex-shrink-0 overflow-hidden mr-2">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <FileImage className="h-10 w-10 text-muted-foreground p-2 flex-shrink-0 mr-2" />
              )}
              <div className="overflow-hidden">
                <p className="truncate font-medium text-sm">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(attachment.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex space-x-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDownload(attachment)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteAttachment(noteId, attachment.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentList;

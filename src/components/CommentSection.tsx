
import React, { useState } from "react";
import { useNotes } from "@/context/NotesContext";
import { Comment } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentSectionProps {
  noteId: string;
  comments: Comment[];
}

const CommentSection: React.FC<CommentSectionProps> = ({ noteId, comments }) => {
  const { addComment, deleteComment } = useNotes();
  const [commentContent, setCommentContent] = useState("");

  const handleAddComment = () => {
    if (commentContent.trim()) {
      addComment(noteId, commentContent);
      setCommentContent("");
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="font-medium mb-2">Comments ({comments.length})</h3>
      
      <div className="flex mb-4">
        <Textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Add a comment..."
          className="resize-none mr-2"
          rows={2}
        />
        <Button 
          onClick={handleAddComment}
          disabled={!commentContent.trim()}
          className="self-end"
        >
          Add
        </Button>
      </div>
      
      <ScrollArea className="max-h-[200px]">
        {comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => deleteComment(noteId, comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-2">
            No comments yet
          </p>
        )}
      </ScrollArea>
    </div>
  );
};

export default CommentSection;

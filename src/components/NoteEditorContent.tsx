
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface NoteEditorContentProps {
  content: string;
  activeTab: string;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTabChange: (value: string) => void;
}

const NoteEditorContent: React.FC<NoteEditorContentProps> = ({
  content,
  activeTab,
  onContentChange,
  onTabChange
}) => {
  console.log("NoteEditorContent rendered with content:", content);
  console.log("Content length:", content?.length || 0);
  console.log("Active tab:", activeTab);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Tabs 
        value={activeTab} 
        onValueChange={onTabChange}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="flex-1 min-h-0 mt-0">
          <Textarea
            value={content || ""}
            onChange={onContentChange}
            className="resize-none w-full h-full min-h-[500px]"
            placeholder="Note content (supports markdown)"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="flex-1 min-h-0 mt-0">
          <div className="prose max-w-none h-full min-h-[500px] border rounded-md p-4 bg-gray-50 overflow-y-auto">
            {content && content.trim() ? (
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
  );
};

export default NoteEditorContent;

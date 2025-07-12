
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
    <div className="h-full flex flex-col p-4">
      <Tabs 
        value={activeTab} 
        onValueChange={onTabChange}
        className="h-full flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="flex-1 mt-0">
          <Textarea
            value={content || ""}
            onChange={onContentChange}
            className="h-full resize-none border rounded-md"
            placeholder="Start writing your note... (supports markdown)"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="flex-1 mt-0">
          <div className="h-full border rounded-md p-4 bg-muted/30 overflow-y-auto">
            {content && content.trim() ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
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

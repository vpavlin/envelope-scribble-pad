
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
  return (
    <div className="flex-grow mb-4 overflow-auto">
      <Tabs 
        value={activeTab} 
        onValueChange={onTabChange}
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
            onChange={onContentChange}
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
  );
};

export default NoteEditorContent;

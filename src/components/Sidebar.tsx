
import React, { useState } from "react";
import { useNotes } from "@/context/NotesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const {
    envelopes,
    addEnvelope,
    activeEnvelopeId,
    setActiveEnvelopeId,
    labels
  } = useNotes();

  const [newEnvelopeName, setNewEnvelopeName] = useState("");
  const [isAddEnvelopeOpen, setIsAddEnvelopeOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleAddEnvelope = () => {
    if (newEnvelopeName.trim()) {
      addEnvelope(newEnvelopeName.trim());
      setNewEnvelopeName("");
      setIsAddEnvelopeOpen(false);
    }
  };
  
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="md:hidden fixed left-4 top-4 z-50"
        onClick={toggleMobileSidebar}
      >
        <Folder className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "bg-sidebar text-sidebar-foreground w-64 h-screen flex-shrink-0 border-r border-sidebar-border transition-all duration-300",
          "fixed md:relative z-40",
          isMobileSidebarOpen ? "left-0" : "-left-64 md:left-0"
        )}
      >
        <div className="p-4">
          <h1 className="text-xl font-bold mb-6">Note Envelope</h1>
          
          <div className="space-y-6">
            {/* All Notes */}
            <div 
              className={cn(
                "flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors",
                activeEnvelopeId === null ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""
              )}
              onClick={() => setActiveEnvelopeId(null)}
            >
              <Folder className="mr-2 h-5 w-5" />
              <span>All Notes</span>
            </div>
            
            {/* Envelopes Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-sidebar-foreground/70">
                  Envelopes
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={() => setIsAddEnvelopeOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="h-40">
                {envelopes.map((envelope) => (
                  <div
                    key={envelope.id}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors",
                      activeEnvelopeId === envelope.id ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""
                    )}
                    onClick={() => setActiveEnvelopeId(envelope.id)}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    <span className="truncate">{envelope.name}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
            
            {/* Labels Section */}
            <div>
              <h2 className="font-semibold text-sm uppercase tracking-wider text-sidebar-foreground/70 mb-2">
                Labels
              </h2>
              
              <ScrollArea className="h-40">
                {labels.map((label) => (
                  <div 
                    key={label.id}
                    className="flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors"
                  >
                    <div 
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: label.color }}
                    />
                    <Tag className="mr-2 h-4 w-4" />
                    <span className="truncate">{label.name}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Envelope Dialog */}
      <Dialog open={isAddEnvelopeOpen} onOpenChange={setIsAddEnvelopeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Envelope</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newEnvelopeName}
                onChange={(e) => setNewEnvelopeName(e.target.value)}
                className="col-span-3"
                placeholder="Enter envelope name"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddEnvelope}>Create Envelope</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Folder, Tag, Settings, Menu, Star, RefreshCw } from "lucide-react";
import { useNotes } from "@/context/NotesContext";
import { v4 as uuidv4 } from "uuid";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { isWakuInitialized, emit } from "@/utils/wakuSync";
import { MessageType } from "@/types/note";

const Sidebar = () => {
  const {
    envelopes,
    labels,
    addEnvelope,
    updateEnvelope,
    deleteEnvelope,
    addLabel,
    updateLabel,
    deleteLabel,
    activeEnvelopeId,
    setActiveEnvelopeId,
    defaultEnvelopeId,
    setDefaultEnvelopeId,
    setSearchTerm,
  } = useNotes();

  const { toast } = useToast();
  const [isEnvelopeDialogOpen, setIsEnvelopeDialogOpen] = useState(false);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [newEnvelopeName, setNewEnvelopeName] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [editingEnvelopeId, setEditingEnvelopeId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMobile, setOpenMobile] = useState(false);
  const [isSyncingEnvelopes, setIsSyncingEnvelopes] = useState(false);
  const [isSyncingLabels, setIsSyncingLabels] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleEnvelopeSubmit = () => {
    if (newEnvelopeName.trim() === "") return;

    if (editingEnvelopeId) {
      updateEnvelope(editingEnvelopeId, newEnvelopeName);
    } else {
      addEnvelope(newEnvelopeName);
    }

    setNewEnvelopeName("");
    setEditingEnvelopeId(null);
    setIsEnvelopeDialogOpen(false);
  };

  const handleLabelSubmit = () => {
    if (newLabelName.trim() === "") return;

    if (editingLabelId) {
      updateLabel(editingLabelId, newLabelName, newLabelColor);
    } else {
      addLabel(newLabelName, newLabelColor);
    }

    setNewLabelName("");
    setNewLabelColor("#3b82f6");
    setEditingLabelId(null);
    setIsLabelDialogOpen(false);
  };

  const handleEditEnvelope = (id: string, name: string) => {
    setEditingEnvelopeId(id);
    setNewEnvelopeName(name);
    setIsEnvelopeDialogOpen(true);
  };

  const handleEditLabel = (id: string, name: string, color: string) => {
    setEditingLabelId(id);
    setNewLabelName(name);
    setNewLabelColor(color);
    setIsLabelDialogOpen(true);
  };

  const handleSetDefaultEnvelope = (id: string, name: string) => {
    const isAlreadyDefault = defaultEnvelopeId === id;
    
    if (isAlreadyDefault) {
      setDefaultEnvelopeId(null);
      toast({
        title: "Default envelope removed",
        description: `"${name}" is no longer the default envelope.`
      });
    } else {
      setDefaultEnvelopeId(id);
      toast({
        title: "Default envelope set",
        description: `"${name}" is now your default envelope.`
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
  };

  const forceEnvelopeSync = async () => {
    if (!isWakuInitialized() || isSyncingEnvelopes) return;
    
    setIsSyncingEnvelopes(true);
    
    try {
      // Force sync all envelopes
      let successCount = 0;
      for (const envelope of envelopes) {
        // First emit an ADD message to ensure the envelope exists on other devices
        await emit(MessageType.ENVELOPE_ADDED, envelope);
        // Then emit an UPDATE message to ensure it has the latest data
        await emit(MessageType.ENVELOPE_UPDATED, envelope);
        successCount++;
      }
      
      toast({
        title: "Envelopes synced",
        description: `Successfully synced ${successCount} envelopes to other devices.`,
      });
    } catch (error) {
      console.error("Error syncing envelopes:", error);
      toast({
        title: "Sync failed",
        description: "Failed to sync envelopes to other devices.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingEnvelopes(false);
    }
  };
  
  const forceLabelSync = async () => {
    if (!isWakuInitialized() || isSyncingLabels) return;
    
    setIsSyncingLabels(true);
    
    try {
      // Force sync all labels
      let successCount = 0;
      for (const label of labels) {
        // First emit an ADD message to ensure the label exists on other devices
        await emit(MessageType.LABEL_ADDED, label);
        // Then emit an UPDATE message to ensure it has the latest data
        await emit(MessageType.LABEL_UPDATED, label);
        successCount++;
      }
      
      toast({
        title: "Labels synced",
        description: `Successfully synced ${successCount} labels to other devices.`,
      });
    } catch (error) {
      console.error("Error syncing labels:", error);
      toast({
        title: "Sync failed",
        description: "Failed to sync labels to other devices.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingLabels(false);
    }
  };

  const sidebarContent = (
    <div className="w-64 fixed left-0 top-0 h-full bg-slate-50 border-r border-gray-200 p-4 flex flex-col overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-4">NoteEnvelope</h1>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-muted-foreground">ENVELOPES</h2>
          <div className="flex space-x-1">
            {isWakuInitialized() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={forceEnvelopeSync}
                      disabled={isSyncingEnvelopes}
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncingEnvelopes ? "animate-spin" : ""}`} />
                      <span className="sr-only">Sync Envelopes</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Force sync envelopes</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setNewEnvelopeName("");
                setEditingEnvelopeId(null);
                setIsEnvelopeDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Add Envelope</span>
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Button
            variant={location.pathname === "/" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              navigate("/");
              if (isMobile) {
                setOpenMobile(false);
              }
            }}
          >
            All Notes
          </Button>
          {envelopes.map((envelope) => (
            <div key={envelope.id} className="flex items-center group">
              <Button
                variant={location.pathname === `/envelope/${envelope.id}` ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  navigate(`/envelope/${envelope.id}`);
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <Folder className="mr-2 h-4 w-4" />
                {envelope.name}
                {defaultEnvelopeId === envelope.id && (
                  <Star className="ml-auto h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
              </Button>
              <div className="hidden group-hover:flex">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefaultEnvelope(envelope.id, envelope.name);
                        }}
                      >
                        <span className="sr-only">Set as default</span>
                        <Star className={`h-4 w-4 ${defaultEnvelopeId === envelope.id ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {defaultEnvelopeId === envelope.id ? 'Remove as default' : 'Set as default envelope'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditEnvelope(envelope.id, envelope.name);
                  }}
                >
                  <span className="sr-only">Edit</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEnvelope(envelope.id);
                  }}
                >
                  <span className="sr-only">Delete</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-muted-foreground">LABELS</h2>
          <div className="flex space-x-1">
            {isWakuInitialized() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={forceLabelSync}
                      disabled={isSyncingLabels}
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncingLabels ? "animate-spin" : ""}`} />
                      <span className="sr-only">Sync Labels</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Force sync labels</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setNewLabelName("");
                setNewLabelColor("#3b82f6");
                setEditingLabelId(null);
                setIsLabelDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Add Label</span>
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center group">
              <Button 
                variant={location.pathname === `/label/${label.id}` ? "secondary" : "ghost"} 
                className="w-full justify-start" 
                onClick={() => {
                  navigate(`/label/${label.id}`);
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: label.color }}
                ></div>
                <Tag className="mr-2 h-4 w-4" />
                {label.name}
              </Button>
              <div className="hidden group-hover:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEditLabel(label.id, label.name, label.color)}
                >
                  <span className="sr-only">Edit</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => deleteLabel(label.id)}
                >
                  <span className="sr-only">Delete</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <Link to="/settings" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors" onClick={() => isMobile && setOpenMobile(false)}>
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm">Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="fixed top-4 left-4 z-10 bg-background">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>NoteEnvelope</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      ) : (
        sidebarContent
      )}

      {/* Envelope Dialog */}
      <Dialog open={isEnvelopeDialogOpen} onOpenChange={setIsEnvelopeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEnvelopeId ? "Edit Envelope" : "Create Envelope"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Envelope name"
              value={newEnvelopeName}
              onChange={(e) => setNewEnvelopeName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnvelopeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnvelopeSubmit}>
              {editingEnvelopeId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Label Dialog */}
      <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLabelId ? "Edit Label" : "Create Label"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Input
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-10 h-10 rounded-md cursor-pointer"
                />
                <span className="text-sm">{newLabelColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLabelSubmit}>
              {editingLabelId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;

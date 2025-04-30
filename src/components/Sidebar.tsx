import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Folder, Tag, Settings, Menu } from "lucide-react";
import { useNotes } from "@/context/NotesContext";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
    setSearchTerm,
  } = useNotes();

  const [isEnvelopeDialogOpen, setIsEnvelopeDialogOpen] = useState(false);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [newEnvelopeName, setNewEnvelopeName] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [editingEnvelopeId, setEditingEnvelopeId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMobile, setOpenMobile] = useState(false);
  const isMobile = useIsMobile();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
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
        <div className="space-y-1">
          <Button
            variant={activeEnvelopeId === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setActiveEnvelopeId(null);
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
                variant={activeEnvelopeId === envelope.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveEnvelopeId(envelope.id);
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <Folder className="mr-2 h-4 w-4" />
                {envelope.name}
              </Button>
              <div className="hidden group-hover:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEditEnvelope(envelope.id, envelope.name)}
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
                  onClick={() => deleteEnvelope(envelope.id)}
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
        <div className="space-y-1">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center group">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => {
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

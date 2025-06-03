import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useNotes } from "@/context/NotesContext";
import { Settings, Plus, LayoutGrid, Tag, ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";
import Logo from "./Logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import WakuHealthIndicator from "./WakuHealthIndicator";

const Sidebar = () => {
  const [isEnvelopesOpen, setIsEnvelopesOpen] = React.useState(true);
  const [isLabelsOpen, setIsLabelsOpen] = React.useState(true);
  const [isCreateEnvelopeDialogOpen, setIsCreateEnvelopeDialogOpen] = React.useState(false);
  const [isCreateLabelDialogOpen, setIsCreateLabelDialogOpen] = React.useState(false);
  const [newEnvelopeName, setNewEnvelopeName] = React.useState("");
  const [newLabelName, setNewLabelName] = React.useState("");
  const [newLabelColor, setNewLabelColor] = React.useState("#7dd3fc");
  const { 
    envelopes, 
    labels, 
    addEnvelope, 
    addLabel, 
    activeEnvelopeId,
    activeLabelId,
    deleteEnvelope,
    deleteLabel,
    updateEnvelope,
    updateLabel,
    setDefaultEnvelopeId
  } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCreateEnvelope = async () => {
    if (newEnvelopeName.trim() !== "") {
      await addEnvelope(newEnvelopeName);
      setNewEnvelopeName("");
      setIsCreateEnvelopeDialogOpen(false);
    }
  };

  const handleCreateLabel = async () => {
    if (newLabelName.trim() !== "") {
      await addLabel(newLabelName, newLabelColor);
      setNewLabelName("");
      setNewLabelColor("#7dd3fc");
      setIsCreateLabelDialogOpen(false);
    }
  };

  const handleEnvelopeClick = (envelopeId: string) => {
    navigate(`/envelope/${envelopeId}`);
  };

  const handleLabelClick = (labelId: string) => {
    navigate(`/label/${labelId}`);
  };

  const handleDeleteEnvelope = async (envelopeId: string) => {
    await deleteEnvelope(envelopeId);
  };

  const handleDeleteLabel = async (labelId: string) => {
    await deleteLabel(labelId);
  };

  const handleEditEnvelope = (envelopeId: string) => {
    const newName = prompt("Enter new envelope name:");
    if (newName) {
      updateEnvelope(envelopeId, newName);
    }
  };

  const handleEditLabel = (labelId: string) => {
    const newName = prompt("Enter new label name:");
    if (newName) {
      const newColor = prompt("Enter new label color (hex code):");
      if (newColor) {
        updateLabel(labelId, newName, newColor);
      }
    }
  };

  const handleSetDefaultEnvelope = (envelopeId: string) => {
    setDefaultEnvelopeId(envelopeId);
  };

  return (
    <div
      className={`${
        isMobile
          ? "fixed top-0 left-0 right-0 h-14 border-b bg-white z-20"
          : "fixed top-0 left-0 bottom-0 w-64 border-r bg-white z-20"
      }`}
    >
      {isMobile ? (
        <div className="h-full flex items-center justify-between px-4">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <WakuHealthIndicator />
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 flex items-center justify-between border-b">
            <Link to="/" className="flex items-center">
              <Logo />
            </Link>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="p-4">
            <WakuHealthIndicator />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <Button variant="outline" className="w-full justify-start mb-4" onClick={() => navigate("/")}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              All Notes
            </Button>

            <div className="mb-4">
              <button
                className="flex items-center justify-between w-full text-sm font-semibold py-2"
                onClick={() => setIsEnvelopesOpen(!isEnvelopesOpen)}
              >
                Envelopes
                {isEnvelopesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {isEnvelopesOpen && (
                <div className="pl-2">
                  {envelopes.map((envelope) => (
                    <div
                      key={envelope.id}
                      className={`flex items-center justify-between w-full text-sm py-1 rounded-md hover:bg-gray-100 cursor-pointer ${
                        activeEnvelopeId === envelope.id ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      <button
                        onClick={() => handleEnvelopeClick(envelope.id)}
                        className="w-full text-left py-1 px-2"
                      >
                        {envelope.name}
                      </button>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefaultEnvelope(envelope.id);
                          }}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEnvelope(envelope.id);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnvelope(envelope.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Dialog open={isCreateEnvelopeDialogOpen} onOpenChange={setIsCreateEnvelopeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Envelope
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create Envelope</DialogTitle>
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
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={handleCreateEnvelope}>
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            <div className="mb-4">
              <button
                className="flex items-center justify-between w-full text-sm font-semibold py-2"
                onClick={() => setIsLabelsOpen(!isLabelsOpen)}
              >
                Labels
                {isLabelsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {isLabelsOpen && (
                <div className="pl-2">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className={`flex items-center justify-between w-full text-sm py-1 rounded-md hover:bg-gray-100 cursor-pointer ${
                        activeLabelId === label.id ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      <button
                        onClick={() => handleLabelClick(label.id)}
                        className="w-full text-left py-1 px-2"
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: label.color }}
                        ></span>
                        {label.name}
                      </button>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLabel(label.id);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLabel(label.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Dialog open={isCreateLabelDialogOpen} onOpenChange={setIsCreateLabelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Label
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create Label</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="color" className="text-right">
                            Color
                          </Label>
                          <Input
                            type="color"
                            id="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="col-span-3 h-10"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={handleCreateLabel}>
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

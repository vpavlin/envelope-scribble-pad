
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Note, Envelope, Label, Comment, SortOptions, Attachment } from "@/types/note";
import * as storage from "@/utils/storage";
import * as indexedDb from "@/utils/indexedDb";

interface NotesContextProps {
  notes: Note[];
  envelopes: Envelope[];
  labels: Label[];
  activeNote: Note | null;
  activeEnvelopeId: string | null;
  activeNoteId: string | null;
  searchTerm: string;
  filteredNotes: Note[];
  sortOption: SortOptions;
  defaultEnvelopeId: string | null;
  isLoading: boolean;
  
  addNote: (title: string, content: string, envelopeId: string, labelIds: string[]) => Promise<void>;
  updateNote: (id: string, updates: Partial<Omit<Note, "id">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  setActiveNoteId: (id: string | null) => void;
  
  addEnvelope: (name: string) => Promise<void>;
  updateEnvelope: (id: string, name: string) => Promise<void>;
  deleteEnvelope: (id: string) => Promise<void>;
  setActiveEnvelopeId: (id: string | null) => void;
  setDefaultEnvelopeId: (id: string | null) => void;
  
  addLabel: (name: string, color: string) => Promise<void>;
  updateLabel: (id: string, name: string, color: string) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  
  addComment: (noteId: string, content: string) => Promise<void>;
  deleteComment: (noteId: string, commentId: string) => Promise<void>;
  
  addAttachment: (noteId: string, file: File) => Promise<Attachment>;
  deleteAttachment: (noteId: string, attachmentId: string) => Promise<void>;
  
  setSearchTerm: (term: string) => void;
  sortNotes: (sortOption: SortOptions) => void;
}

const NotesContext = createContext<NotesContextProps | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeEnvelopeId, setActiveEnvelopeId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOptions>(() => {
    // Try to load sort option from localStorage
    const savedSortOption = localStorage.getItem('sortOption');
    return (savedSortOption as SortOptions) || "dateNewest";
  });
  const [defaultEnvelopeId, setDefaultEnvelopeId] = useState<string | null>(() => {
    // Try to load default envelope from localStorage
    const savedDefaultEnvelope = localStorage.getItem('defaultEnvelopeId');
    return savedDefaultEnvelope;
  });

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await storage.initializeStorage();
        
        const loadedNotes = await storage.getNotes();
        const loadedEnvelopes = await storage.getEnvelopes();
        const loadedLabels = await storage.getLabels();
        
        setNotes(loadedNotes);
        setEnvelopes(loadedEnvelopes);
        setLabels(loadedLabels);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Save sort option to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sortOption', sortOption);
  }, [sortOption]);
  
  // Save default envelope to localStorage whenever it changes
  useEffect(() => {
    if (defaultEnvelopeId) {
      localStorage.setItem('defaultEnvelopeId', defaultEnvelopeId);
    } else {
      localStorage.removeItem('defaultEnvelopeId');
    }
  }, [defaultEnvelopeId]);

  // Effect to update activeNote when activeNoteId changes
  useEffect(() => {
    if (activeNoteId) {
      const note = notes.find(note => note.id === activeNoteId);
      if (note) {
        setActiveNote(note);
      }
    } else {
      setActiveNote(null);
    }
  }, [activeNoteId, notes]);

  // Filter notes based on active envelope and search term
  let filteredNotes = notes.filter(note => {
    const matchesEnvelope = activeEnvelopeId ? note.envelopeId === activeEnvelopeId : true;
    const matchesSearch = searchTerm
      ? note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesEnvelope && matchesSearch;
  });

  // Sort notes based on the current sort option
  const sortNotes = (option: SortOptions) => {
    setSortOption(option);
  };

  // Apply sorting to filtered notes
  filteredNotes = [...filteredNotes].sort((a, b) => {
    switch (sortOption) {
      case "dateNewest":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "dateOldest":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "envelope": {
        const envelopeA = envelopes.find(env => env.id === a.envelopeId)?.name || "";
        const envelopeB = envelopes.find(env => env.id === b.envelopeId)?.name || "";
        return envelopeA.localeCompare(envelopeB);
      }
      case "latestComment": {
        const latestCommentA = a.comments.length > 0 
          ? new Date(a.comments[a.comments.length - 1].createdAt).getTime()
          : 0;
        const latestCommentB = b.comments.length > 0
          ? new Date(b.comments[b.comments.length - 1].createdAt).getTime()
          : 0;
        return latestCommentB - latestCommentA;
      }
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  // Note operations
  const addNote = async (title: string, content: string, envelopeId: string, labelIds: string[]) => {
    // Use the default envelope if one isn't provided but a default is set
    const finalEnvelopeId = envelopeId || (defaultEnvelopeId || "");
    
    const now = new Date().toISOString();
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      envelopeId: finalEnvelopeId,
      labelIds,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: []
    };

    await storage.addNote(newNote);
    setNotes(prev => [...prev, newNote]);
    setActiveNote(newNote);
    setActiveNoteId(newNote.id);
  };

  const updateNote = async (id: string, updates: Partial<Omit<Note, "id">>) => {
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        const updatedNote = {
          ...note,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        if (activeNote?.id === id) {
          setActiveNote(updatedNote);
        }
        
        return updatedNote;
      }
      return note;
    });

    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  const deleteNote = async (id: string) => {
    await storage.deleteNote(id);
    setNotes(notes.filter(note => note.id !== id));
    
    if (activeNote?.id === id) {
      setActiveNote(null);
      setActiveNoteId(null);
    }
  };

  // Envelope operations
  const addEnvelope = async (name: string) => {
    const newEnvelope: Envelope = {
      id: uuidv4(),
      name
    };

    await storage.addEnvelope(newEnvelope);
    setEnvelopes([...envelopes, newEnvelope]);
  };

  const updateEnvelope = async (id: string, name: string) => {
    const updatedEnvelopes = envelopes.map(envelope =>
      envelope.id === id ? { ...envelope, name } : envelope
    );

    await storage.saveEnvelopes(updatedEnvelopes);
    setEnvelopes(updatedEnvelopes);
  };

  const deleteEnvelope = async (id: string) => {
    await storage.deleteEnvelope(id);
    setEnvelopes(envelopes.filter(envelope => envelope.id !== id));
    
    if (activeEnvelopeId === id) {
      setActiveEnvelopeId(null);
    }
    
    // Update any notes that were in this envelope to be in no envelope
    const updatedNotes = notes.map(note => {
      if (note.envelopeId === id) {
        const updatedNote = { ...note, envelopeId: "" };
        return updatedNote;
      }
      return note;
    });
    
    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  // Label operations
  const addLabel = async (name: string, color: string) => {
    const newLabel: Label = {
      id: uuidv4(),
      name,
      color
    };

    await storage.addLabel(newLabel);
    setLabels([...labels, newLabel]);
  };

  const updateLabel = async (id: string, name: string, color: string) => {
    const updatedLabels = labels.map(label =>
      label.id === id ? { ...label, name, color } : label
    );

    await storage.saveLabels(updatedLabels);
    setLabels(updatedLabels);
  };

  const deleteLabel = async (id: string) => {
    await storage.deleteLabel(id);
    setLabels(labels.filter(label => label.id !== id));
    
    // Remove this label from any notes that have it
    const updatedNotes = notes.map(note => {
      if (note.labelIds.includes(id)) {
        const updatedNote = {
          ...note,
          labelIds: note.labelIds.filter(labelId => labelId !== id),
          updatedAt: new Date().toISOString()
        };
        return updatedNote;
      }
      return note;
    });
    
    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  // Comment operations
  const addComment = async (noteId: string, content: string) => {
    const newComment: Comment = {
      id: uuidv4(),
      content,
      createdAt: new Date().toISOString()
    };

    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        const updatedNote = {
          ...note,
          comments: [...note.comments, newComment],
          updatedAt: new Date().toISOString()
        };
        
        if (activeNote?.id === noteId) {
          setActiveNote(updatedNote);
        }
        
        return updatedNote;
      }
      return note;
    });

    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  const deleteComment = async (noteId: string, commentId: string) => {
    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        const updatedNote = {
          ...note,
          comments: note.comments.filter(comment => comment.id !== commentId),
          updatedAt: new Date().toISOString()
        };
        
        if (activeNote?.id === noteId) {
          setActiveNote(updatedNote);
        }
        
        return updatedNote;
      }
      return note;
    });

    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  // Attachment operations
  const addAttachment = async (noteId: string, file: File): Promise<Attachment> => {
    // Read file content as base64
    const fileContent = await indexedDb.blobToBase64(file);
    
    // Create a local URL for the file
    const fileUrl = URL.createObjectURL(file);
    
    const newAttachment: Attachment = {
      id: uuidv4(),
      name: file.name,
      type: file.type,
      url: fileUrl,
      content: fileContent, // Store the base64 content
      createdAt: new Date().toISOString()
    };

    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        const updatedNote = {
          ...note,
          attachments: [...(note.attachments || []), newAttachment],
          updatedAt: new Date().toISOString()
        };
        
        if (activeNote?.id === noteId) {
          setActiveNote(updatedNote);
        }
        
        return updatedNote;
      }
      return note;
    });

    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
    
    return newAttachment;
  };

  const deleteAttachment = async (noteId: string, attachmentId: string) => {
    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        // Find the attachment to revoke its URL
        const attachmentToDelete = note.attachments?.find(a => a.id === attachmentId);
        if (attachmentToDelete && attachmentToDelete.url.startsWith('blob:')) {
          URL.revokeObjectURL(attachmentToDelete.url);
        }
        
        const updatedNote = {
          ...note,
          attachments: (note.attachments || []).filter(a => a.id !== attachmentId),
          updatedAt: new Date().toISOString()
        };
        
        if (activeNote?.id === noteId) {
          setActiveNote(updatedNote);
        }
        
        return updatedNote;
      }
      return note;
    });

    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        envelopes,
        labels,
        activeNote,
        activeEnvelopeId,
        activeNoteId,
        searchTerm,
        filteredNotes,
        sortOption,
        defaultEnvelopeId,
        isLoading,
        
        addNote,
        updateNote,
        deleteNote,
        setActiveNote,
        setActiveNoteId,
        
        addEnvelope,
        updateEnvelope,
        deleteEnvelope,
        setActiveEnvelopeId,
        setDefaultEnvelopeId,
        
        addLabel,
        updateLabel,
        deleteLabel,
        
        addComment,
        deleteComment,
        
        addAttachment,
        deleteAttachment,
        
        setSearchTerm,
        sortNotes
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

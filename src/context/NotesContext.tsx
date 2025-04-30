
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Note, Envelope, Label, Comment, SortOptions } from "@/types/note";
import * as storage from "@/utils/storage";

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
  
  addNote: (title: string, content: string, envelopeId: string, labelIds: string[]) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, "id">>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (note: Note | null) => void;
  setActiveNoteId: (id: string | null) => void;
  
  addEnvelope: (name: string) => void;
  updateEnvelope: (id: string, name: string) => void;
  deleteEnvelope: (id: string) => void;
  setActiveEnvelopeId: (id: string | null) => void;
  
  addLabel: (name: string, color: string) => void;
  updateLabel: (id: string, name: string, color: string) => void;
  deleteLabel: (id: string) => void;
  
  addComment: (noteId: string, content: string) => void;
  deleteComment: (noteId: string, commentId: string) => void;
  
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
  const [sortOption, setSortOption] = useState<SortOptions>(() => {
    // Try to load sort option from localStorage
    const savedSortOption = localStorage.getItem('sortOption');
    return (savedSortOption as SortOptions) || "dateNewest";
  });

  // Initialize data on component mount
  useEffect(() => {
    storage.initializeStorage();
    
    setNotes(storage.getNotes());
    setEnvelopes(storage.getEnvelopes());
    setLabels(storage.getLabels());
  }, []);

  // Save sort option to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sortOption', sortOption);
  }, [sortOption]);

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
  const addNote = (title: string, content: string, envelopeId: string, labelIds: string[]) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      envelopeId,
      labelIds,
      createdAt: now,
      updatedAt: now,
      comments: []
    };

    storage.addNote(newNote);
    setNotes([...notes, newNote]);
    setActiveNote(newNote);
    setActiveNoteId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, "id">>) => {
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

    storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  const deleteNote = (id: string) => {
    storage.deleteNote(id);
    setNotes(notes.filter(note => note.id !== id));
    
    if (activeNote?.id === id) {
      setActiveNote(null);
      setActiveNoteId(null);
    }
  };

  // Envelope operations
  const addEnvelope = (name: string) => {
    const newEnvelope: Envelope = {
      id: uuidv4(),
      name
    };

    storage.addEnvelope(newEnvelope);
    setEnvelopes([...envelopes, newEnvelope]);
  };

  const updateEnvelope = (id: string, name: string) => {
    const updatedEnvelopes = envelopes.map(envelope =>
      envelope.id === id ? { ...envelope, name } : envelope
    );

    storage.saveEnvelopes(updatedEnvelopes);
    setEnvelopes(updatedEnvelopes);
  };

  const deleteEnvelope = (id: string) => {
    storage.deleteEnvelope(id);
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
    
    storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  // Label operations
  const addLabel = (name: string, color: string) => {
    const newLabel: Label = {
      id: uuidv4(),
      name,
      color
    };

    storage.addLabel(newLabel);
    setLabels([...labels, newLabel]);
  };

  const updateLabel = (id: string, name: string, color: string) => {
    const updatedLabels = labels.map(label =>
      label.id === id ? { ...label, name, color } : label
    );

    storage.saveLabels(updatedLabels);
    setLabels(updatedLabels);
  };

  const deleteLabel = (id: string) => {
    storage.deleteLabel(id);
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
    
    storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  // Comment operations
  const addComment = (noteId: string, content: string) => {
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

    storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };

  const deleteComment = (noteId: string, commentId: string) => {
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

    storage.saveNotes(updatedNotes);
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
        
        addNote,
        updateNote,
        deleteNote,
        setActiveNote,
        setActiveNoteId,
        
        addEnvelope,
        updateEnvelope,
        deleteEnvelope,
        setActiveEnvelopeId,
        
        addLabel,
        updateLabel,
        deleteLabel,
        
        addComment,
        deleteComment,
        
        setSearchTerm,
        sortNotes
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

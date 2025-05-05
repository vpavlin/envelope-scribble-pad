import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Note, NoteVersion, Envelope, Label, Comment, SortOptions, Attachment, MessageType } from "@/types/note";
import * as storage from "@/utils/storage";
import * as indexedDb from "@/utils/indexedDb";
import { emit, subscribe, isWakuInitialized, initializeWaku, getSyncConfig } from "@/utils/wakuSync";
import { toast } from "@/components/ui/sonner";
import { Dispatcher } from "waku-dispatcher";
import { Identity } from "@/utils/identity";

// Generate a unique device ID for conflict resolution
const DEVICE_ID = uuidv4();

interface NotesContextProps {
  notes: Note[];
  envelopes: Envelope[];
  labels: Label[];
  activeNote: Note | null;
  activeEnvelopeId: string | null;
  activeNoteId: string | null;
  activeLabelId: string | null;
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
  setActiveLabelId: (id: string | null) => void;
  
  addComment: (noteId: string, content: string) => Promise<void>;
  deleteComment: (noteId: string, commentId: string) => Promise<void>;
  
  addAttachment: (noteId: string, file: File) => Promise<Attachment>;
  deleteAttachment: (noteId: string, attachmentId: string) => Promise<void>;
  
  setSearchTerm: (term: string) => void;
  sortNotes: (sortOption: SortOptions) => void;
  
  viewNoteHistory: (noteId: string) => NoteVersion[] | undefined;
  restoreNoteVersion: (noteId: string, version: number) => Promise<void>;
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
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dispatcher, setDispatcher] = useState<Dispatcher | null>()
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
  const [syncProcessingIds] = useState<Set<string>>(new Set());

  // Added function to view note history
  const viewNoteHistory = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    return note?.previousVersions;
  };

  // Added function to restore a previous version
  const restoreNoteVersion = async (noteId: string, version: number) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.previousVersions) return;

    const versionToRestore = note.previousVersions.find(v => v.version === version);
    if (!versionToRestore) return;

    // Create a new version based on the old one but with incremented version number
    await updateNote(noteId, {
      title: versionToRestore.title,
      content: versionToRestore.content,
      envelopeId: versionToRestore.envelopeId,
      labelIds: versionToRestore.labelIds,
      // Version and updatedAt will be handled by updateNote
    });

    toast.success("Previous version restored successfully");
  };

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

  useEffect(() => {
    // Check if sync is enabled and initialize Waku
    const initializeSync = async () => {
      const syncConfig = getSyncConfig();
      if (syncConfig.enabled && syncConfig.password) {
        try {
          const dispatcher = await initializeWaku(syncConfig.password);

          setDispatcher(dispatcher)
          if (dispatcher) {
            toast.success("Cross-device sync initialized successfully");
          } else {
            toast.error("Failed to initialize cross-device sync");
          }
        } catch (error) {
          console.error("Error initializing Waku:", error);
          toast.error("Error initializing cross-device sync");
        }
      }
    };
    
    initializeSync();
  }, []);

  // Modify updateNote to handle versioning and conflict resolution
  const updateNote = async (id: string, updates: Partial<Omit<Note, "id">>) => {
    let updatedNote: Note | null = null;
    
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        // Setup versioning
        const currentVersion = note.version || 0;
        const newVersion = currentVersion + 1;
        
        // Create a version record of the current state before updating
        const versionRecord: NoteVersion = {
          title: note.title,
          content: note.content,
          envelopeId: note.envelopeId,
          labelIds: [...note.labelIds],
          updatedAt: note.updatedAt,
          version: currentVersion,
          deviceId: DEVICE_ID
        };
        
        // Store up to 10 previous versions
        const previousVersions = note.previousVersions || [];
        if (previousVersions.length >= 10) {
          previousVersions.shift(); // Remove oldest version
        }
        previousVersions.push(versionRecord);
        
        const noteWithUpdates = {
          ...note,
          ...updates,
          version: newVersion,
          previousVersions,
          updatedAt: new Date().toISOString()
        };
        
        if (activeNote?.id === id) {
          setActiveNote(noteWithUpdates);
        }
        
        updatedNote = noteWithUpdates;
        return noteWithUpdates;
      }
      return note;
    });

    await storage.saveNotes(updatedNotes);
    setNotes(updatedNotes);
    
    // Sync update to other devices
    if (isWakuInitialized() && updatedNote) {
      syncProcessingIds.add(id);
      try {
        await emit(MessageType.NOTE_UPDATED, updatedNote);
      } catch (error) {
        console.error("Error syncing note update:", error);
        toast.error("Failed to sync note update to other devices");
      } finally {
        syncProcessingIds.delete(id);
      }
    }
  };

  // Initialize Waku subscriptions
  useEffect(() => {
    if (dispatcher && isWakuInitialized()) {
      // Subscribe to note events
      subscribe<Note>(MessageType.NOTE_ADDED, (note) => {
        if (!syncProcessingIds.has(note.id)) {
          setNotes(prevNotes => {
            // Only add if the note doesn't already exist
            if (!prevNotes.some(n => n.id === note.id)) {
              storage.addNote(note);
              return [...prevNotes, note];
            }
            return prevNotes;
          });
        }
      });

      subscribe<Note>(MessageType.NOTE_UPDATED, (receivedNote) => {
        if (!syncProcessingIds.has(receivedNote.id)) {
          setNotes(prevNotes => {
            const localNote = prevNotes.find(n => n.id === receivedNote.id);
            
            // If we don't have this note locally, just add it
            if (!localNote) {
              storage.updateNote(receivedNote);
              return [...prevNotes, receivedNote];
            }
            
            // Check for conflicts (both devices modified since last sync)
            const localVersion = localNote.version || 0;
            const receivedVersion = receivedNote.version || 0;
            const localDate = new Date(localNote.updatedAt).getTime();
            const receivedDate = new Date(receivedNote.updatedAt).getTime();
            
            // Conflict detected: same version number but different content
            if (localVersion === receivedVersion && 
                (localNote.title !== receivedNote.title || 
                 localNote.content !== receivedNote.content)) {
              
              // Last-write-wins: use the most recent update by timestamp
              if (receivedDate > localDate) {
                // Received note is newer - create version from local note first
                if (!receivedNote.previousVersions) receivedNote.previousVersions = [];
                
                // Only add local version if it doesn't already exist in history
                const localVersionExists = receivedNote.previousVersions.some(
                  v => v.version === localVersion && v.deviceId === DEVICE_ID
                );
                
                if (!localVersionExists) {
                  const localVersionRecord: NoteVersion = {
                    title: localNote.title,
                    content: localNote.content,
                    envelopeId: localNote.envelopeId,
                    labelIds: [...localNote.labelIds],
                    updatedAt: localNote.updatedAt,
                    version: localVersion,
                    deviceId: DEVICE_ID
                  };
                  
                  // Keep up to 10 versions
                  if (receivedNote.previousVersions.length >= 10) {
                    receivedNote.previousVersions.shift();
                  }
                  
                  receivedNote.previousVersions.push(localVersionRecord);
                }
                
                // Use received note (the newer one)
                storage.updateNote(receivedNote);
                
                // Notify user about the conflict
                toast({
                  title: "Note Conflict Detected",
                  description: "This note was modified elsewhere. The most recent version is shown, but you can view history to see your changes.",
                  duration: 5000,
                });
                
                return prevNotes.map(n => n.id === receivedNote.id ? receivedNote : n);
              } else {
                // Local note is newer - keep it but store received version in history
                const updatedLocalNote = { ...localNote };
                
                if (!updatedLocalNote.previousVersions) updatedLocalNote.previousVersions = [];
                
                // Only add remote version if it doesn't already exist
                const remoteVersionExists = updatedLocalNote.previousVersions.some(
                  v => v.version === receivedVersion && v.deviceId === receivedNote.deviceId
                );
                
                if (!remoteVersionExists) {
                  const remoteVersionRecord: NoteVersion = {
                    title: receivedNote.title,
                    content: receivedNote.content,
                    envelopeId: receivedNote.envelopeId,
                    labelIds: [...receivedNote.labelIds],
                    updatedAt: receivedNote.updatedAt,
                    version: receivedVersion,
                    deviceId: receivedNote.deviceId
                  };
                  
                  // Keep up to 10 versions
                  if (updatedLocalNote.previousVersions.length >= 10) {
                    updatedLocalNote.previousVersions.shift();
                  }
                  
                  updatedLocalNote.previousVersions.push(remoteVersionRecord);
                }
                
                storage.updateNote(updatedLocalNote);
                
                // Notify user about the conflict
                toast({
                  title: "Note Conflict Detected",
                  description: "Your local changes were kept. A conflicting remote version has been added to history.",
                  duration: 5000,
                });
                
                return prevNotes.map(n => n.id === updatedLocalNote.id ? updatedLocalNote : n);
              }
            } 
            // No conflict or remote version is newer
            else if (receivedVersion > localVersion) {
              // Straightforward update - newer version
              storage.updateNote(receivedNote);
              return prevNotes.map(n => n.id === receivedNote.id ? receivedNote : n);
            } 
            // Local version is newer, keep it
            else {
              return prevNotes;
            }
          });
        }
      });

      subscribe<string>(MessageType.NOTE_DELETED, (noteId) => {
        if (!syncProcessingIds.has(noteId)) {
          setNotes(prevNotes => {
            const filteredNotes = prevNotes.filter(n => n.id !== noteId);
            storage.deleteNote(noteId);
            return filteredNotes;
          });
        }
      });

      // Subscribe to envelope events
      subscribe<Envelope>(MessageType.ENVELOPE_ADDED, (envelope) => {
        if (!syncProcessingIds.has(envelope.id)) {
          setEnvelopes(prevEnvelopes => {
            // Only add if the envelope doesn't already exist
            if (!prevEnvelopes.some(e => e.id === envelope.id)) {
              storage.addEnvelope(envelope);
              return [...prevEnvelopes, envelope];
            }
            return prevEnvelopes;
          });
        }
      });

      subscribe<Envelope>(MessageType.ENVELOPE_UPDATED, (envelope) => {
        if (!syncProcessingIds.has(envelope.id)) {
          setEnvelopes(prevEnvelopes => {
            const updatedEnvelopes = prevEnvelopes.map(e => e.id === envelope.id ? envelope : e);
            storage.updateEnvelope(envelope);
            return updatedEnvelopes;
          });
        }
      });

      subscribe<string>(MessageType.ENVELOPE_DELETED, (envelopeId) => {
        if (!syncProcessingIds.has(envelopeId)) {
          setEnvelopes(prevEnvelopes => {
            const filteredEnvelopes = prevEnvelopes.filter(e => e.id !== envelopeId);
            storage.deleteEnvelope(envelopeId);
            return filteredEnvelopes;
          });
        }
      });

      // Subscribe to label events
      subscribe<Label>(MessageType.LABEL_ADDED, (label) => {
        if (!syncProcessingIds.has(label.id)) {
          setLabels(prevLabels => {
            // Only add if the label doesn't already exist
            if (!prevLabels.some(l => l.id === label.id)) {
              storage.addLabel(label);
              return [...prevLabels, label];
            }
            return prevLabels;
          });
        }
      });

      subscribe<Label>(MessageType.LABEL_UPDATED, (label) => {
        if (!syncProcessingIds.has(label.id)) {
          setLabels(prevLabels => {
            const updatedLabels = prevLabels.map(l => l.id === label.id ? label : l);
            storage.updateLabel(label);
            return updatedLabels;
          });
        }
      });

      subscribe<string>(MessageType.LABEL_DELETED, (labelId) => {
        if (!syncProcessingIds.has(labelId)) {
          setLabels(prevLabels => {
            const filteredLabels = prevLabels.filter(l => l.id !== labelId);
            storage.deleteLabel(labelId);
            return filteredLabels;
          });
        }
      });

      console.log("Dispatcher ready")
      dispatcher.dispatchQuery()

    }
  }, [dispatcher]);

  // Modify addNote to include version information
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
      attachments: [],
      version: 1,  // Start at version 1
      previousVersions: []  // Initialize empty version history
    };

    // Add to local storage
    await storage.addNote(newNote);
    setNotes(prev => [...prev, newNote]);
    setActiveNote(newNote);
    setActiveNoteId(newNote.id);
    
    // Sync to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(newNote.id);
      try {
        await emit(MessageType.NOTE_ADDED, newNote);
      } catch (error) {
        console.error("Error syncing new note:", error);
        toast.error("Failed to sync new note to other devices");
      } finally {
        syncProcessingIds.delete(newNote.id);
      }
    }
  };

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

  // Filter and sort notes
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

  const deleteNote = async (id: string) => {
    await storage.deleteNote(id);
    setNotes(notes.filter(note => note.id !== id));
    
    if (activeNote?.id === id) {
      setActiveNote(null);
      setActiveNoteId(null);
    }
    
    // Sync deletion to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(id);
      try {
        await emit(MessageType.NOTE_DELETED, id);
      } catch (error) {
        console.error("Error syncing note deletion:", error);
        toast.error("Failed to sync note deletion to other devices");
      } finally {
        syncProcessingIds.delete(id);
      }
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
    
    // Sync to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(newEnvelope.id);
      try {
        await emit(MessageType.ENVELOPE_ADDED, newEnvelope);
      } catch (error) {
        console.error("Error syncing new envelope:", error);
        toast.error("Failed to sync new envelope to other devices");
      } finally {
        syncProcessingIds.delete(newEnvelope.id);
      }
    }
  };

  const updateEnvelope = async (id: string, name: string) => {
    const updatedEnvelope = { id, name };
    const updatedEnvelopes = envelopes.map(envelope =>
      envelope.id === id ? updatedEnvelope : envelope
    );

    await storage.saveEnvelopes(updatedEnvelopes);
    setEnvelopes(updatedEnvelopes);
    
    // Sync update to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(id);
      try {
        await emit(MessageType.ENVELOPE_UPDATED, updatedEnvelope);
      } catch (error) {
        console.error("Error syncing envelope update:", error);
        toast.error("Failed to sync envelope update to other devices");
      } finally {
        syncProcessingIds.delete(id);
      }
    }
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
    
    // Sync deletion to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(id);
      try {
        await emit(MessageType.ENVELOPE_DELETED, id);
      } catch (error) {
        console.error("Error syncing envelope deletion:", error);
        toast.error("Failed to sync envelope deletion to other devices");
      } finally {
        syncProcessingIds.delete(id);
      }
    }
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
    
    // Sync to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(newLabel.id);
      try {
        await emit(MessageType.LABEL_ADDED, newLabel);
      } catch (error) {
        console.error("Error syncing new label:", error);
        toast.error("Failed to sync new label to other devices");
      } finally {
        syncProcessingIds.delete(newLabel.id);
      }
    }
  };

  const updateLabel = async (id: string, name: string, color: string) => {
    const updatedLabel = { id, name, color };
    const updatedLabels = labels.map(label =>
      label.id === id ? updatedLabel : label
    );

    await storage.saveLabels(updatedLabels);
    setLabels(updatedLabels);
    
    // Sync update to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(id);
      try {
        await emit(MessageType.LABEL_UPDATED, updatedLabel);
      } catch (error) {
        console.error("Error syncing label update:", error);
        toast.error("Failed to sync label update to other devices");
      } finally {
        syncProcessingIds.delete(id);
      }
    }
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
    
    // Sync deletion to other devices
    if (isWakuInitialized()) {
      syncProcessingIds.add(id);
      try {
        await emit(MessageType.LABEL_DELETED, id);
      } catch (error) {
        console.error("Error syncing label deletion:", error);
        toast.error("Failed to sync label deletion to other devices");
      } finally {
        syncProcessingIds.delete(id);
      }
    }
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
        activeLabelId,
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
        setActiveLabelId,
        
        addComment,
        deleteComment,
        
        addAttachment,
        deleteAttachment,
        
        setSearchTerm,
        sortNotes,
        
        viewNoteHistory,
        restoreNoteVersion
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

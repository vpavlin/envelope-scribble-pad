
import { Note, Envelope, Label, Comment, Attachment } from "@/types/note";
import * as indexedDb from "./indexedDb";

const NOTES_STORE = "notes";
const ENVELOPES_STORE = "envelopes";
const LABELS_STORE = "labels";

// Helper function to make sure we initialize from localStorage if needed (migration)
const migrateFromLocalStorage = async <T>(key: string, storeName: string): Promise<T[]> => {
  try {
    // Check if we have data in localStorage
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsedData = JSON.parse(localData) as T[];
      // Store in IndexedDB
      await indexedDb.saveAllItems(storeName, parsedData);
      // Clear from localStorage after migration
      localStorage.removeItem(key);
      return parsedData;
    }
  } catch (error) {
    console.error(`Error migrating ${key} from localStorage:`, error);
  }
  
  // Return empty array as fallback
  return [];
};

// Notes
export const getNotes = async (): Promise<Note[]> => {
  try {
    // Try to get from IndexedDB
    const notes = await indexedDb.getAllItems<Note>(NOTES_STORE);
    
    // If no notes in IndexedDB, try to migrate from localStorage
    if (notes.length === 0) {
      const migratedNotes = await migrateFromLocalStorage<Note>("notes", NOTES_STORE);
      
      // Process attachments (create ObjectURLs for any that have content)
      for (const note of migratedNotes) {
        if (note.attachments) {
          for (const attachment of note.attachments) {
            if (attachment.content) {
              try {
                const blob = await indexedDb.base64ToBlob(attachment.content);
                attachment.url = URL.createObjectURL(blob);
              } catch (error) {
                console.error("Error creating blob URL:", error);
              }
            }
          }
        }
      }
      
      return migratedNotes;
    }
    
    // Process attachments for notes from IndexedDB
    for (const note of notes) {
      if (note.attachments) {
        for (const attachment of note.attachments) {
          if (attachment.content) {
            try {
              const blob = await indexedDb.base64ToBlob(attachment.content);
              attachment.url = URL.createObjectURL(blob);
            } catch (error) {
              console.error("Error creating blob URL:", error);
            }
          }
        }
      }
    }
    
    return notes;
  } catch (error) {
    console.error("Error getting notes:", error);
    return [];
  }
};

export const saveNotes = async (notes: Note[]): Promise<void> => {
  try {
    await indexedDb.saveAllItems(NOTES_STORE, notes);
  } catch (error) {
    console.error("Error saving notes:", error);
  }
};

export const addNote = async (note: Note): Promise<void> => {
  try {
    await indexedDb.addItem(NOTES_STORE, note);
  } catch (error) {
    console.error("Error adding note:", error);
  }
};

export const updateNote = async (updatedNote: Note): Promise<void> => {
  try {
    await indexedDb.updateItem(NOTES_STORE, updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    await indexedDb.deleteItem(NOTES_STORE, noteId);
  } catch (error) {
    console.error("Error deleting note:", error);
  }
};

// Envelopes
export const getEnvelopes = async (): Promise<Envelope[]> => {
  try {
    // Try to get from IndexedDB
    const envelopes = await indexedDb.getAllItems<Envelope>(ENVELOPES_STORE);
    
    // If no envelopes in IndexedDB, try to migrate from localStorage
    if (envelopes.length === 0) {
      return await migrateFromLocalStorage<Envelope>("envelopes", ENVELOPES_STORE);
    }
    
    return envelopes;
  } catch (error) {
    console.error("Error getting envelopes:", error);
    return [];
  }
};

export const saveEnvelopes = async (envelopes: Envelope[]): Promise<void> => {
  try {
    await indexedDb.saveAllItems(ENVELOPES_STORE, envelopes);
  } catch (error) {
    console.error("Error saving envelopes:", error);
  }
};

export const addEnvelope = async (envelope: Envelope): Promise<void> => {
  try {
    await indexedDb.addItem(ENVELOPES_STORE, envelope);
  } catch (error) {
    console.error("Error adding envelope:", error);
  }
};

export const updateEnvelope = async (updatedEnvelope: Envelope): Promise<void> => {
  try {
    await indexedDb.updateItem(ENVELOPES_STORE, updatedEnvelope);
  } catch (error) {
    console.error("Error updating envelope:", error);
  }
};

export const deleteEnvelope = async (envelopeId: string): Promise<void> => {
  try {
    await indexedDb.deleteItem(ENVELOPES_STORE, envelopeId);
  } catch (error) {
    console.error("Error deleting envelope:", error);
  }
};

// Labels
export const getLabels = async (): Promise<Label[]> => {
  try {
    // Try to get from IndexedDB
    const labels = await indexedDb.getAllItems<Label>(LABELS_STORE);
    
    // If no labels in IndexedDB, try to migrate from localStorage
    if (labels.length === 0) {
      return await migrateFromLocalStorage<Label>("labels", LABELS_STORE);
    }
    
    return labels;
  } catch (error) {
    console.error("Error getting labels:", error);
    return [];
  }
};

export const saveLabels = async (labels: Label[]): Promise<void> => {
  try {
    await indexedDb.saveAllItems(LABELS_STORE, labels);
  } catch (error) {
    console.error("Error saving labels:", error);
  }
};

export const addLabel = async (label: Label): Promise<void> => {
  try {
    await indexedDb.addItem(LABELS_STORE, label);
  } catch (error) {
    console.error("Error adding label:", error);
  }
};

export const updateLabel = async (updatedLabel: Label): Promise<void> => {
  try {
    await indexedDb.updateItem(LABELS_STORE, updatedLabel);
  } catch (error) {
    console.error("Error updating label:", error);
  }
};

export const deleteLabel = async (labelId: string): Promise<void> => {
  try {
    await indexedDb.deleteItem(LABELS_STORE, labelId);
  } catch (error) {
    console.error("Error deleting label:", error);
  }
};

// Comments
export const addComment = async (noteId: string, comment: Comment): Promise<void> => {
  try {
    const notes = await getNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      notes[noteIndex].comments.push(comment);
      await saveNotes(notes);
    }
  } catch (error) {
    console.error("Error adding comment:", error);
  }
};

export const deleteComment = async (noteId: string, commentId: string): Promise<void> => {
  try {
    const notes = await getNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      notes[noteIndex].comments = notes[noteIndex].comments.filter(
        comment => comment.id !== commentId
      );
      await saveNotes(notes);
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
};

// Attachments
export const addAttachment = async (noteId: string, attachment: Attachment): Promise<void> => {
  try {
    const notes = await getNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      notes[noteIndex].attachments = [...(notes[noteIndex].attachments || []), attachment];
      await saveNotes(notes);
    }
  } catch (error) {
    console.error("Error adding attachment:", error);
  }
};

export const deleteAttachment = async (noteId: string, attachmentId: string): Promise<void> => {
  try {
    const notes = await getNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1 && notes[noteIndex].attachments) {
      // Find the attachment to revoke its URL
      const attachmentToDelete = notes[noteIndex].attachments.find(a => a.id === attachmentId);
      if (attachmentToDelete && attachmentToDelete.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToDelete.url);
      }
      
      notes[noteIndex].attachments = notes[noteIndex].attachments.filter(
        attachment => attachment.id !== attachmentId
      );
      await saveNotes(notes);
    }
  } catch (error) {
    console.error("Error deleting attachment:", error);
  }
};

// Initialize with sample data if empty
export const initializeStorage = async (): Promise<void> => {
  try {
    // Get data from storage (which includes migration if needed)
    const notes = await getNotes();
    const envelopes = await getEnvelopes();
    const labels = await getLabels();

    if (envelopes.length === 0) {
      await saveEnvelopes([
        { id: "env1", name: "Personal" },
        { id: "env2", name: "Work" },
        { id: "env3", name: "Ideas" }
      ]);
    }

    if (labels.length === 0) {
      await saveLabels([
        { id: "lbl1", name: "Important", color: "#f97316" },
        { id: "lbl2", name: "Urgent", color: "#dc2626" },
        { id: "lbl3", name: "Later", color: "#8b5cf6" }
      ]);
    }

    if (notes.length === 0) {
      const currentDate = new Date().toISOString();
      await saveNotes([
        {
          id: "note1",
          title: "Welcome to NoteEnvelope",
          content: "This is your first note! Organize your thoughts with envelopes and labels.",
          envelopeId: "env1",
          labelIds: ["lbl1"],
          createdAt: currentDate,
          updatedAt: currentDate,
          comments: [
            {
              id: "comment1",
              content: "You can add comments to notes too!",
              createdAt: currentDate
            }
          ],
          attachments: []
        }
      ]);
    } else {
      // Ensure any existing notes have attachments array
      const updatedNotes = notes.map(note => ({
        ...note,
        attachments: note.attachments || []
      }));
      await saveNotes(updatedNotes);
    }
  } catch (error) {
    console.error("Error initializing storage:", error);
  }
};

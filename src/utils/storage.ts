import { Note, Envelope, Label, Comment, Attachment } from "@/types/note";

const NOTES_KEY = "notes";
const ENVELOPES_KEY = "envelopes";
const LABELS_KEY = "labels";

// Helper functions
const getItem = <T>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const setItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Notes
export const getNotes = (): Note[] => getItem<Note[]>(NOTES_KEY, []);

export const saveNotes = (notes: Note[]): void => setItem(NOTES_KEY, notes);

export const addNote = (note: Note): void => {
  const notes = getNotes();
  saveNotes([...notes, note]);
};

export const updateNote = (updatedNote: Note): void => {
  const notes = getNotes();
  saveNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note));
};

export const deleteNote = (noteId: string): void => {
  const notes = getNotes();
  saveNotes(notes.filter(note => note.id !== noteId));
};

// Envelopes
export const getEnvelopes = (): Envelope[] => getItem<Envelope[]>(ENVELOPES_KEY, []);

export const saveEnvelopes = (envelopes: Envelope[]): void => setItem(ENVELOPES_KEY, envelopes);

export const addEnvelope = (envelope: Envelope): void => {
  const envelopes = getEnvelopes();
  saveEnvelopes([...envelopes, envelope]);
};

export const updateEnvelope = (updatedEnvelope: Envelope): void => {
  const envelopes = getEnvelopes();
  saveEnvelopes(envelopes.map(envelope => envelope.id === updatedEnvelope.id ? updatedEnvelope : envelope));
};

export const deleteEnvelope = (envelopeId: string): void => {
  const envelopes = getEnvelopes();
  saveEnvelopes(envelopes.filter(envelope => envelope.id !== envelopeId));
};

// Labels
export const getLabels = (): Label[] => getItem<Label[]>(LABELS_KEY, []);

export const saveLabels = (labels: Label[]): void => setItem(LABELS_KEY, labels);

export const addLabel = (label: Label): void => {
  const labels = getLabels();
  saveLabels([...labels, label]);
};

export const updateLabel = (updatedLabel: Label): void => {
  const labels = getLabels();
  saveLabels(labels.map(label => label.id === updatedLabel.id ? updatedLabel : label));
};

export const deleteLabel = (labelId: string): void => {
  const labels = getLabels();
  saveLabels(labels.filter(label => label.id !== labelId));
};

// Comments
export const addComment = (noteId: string, comment: Comment): void => {
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex !== -1) {
    notes[noteIndex].comments.push(comment);
    saveNotes(notes);
  }
};

export const deleteComment = (noteId: string, commentId: string): void => {
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex !== -1) {
    notes[noteIndex].comments = notes[noteIndex].comments.filter(
      comment => comment.id !== commentId
    );
    saveNotes(notes);
  }
};

// Attachments
export const addAttachment = (noteId: string, attachment: Attachment): void => {
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex !== -1) {
    notes[noteIndex].attachments = [...(notes[noteIndex].attachments || []), attachment];
    saveNotes(notes);
  }
};

export const deleteAttachment = (noteId: string, attachmentId: string): void => {
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex !== -1 && notes[noteIndex].attachments) {
    notes[noteIndex].attachments = notes[noteIndex].attachments.filter(
      attachment => attachment.id !== attachmentId
    );
    saveNotes(notes);
  }
};

// Initialize with sample data if empty
export const initializeStorage = (): void => {
  const notes = getNotes();
  const envelopes = getEnvelopes();
  const labels = getLabels();

  if (envelopes.length === 0) {
    saveEnvelopes([
      { id: "env1", name: "Personal" },
      { id: "env2", name: "Work" },
      { id: "env3", name: "Ideas" }
    ]);
  }

  if (labels.length === 0) {
    saveLabels([
      { id: "lbl1", name: "Important", color: "#f97316" },
      { id: "lbl2", name: "Urgent", color: "#dc2626" },
      { id: "lbl3", name: "Later", color: "#8b5cf6" }
    ]);
  }

  if (notes.length === 0) {
    const currentDate = new Date().toISOString();
    saveNotes([
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
    saveNotes(updatedNotes);
  }
};

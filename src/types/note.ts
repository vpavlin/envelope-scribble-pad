
export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
};

export type AISummary = {
  content: string;
  generatedAt: string;
  type: 'summary' | 'enhancement';
};

export type Attachment = {
  id: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
  content?: string; // Base64 encoded content
};

export type Note = {
  id: string;
  title: string;
  content: string;
  envelopeId: string;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  aiSummaries?: AISummary[];
  attachments: Attachment[];
  version: number; // Version counter for conflict resolution
  previousVersions?: NoteVersion[]; // Optional history of previous versions
  deviceId?: string; // Added deviceId as an optional property
};

export type NoteVersion = {
  title: string;
  content: string;
  envelopeId: string;
  labelIds: string[];
  updatedAt: string;
  version: number;
  deviceId?: string; // Identifier of the device that made the change
};

export type Envelope = {
  id: string;
  name: string;
};

export type SortOptions = "dateNewest" | "dateOldest" | "envelope" | "latestComment";

export enum MessageType {
  NOTE_ADDED = "note_added",
  NOTE_UPDATED = "note_updated",
  NOTE_DELETED = "note_deleted",
  ENVELOPE_ADDED = "envelope_added",
  ENVELOPE_UPDATED = "envelope_updated",
  ENVELOPE_DELETED = "envelope_deleted",
  LABEL_ADDED = "label_added",
  LABEL_UPDATED = "label_updated",
  LABEL_DELETED = "label_deleted",
  CONFLICT_DETECTED = "conflict_detected",
}

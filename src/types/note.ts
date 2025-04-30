
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
};

export type Envelope = {
  id: string;
  name: string;
};

export type SortOptions = "dateNewest" | "dateOldest" | "envelope" | "latestComment";

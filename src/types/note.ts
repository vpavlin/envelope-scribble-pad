
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

export type Note = {
  id: string;
  title: string;
  content: string;
  envelopeId: string;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
};

export type Envelope = {
  id: string;
  name: string;
};


import { NoteVersion } from "@/types/note";

/**
 * Creates a simple hash of the note content for version comparison
 * This is a basic implementation to avoid duplicating content in version history
 */
export const hashNoteContent = (title: string, content: string): string => {
  // A simple string hash function, sufficient for our needs
  const str = `${title}::${content}`;
  let hash = 0;
  
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString();
};

/**
 * Checks if a note version with the same content hash already exists
 */
export const findVersionWithSameContent = (
  versions: NoteVersion[] | undefined, 
  contentHash: string
): NoteVersion | undefined => {
  if (!versions) return undefined;
  
  return versions.find(version => version.contentHash === contentHash);
};

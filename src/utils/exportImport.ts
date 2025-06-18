
import { Note, Envelope, Label } from "@/types/note";
import * as storage from "./storage";
import * as sqliteDb from "./sqliteDb";

export interface ExportData {
  notes: Note[];
  envelopes: Envelope[];
  labels: Label[];
  version: number;
  exportDate: string;
}

/**
 * Exports all application data as a serialized JSON string
 * @returns Promise that resolves to a JSON string containing all data
 */
export const exportAllData = async (): Promise<string> => {
  try {
    // Fetch all data from storage
    const notes = await storage.getNotes();
    const envelopes = await storage.getEnvelopes();
    const labels = await storage.getLabels();
    
    // Create export object with metadata
    const exportData: ExportData = {
      notes,
      envelopes,
      labels,
      version: 1, // For future compatibility
      exportDate: new Date().toISOString()
    };
    
    // Serialize to JSON
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("Error exporting data:", error);
    throw new Error("Failed to export data");
  }
};

/**
 * Imports data from a JSON string
 * @param jsonData The serialized JSON data to import
 * @returns Promise that resolves when import is complete
 */
export const importAllData = async (jsonData: string): Promise<void> => {
  try {
    // Parse the JSON data
    const importData = JSON.parse(jsonData) as ExportData;
    
    // Basic validation
    if (!importData.notes || !importData.envelopes || !importData.labels) {
      throw new Error("Invalid import data format");
    }
    
    console.log("Starting import with data:", importData);
    
    // Process attachments for imported notes (recreate object URLs)
    for (const note of importData.notes) {
      if (note.attachments) {
        for (const attachment of note.attachments) {
          if (attachment.content) {
            try {
              // Create a blob from base64 content
              const base64Content = attachment.content;
              // Extract the base64 data part if it's a data URL
              const base64Data = base64Content.includes('base64,') 
                ? base64Content.split('base64,')[1] 
                : base64Content;
              
              // Convert to binary
              const binary = atob(base64Data);
              
              // Create array buffer
              const array = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
              }
              
              // Create blob and object URL
              const blob = new Blob([array], { type: attachment.type || 'application/octet-stream' });
              attachment.url = URL.createObjectURL(blob);
              console.log("Created blob URL for attachment:", attachment.name);
            } catch (error) {
              console.error("Error creating blob URL for attachment:", error);
              // Provide a fallback URL
              attachment.url = attachment.url || '';
            }
          }
        }
      }
      
      // Ensure all notes have attachments array
      note.attachments = note.attachments || [];
      
      // Ensure all notes have comments array
      note.comments = note.comments || [];
      
      // Ensure all notes have version information
      if (note.version === undefined) {
        note.version = 1;
        note.previousVersions = [];
      }
    }
    
    // Import data directly using SQLite functions to ensure it works
    console.log("Importing envelopes:", importData.envelopes.length);
    await sqliteDb.saveAllItems("envelopes", importData.envelopes);
    
    console.log("Importing labels:", importData.labels.length);
    await sqliteDb.saveAllItems("labels", importData.labels);
    
    console.log("Importing notes:", importData.notes.length);
    await sqliteDb.saveAllItems("notes", importData.notes);
    
    // Force save the database
    sqliteDb.saveDatabase();
    
    console.log("Import completed successfully");
    return;
  } catch (error) {
    console.error("Error importing data:", error);
    throw new Error("Failed to import data: " + (error as Error).message);
  }
};

/**
 * Downloads data as a JSON file
 * @param data The data to download
 * @param filename The name of the file
 */
export const downloadJson = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Reads a file as text
 * @param file The file to read
 * @returns Promise that resolves to the file contents as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

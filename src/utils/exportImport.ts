
import { Note, Envelope, Label } from "@/types/note";
import * as storage from "./storage";

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
    
    // Import all data
    await storage.saveNotes(importData.notes);
    await storage.saveEnvelopes(importData.envelopes);
    await storage.saveLabels(importData.labels);
    
    // Process attachments for imported notes (recreate object URLs)
    for (const note of importData.notes) {
      if (note.attachments) {
        for (const attachment of note.attachments) {
          if (attachment.content) {
            try {
              // Recreate blob URL for each attachment
              const blob = await fetch(attachment.content).then(res => res.blob());
              attachment.url = URL.createObjectURL(blob);
            } catch (error) {
              console.error("Error creating blob URL for attachment:", error);
            }
          }
        }
      }
    }
    
    return;
  } catch (error) {
    console.error("Error importing data:", error);
    throw new Error("Failed to import data");
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

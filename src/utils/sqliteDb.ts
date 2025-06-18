
import initSqlJs, { Database } from 'sql.js';

// Database instance
let db: Database | null = null;

// Initialize SQLite database
export const initializeDb = async (): Promise<Database> => {
  if (db) return db;
  
  try {
    // Initialize SQL.js
    const SQL = await initSqlJs({
      // You can specify the path to sql-wasm.wasm here if needed
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem('sqlite-db');
    if (savedDb) {
      const uint8Array = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(uint8Array);
      
      // Check if we need to add missing columns
      try {
        // Try to add aiSummaries column if it doesn't exist
        db.run(`ALTER TABLE notes ADD COLUMN aiSummaries TEXT`);
        console.log("Added aiSummaries column to notes table");
      } catch (error) {
        // Column might already exist, ignore error
      }
      
      saveDatabase();
    } else {
      // Create new database
      db = new SQL.Database();
      
      // Create tables with all necessary columns
      db.run(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          envelopeId TEXT,
          labelIds TEXT, -- JSON string array
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          comments TEXT, -- JSON string
          attachments TEXT, -- JSON string
          version INTEGER DEFAULT 1,
          previousVersions TEXT, -- JSON string
          contentHash TEXT,
          restoredFrom INTEGER,
          deviceId TEXT,
          aiSummaries TEXT -- JSON string
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS envelopes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS labels (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL
        )
      `);
      
      // Save initial empty database
      saveDatabase();
    }
    
    return db;
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
};

// Save database to localStorage
export const saveDatabase = (): void => {
  if (!db) return;
  
  try {
    const data = db.export();
    const dataArray = Array.from(data);
    localStorage.setItem('sqlite-db', JSON.stringify(dataArray));
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Generic get all items from a table
export const getAllItems = async <T>(tableName: string): Promise<T[]> => {
  const database = await initializeDb();
  
  try {
    const stmt = database.prepare(`SELECT * FROM ${tableName}`);
    const results: T[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      
      // Parse JSON fields for notes
      if (tableName === 'notes') {
        if (row.labelIds) row.labelIds = JSON.parse(row.labelIds as string);
        if (row.comments) row.comments = JSON.parse(row.comments as string);
        if (row.attachments) row.attachments = JSON.parse(row.attachments as string);
        if (row.previousVersions) row.previousVersions = JSON.parse(row.previousVersions as string);
        if (row.aiSummaries) row.aiSummaries = JSON.parse(row.aiSummaries as string);
      }
      
      results.push(row as T);
    }
    
    stmt.free();
    return results;
  } catch (error) {
    console.error(`Error getting items from ${tableName}:`, error);
    return [];
  }
};

// Generic get item by ID
export const getItemById = async <T>(tableName: string, id: string): Promise<T | undefined> => {
  const database = await initializeDb();
  
  try {
    const stmt = database.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    stmt.bind([id]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      
      // Parse JSON fields for notes
      if (tableName === 'notes') {
        if (row.labelIds) row.labelIds = JSON.parse(row.labelIds as string);
        if (row.comments) row.comments = JSON.parse(row.comments as string);
        if (row.attachments) row.attachments = JSON.parse(row.attachments as string);
        if (row.previousVersions) row.previousVersions = JSON.parse(row.previousVersions as string);
        if (row.aiSummaries) row.aiSummaries = JSON.parse(row.aiSummaries as string);
      }
      
      stmt.free();
      return row as T;
    }
    
    stmt.free();
    return undefined;
  } catch (error) {
    console.error(`Error getting item by ID from ${tableName}:`, error);
    return undefined;
  }
};

// Generic add item to table
export const addItem = async <T extends Record<string, any>>(tableName: string, item: T): Promise<T> => {
  const database = await initializeDb();
  
  try {
    const columns = Object.keys(item);
    const values = Object.values(item);
    
    // Convert arrays/objects to JSON strings for notes
    if (tableName === 'notes') {
      const processedValues = values.map((value, index) => {
        const column = columns[index];
        if (['labelIds', 'comments', 'attachments', 'previousVersions', 'aiSummaries'].includes(column)) {
          return JSON.stringify(value || []);
        }
        return value;
      });
      
      const placeholders = processedValues.map(() => '?').join(', ');
      const columnNames = columns.join(', ');
      
      const stmt = database.prepare(`INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`);
      stmt.run(processedValues);
      stmt.free();
    } else {
      const placeholders = values.map(() => '?').join(', ');
      const columnNames = columns.join(', ');
      
      const stmt = database.prepare(`INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`);
      stmt.run(values);
      stmt.free();
    }
    
    saveDatabase();
    return item;
  } catch (error) {
    console.error(`Error adding item to ${tableName}:`, error);
    throw error;
  }
};

// Generic update item in table
export const updateItem = async <T extends Record<string, any>>(tableName: string, item: T): Promise<T> => {
  const database = await initializeDb();
  
  try {
    const { id, ...updateFields } = item;
    const columns = Object.keys(updateFields);
    const values = Object.values(updateFields);
    
    // Convert arrays/objects to JSON strings for notes
    if (tableName === 'notes') {
      const processedValues = values.map((value, index) => {
        const column = columns[index];
        if (['labelIds', 'comments', 'attachments', 'previousVersions', 'aiSummaries'].includes(column)) {
          return JSON.stringify(value || []);
        }
        return value;
      });
      
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const stmt = database.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`);
      stmt.run([...processedValues, id]);
      stmt.free();
    } else {
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const stmt = database.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`);
      stmt.run([...values, id]);
      stmt.free();
    }
    
    saveDatabase();
    return item;
  } catch (error) {
    console.error(`Error updating item in ${tableName}:`, error);
    throw error;
  }
};

// Generic delete item from table
export const deleteItem = async (tableName: string, id: string): Promise<void> => {
  const database = await initializeDb();
  
  try {
    const stmt = database.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    stmt.run([id]);
    stmt.free();
    
    saveDatabase();
  } catch (error) {
    console.error(`Error deleting item from ${tableName}:`, error);
    throw error;
  }
};

// Generic save all items (clear and add all)
export const saveAllItems = async <T extends Record<string, any>>(tableName: string, items: T[]): Promise<void> => {
  const database = await initializeDb();
  
  try {
    // Clear the table first
    database.run(`DELETE FROM ${tableName}`);
    
    // Add all items
    for (const item of items) {
      await addItem(tableName, item);
    }
    
    saveDatabase();
  } catch (error) {
    console.error(`Error saving all items to ${tableName}:`, error);
    throw error;
  }
};

// Convert blob to base64 (unchanged from IndexedDB version)
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert base64 to blob (unchanged from IndexedDB version)
export const base64ToBlob = (base64: string): Promise<Blob> => {
  return fetch(base64).then(res => res.blob());
};

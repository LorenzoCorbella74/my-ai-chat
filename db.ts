import { Database } from "jsr:@db/sqlite";

const db = new Database("conversations.db");

// Initialize the database
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    role TEXT,
    content TEXT,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  )
`);

export default db;
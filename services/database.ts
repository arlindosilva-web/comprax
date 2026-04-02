import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('comprax.db');

export const setupDatabase = () => {
  // 1. Tabela de Listas (Ex: Mercado, Churrasco)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS shopping_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  try {
  db.execSync(`ALTER TABLE shopping_lists ADD COLUMN position INTEGER;`);
} catch (e) {
  // Já existe
}

try {
  db.execSync(`ALTER TABLE items ADD COLUMN position INTEGER;`);

} catch (e) {}

  // 2. Tabela de Itens (com list_id para saber a qual lista pertence)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity TEXT, 
      bought INTEGER DEFAULT 0,
      list_id INTEGER,
      FOREIGN KEY (list_id) REFERENCES shopping_lists (id) ON DELETE CASCADE
    );
  `);

  // Migração: Adicionar list_id se ele não existir (para quem já tinha o app)
  try {
    db.execSync(`ALTER TABLE items ADD COLUMN list_id INTEGER;`);
  } catch (e) {}
};

export default db;
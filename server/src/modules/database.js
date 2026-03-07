const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '../../diagnostics.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS diagnostics (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    model         TEXT NOT NULL,
    year          INTEGER,
    fuel_type     TEXT,
    engine        TEXT,
    transmission  TEXT,
    error_codes   TEXT,
    symptoms      TEXT,
    result_json   TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);
console.log('[DB] SQLite initialized at', DB_PATH);
function saveResult(input, result) {
    const stmt = db.prepare(`
        INSERT INTO diagnostics (model, year, fuel_type, engine, transmission, error_codes, symptoms, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
        input.model || '',
        input.year ? parseInt(input.year, 10) : null,
        input.fuelType || null,
        input.engineDetails || null,
        input.transmission || null,
        input.errorCodes || null,
        input.symptoms || null,
        JSON.stringify(result)
    );
    return info.lastInsertRowid;
}
function getAllHistory() {
    return db.prepare(`
        SELECT id, model, year, fuel_type, engine, error_codes, symptoms, created_at
        FROM diagnostics
        ORDER BY created_at DESC
    `).all();
}
function getById(id) {
    return db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(id);
}
function deleteById(id) {
    const info = db.prepare('DELETE FROM diagnostics WHERE id = ?').run(id);
    return info.changes > 0;
}
function closeDb() {
    db.close();
    console.log('[DB] Connection closed.');
}
module.exports = { saveResult, getAllHistory, getById, deleteById, closeDb };

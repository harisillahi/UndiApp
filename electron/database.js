const Database = require('better-sqlite3');

class AppDatabase {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    // Create prizes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prizes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        image_path TEXT,
        remaining INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create participants table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create winners table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS winners (
        id TEXT PRIMARY KEY,
        participant_id TEXT NOT NULL,
        participant_name TEXT NOT NULL,
        prize_id TEXT NOT NULL,
        prize_name TEXT NOT NULL,
        won_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_id) REFERENCES participants(id),
        FOREIGN KEY (prize_id) REFERENCES prizes(id)
      )
    `);

    console.log('Database tables initialized');
  }

  // Prize operations
  addPrize(prize) {
    const stmt = this.db.prepare(`
      INSERT INTO prizes (id, name, quantity, image_path, remaining)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const id = prize.id || Date.now().toString();
    stmt.run(id, prize.name, prize.quantity, prize.image_path || '', prize.quantity);
    
    return { id, ...prize };
  }

  getPrizes() {
    const stmt = this.db.prepare('SELECT * FROM prizes ORDER BY created_at DESC');
    return stmt.all();
  }

  updatePrize(id, prize) {
    const stmt = this.db.prepare(`
      UPDATE prizes 
      SET name = ?, quantity = ?, image_path = ?, remaining = ?
      WHERE id = ?
    `);
    
    stmt.run(prize.name, prize.quantity, prize.image_path || '', prize.remaining, id);
    return { id, ...prize };
  }

  deletePrize(id) {
    const stmt = this.db.prepare('DELETE FROM prizes WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // Participant operations
  addParticipant(participant) {
    const stmt = this.db.prepare('INSERT INTO participants (id, name) VALUES (?, ?)');
    const id = participant.id || Date.now().toString();
    stmt.run(id, participant.name);
    return { id, ...participant };
  }

  getParticipants() {
    const stmt = this.db.prepare('SELECT * FROM participants ORDER BY created_at DESC');
    return stmt.all();
  }

  // Winner operations
  addWinner(winner) {
    const stmt = this.db.prepare(`
      INSERT INTO winners (id, participant_id, participant_name, prize_id, prize_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const id = winner.id || Date.now().toString();
    stmt.run(id, winner.participant_id, winner.participant_name, winner.prize_id, winner.prize_name);
    
    return { id, ...winner };
  }

  getWinners() {
    const stmt = this.db.prepare('SELECT * FROM winners ORDER BY won_at DESC');
    return stmt.all();
  }

  close() {
    this.db.close();
  }
}

module.exports = AppDatabase;

const knex = require('knex');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'app.db');

const db = knex({
  client: 'sqlite3',
  connection: { filename: dbPath },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, done) => {
      conn.run('PRAGMA foreign_keys = ON', done);
    }
  }
});

module.exports = { db };

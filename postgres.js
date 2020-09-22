// POSTGRESQL
const { Client } = require('pg');

const pgClient = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    await pgClient.connect()
  } catch (err) {
    if (err && err.name == "error" && err.code == "28000") {
      console.log("Failed to connect to Postgresql\n")
      console.log(err.message)
      process.exit(1);
    }
    throw err;
  }

  console.log("Successfully connected to Postgresql Database")
})();

process.on('exit', () => {
  pgClient.end();
});

module.exports = pgClient

// docker run --rm -p 80:80 --env PGADMIN_DEFAULT_EMAIL=theodor.k.lauritzen@gmail.com --env PGADMIN_DEFAULT_PASSWORD=admin dpage/pgadmin4

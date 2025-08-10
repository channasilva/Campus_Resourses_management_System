const { Client } = require('pg');

const setupDatabase = async () => {
  // Connect to PostgreSQL without specifying a database (to create the database)
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'cwinner@15847',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = 'campus_resources_db'
    `;
    const dbExists = await client.query(checkDbQuery);

    if (dbExists.rows.length === 0) {
      // Create the database
      await client.query('CREATE DATABASE campus_resources_db');
      console.log('Database "campus_resources_db" created successfully!');
    } else {
      console.log('Database "campus_resources_db" already exists');
    }

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
  }
};

setupDatabase(); 
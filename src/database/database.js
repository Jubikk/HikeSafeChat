import * as SQLite from 'expo-sqlite';

// Open database with new API
const db = SQLite.openDatabaseSync('hikesafe.db');

// Initialize DB
export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT,
        lastName TEXT,
        contactName TEXT,
        contactPhone TEXT,
        bloodType TEXT,
        medicalCondition TEXT,
        experienceLevel TEXT
      );
    `);
    
    // Enable foreign keys
    db.execSync('PRAGMA foreign_keys = ON;');
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Insert user data
export const insertUserData = async (userData) => {
  const {
    firstName,
    lastName,
    contactName,
    contactPhone,
    bloodType,
    medicalCondition,
    experienceLevel,
  } = userData;

  try {
    const result = db.runSync(
      `INSERT INTO users 
        (firstName, lastName, contactName, contactPhone, bloodType, medicalCondition, experienceLevel)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, contactName, contactPhone, bloodType, medicalCondition, experienceLevel]
    );
    
    console.log('User data inserted successfully:', result.lastInsertRowId);
    return result;
  } catch (error) {
    console.error('Error inserting user data:', error);
    throw error;
  }
};

// Fetch all users
export const getAllUsers = () => {
  try {
    const users = db.getAllSync('SELECT * FROM users');
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Get user by ID
export const getUserById = (id) => {
  try {
    const user = db.getFirstSync('SELECT * FROM users WHERE id = ?', [id]);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};
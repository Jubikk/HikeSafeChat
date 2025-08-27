import * as SQLite from 'expo-sqlite';

// Open database with new API
const db = SQLite.openDatabaseSync('hikesafe.db');

// Initialize DB
export const initDB = () => {
  try {
    // First drop the table if it exists
    db.execSync('DROP TABLE IF EXISTS users;');
    
    // Then create the table with the correct schema
    db.execSync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT,
        lastName TEXT,
        contactName TEXT,
        contactPhone TEXT,
        bloodType TEXT,
        medicalCondition TEXT,
        experienceLevel TEXT,
        groupId TEXT,
        rememberMe BOOLEAN,
        username TEXT,
        nickName TEXT
      );
    `);
    
    // Enable foreign keys
    db.execSync('PRAGMA foreign_keys = ON;');
    
    console.log('Database recreated successfully with updated schema');
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
    groupId,
    rememberMe,
    username,
    nickName,
  } = userData;

  try {
    const result = db.runSync(
      `INSERT INTO users 
        (firstName, lastName, contactName, contactPhone, bloodType, medicalCondition, experienceLevel, groupId, rememberMe, username, nickName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, contactName, contactPhone, bloodType, medicalCondition, experienceLevel, groupId, rememberMe, username, nickName]
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
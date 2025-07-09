import * as SQLite from 'expo-sqlite';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

// Encryption key (replace with a secure key in production)
const ENCRYPTION_KEY = 'your-secret-key-123';

// Initialize the database based on the platform
let db;
if (Platform.OS !== 'web') {
  db = SQLite.openDatabase('passwordManager.db');
}

// LocalStorage fallback for web
const STORAGE_KEY = 'passwords';

// Helper to get passwords from localStorage on web
const getLocalStoragePasswords = () => {
  if (Platform.OS === 'web') {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
};

// Helper to save passwords to localStorage on web
const saveLocalStoragePasswords = (passwords) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
  }
};

// Initialize the database (mobile only)
const initDatabase = () => {
  if (Platform.OS !== 'web') {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, website TEXT, username TEXT, password TEXT, timestamp TEXT);',
        [],
        () => console.log('Table created successfully'),
        (_, error) => console.log('Error creating table:', error)
      );
    });
  }
};

// Encrypt password before storing
const encryptPassword = (password) => {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

// Decrypt password when retrieving
const decryptPassword = (encryptedPassword) => {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Add a new password to the database
const addPassword = (category, website, username, password, callback) => {
  const encryptedPassword = encryptPassword(password);
  const timestamp = new Date().toLocaleString();

  if (Platform.OS === 'web') {
    const passwords = getLocalStoragePasswords();
    const newId = passwords.length > 0 ? Math.max(...passwords.map(p => parseInt(p.id))) + 1 : 1;
    const newPassword = {
      id: newId.toString(),
      category,
      website,
      username,
      password: encryptedPassword,
      timestamp,
    };
    passwords.push(newPassword);
    saveLocalStoragePasswords(passwords);
    callback(newId);
  } else {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO passwords (category, website, username, password, timestamp) VALUES (?, ?, ?, ?, ?);',
        [category, website, username, encryptedPassword, timestamp],
        (_, { insertId }) => callback(insertId),
        (_, error) => console.log('Error adding password:', error)
      );
    });
  }
};

// Update an existing password in the database
const updatePassword = (id, category, website, username, password, callback) => {
  const encryptedPassword = encryptPassword(password);
  const timestamp = new Date().toLocaleString();
  if (Platform.OS === 'web') {
    const passwords = getLocalStoragePasswords();
    const index = passwords.findIndex(p => p.id === id);
    if (index !== -1) {
      passwords[index] = { id, category, website, username, password: encryptedPassword, timestamp };
      saveLocalStoragePasswords(passwords);
      callback();
    }
  } else {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE passwords SET category = ?, website = ?, username = ?, password = ?, timestamp = ? WHERE id = ?;',
        [category, website, username, encryptedPassword, timestamp, id],
        () => callback(),
        (_, error) => console.log('Error updating password:', error)
      );
    });
  }
};

// Retrieve passwords by category
const getPasswordsByCategory = (category, callback) => {
  if (Platform.OS === 'web') {
    const passwords = getLocalStoragePasswords();
    const filtered = passwords
      .filter(p => p.category === category)
      .map(item => ({
        id: item.id,
        website: item.website,
        username: item.username,
        password: decryptPassword(item.password),
        timestamp: item.timestamp,
      }));
    callback(filtered);
  } else {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM passwords WHERE category = ?;',
        [category],
        (_, { rows }) => {
          const passwords = rows._array.map(item => ({
            id: item.id.toString(),
            website: item.website,
            username: item.username,
            password: decryptPassword(item.password),
            timestamp: item.timestamp,
          }));
          callback(passwords);
        },
        (_, error) => console.log('Error retrieving passwords:', error)
      );
    });
  }
};

// Delete a password by ID
const deletePassword = (id, callback) => {
  if (Platform.OS === 'web') {
    const passwords = getLocalStoragePasswords();
    const updatedPasswords = passwords.filter(p => p.id !== id);
    saveLocalStoragePasswords(updatedPasswords);
    callback();
  } else {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM passwords WHERE id = ?;',
        [id],
        () => callback(),
        (_, error) => console.log('Error deleting password:', error)
      );
    });
  }
};

export { initDatabase, addPassword, updatePassword, getPasswordsByCategory, deletePassword };
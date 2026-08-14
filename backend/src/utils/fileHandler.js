const fs = require('fs');
const path = require('path');

// Read data from JSON file
const readData = (fileName) => {
  try {
    const filePath = path.join(__dirname, '../../data', `${fileName}.json`);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${fileName}.json:`, error);
    return [];
  }
};

// Write data to JSON file
const writeData = (fileName, data) => {
  try {
    const filePath = path.join(__dirname, '../../data', `${fileName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${fileName}.json:`, error);
    return false;
  }
};

// Get item by ID
const findById = (fileName, id) => {
  const data = readData(fileName);
  return data.find(item => item.id === id);
};

// Add new item
const addItem = (fileName, newItem) => {
  const data = readData(fileName);
  data.push(newItem);
  writeData(fileName, data);
  return newItem;
};

// Update item by ID
const updateItem = (fileName, id, updatedData) => {
  const data = readData(fileName);
  const index = data.findIndex(item => item.id === id);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updatedData };
  writeData(fileName, data);
  return data[index];
};

// Delete item by ID
const deleteItem = (fileName, id) => {
  const data = readData(fileName);
  const filtered = data.filter(item => item.id !== id);
  writeData(fileName, filtered);
  return true;
};

// Find user by email (searches both users and admins)
const findUserByEmail = (email) => {
  const users = readData('users');
  const admins = readData('admins');
  const allUsers = [...users, ...admins];
  return allUsers.find(user => user.email === email);
};

// Find user by ID (searches both users and admins)
const findUserById = (id) => {
  const users = readData('users');
  const admins = readData('admins');
  const allUsers = [...users, ...admins];
  return allUsers.find(user => user.id === id);
};

// Get all users (including admins)
const getAllUsers = () => {
  const users = readData('users');
  const admins = readData('admins');
  return [...users, ...admins];
};

module.exports = {
  readData,
  writeData,
  findById,
  addItem,
  updateItem,
  deleteItem,
  findUserByEmail,
  findUserById,
  getAllUsers
};
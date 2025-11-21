import { DB_ENDPOINT, ADD_PARTS_ENDPOINT } from '../utils/constants.js';

const fetchOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors',
};

export async function fetchDatabaseParts() {
  try {
    const response = await fetch(DB_ENDPOINT, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      throw new Error('CORS error: Unable to connect to database. Please check server configuration.');
    }
    throw error;
  }
}

export async function addPartsToDatabase(parts) {
  try {
    const response = await fetch(ADD_PARTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ parts })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      throw new Error('CORS error: Unable to add parts to database. Please check server configuration.');
    }
    throw error;
  }
}
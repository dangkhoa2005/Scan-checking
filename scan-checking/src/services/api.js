import { DB_ENDPOINT } from '../utils/constants.js';

export async function fetchDatabaseParts() {
  const response = await fetch(DB_ENDPOINT);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}
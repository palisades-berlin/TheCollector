import { saveTile, getTiles, deleteTiles } from '../db.js';

export async function savePendingTile(jobId, index, x, y, blob, crop = null, tileSize = null) {
  return saveTile(jobId, index, x, y, blob, crop, tileSize);
}

export async function getPendingTiles(jobId) {
  return getTiles(jobId);
}

export async function deletePendingTiles(jobId) {
  return deleteTiles(jobId);
}

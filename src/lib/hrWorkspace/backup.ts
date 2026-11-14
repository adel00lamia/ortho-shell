import type { WorkspaceModel } from './model';
import { parseModel } from './storage';

const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export function createBackup(model: WorkspaceModel, demo: boolean): string {
  return JSON.stringify({ format: 'qimatak-hr-backup', version: 1, demo, exportedAt: new Date().toISOString(), model }, null, 2);
}

export function readBackup(raw: string, demo: boolean): WorkspaceModel {
  if (new Blob([raw]).size > MAX_BACKUP_BYTES) throw new Error('Le fichier dépasse la limite de 5 Mo.');
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error('Ce fichier ne contient pas une sauvegarde JSON valide.'); }
  if (!data || typeof data !== 'object' || !('format' in data) || data.format !== 'qimatak-hr-backup' || !('version' in data) || data.version !== 1 || !('model' in data) || !('demo' in data) || data.demo !== demo) {
    throw new Error('Sauvegarde incompatible : les modèles réels et les démonstrations restent séparés.');
  }
  const model = parseModel(JSON.stringify(data.model));
  if (!model) throw new Error('Le modèle contenu dans ce fichier est invalide.');
  return model;
}
// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { TaeglicherCheckIn, TrackingEintraege, Gewohnheiten } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

export class LivingAppsService {
  // --- TAEGLICHER_CHECK_IN ---
  static async getTaeglicherCheckIn(): Promise<TaeglicherCheckIn[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getTaeglicherCheckInEntry(id: string): Promise<TaeglicherCheckIn | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createTaeglicherCheckInEntry(fields: TaeglicherCheckIn['fields']) {
    return callApi('POST', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records`, { fields });
  }
  static async updateTaeglicherCheckInEntry(id: string, fields: Partial<TaeglicherCheckIn['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records/${id}`, { fields });
  }
  static async deleteTaeglicherCheckInEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records/${id}`);
  }

  // --- TRACKING_EINTRAEGE ---
  static async getTrackingEintraege(): Promise<TrackingEintraege[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.TRACKING_EINTRAEGE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getTrackingEintraegeEntry(id: string): Promise<TrackingEintraege | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.TRACKING_EINTRAEGE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createTrackingEintraegeEntry(fields: TrackingEintraege['fields']) {
    return callApi('POST', `/apps/${APP_IDS.TRACKING_EINTRAEGE}/records`, { fields });
  }
  static async updateTrackingEintraegeEntry(id: string, fields: Partial<TrackingEintraege['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.TRACKING_EINTRAEGE}/records/${id}`, { fields });
  }
  static async deleteTrackingEintraegeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.TRACKING_EINTRAEGE}/records/${id}`);
  }

  // --- GEWOHNHEITEN ---
  static async getGewohnheiten(): Promise<Gewohnheiten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.GEWOHNHEITEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getGewohnheitenEntry(id: string): Promise<Gewohnheiten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.GEWOHNHEITEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createGewohnheitenEntry(fields: Gewohnheiten['fields']) {
    return callApi('POST', `/apps/${APP_IDS.GEWOHNHEITEN}/records`, { fields });
  }
  static async updateGewohnheitenEntry(id: string, fields: Partial<Gewohnheiten['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.GEWOHNHEITEN}/records/${id}`, { fields });
  }
  static async deleteGewohnheitenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.GEWOHNHEITEN}/records/${id}`);
  }

}
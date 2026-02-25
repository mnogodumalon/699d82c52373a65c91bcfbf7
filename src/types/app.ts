// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface TaeglicherCheckIn {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    checkin_datum?: string; // Format: YYYY-MM-DD oder ISO String
    erledigte_gewohnheiten?: string; // applookup -> URL zu 'Gewohnheiten' Record
    tagesnotizen?: string;
  };
}

export interface TrackingEintraege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gewohnheit?: string; // applookup -> URL zu 'Gewohnheiten' Record
    datum_uhrzeit?: string; // Format: YYYY-MM-DD oder ISO String
    status?: 'erledigt' | 'uebersprungen' | 'teilweise';
    bewertung?: number;
    notizen?: string;
  };
}

export interface Gewohnheiten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gewohnheit_name?: string;
    beschreibung?: string;
    kategorie?: 'gesundheit' | 'fitness' | 'ernaehrung' | 'produktivitaet' | 'persoenliche_entwicklung' | 'soziales' | 'finanzen' | 'kreativitaet' | 'sonstiges';
    ziel_haeufigkeit?: 'taeglich' | 'mehrmals_woche' | 'woechentlich' | 'mehrmals_monat' | 'monatlich';
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    aktiv?: boolean;
  };
}

export const APP_IDS = {
  TAEGLICHER_CHECK_IN: '699d82aeceb3f171fccf9d4c',
  TRACKING_EINTRAEGE: '699d82adf12ba85b5d3e8b45',
  GEWOHNHEITEN: '699d82a9f2a4cf5dbf7a58d8',
} as const;

// Helper Types for creating new records
export type CreateTaeglicherCheckIn = TaeglicherCheckIn['fields'];
export type CreateTrackingEintraege = TrackingEintraege['fields'];
export type CreateGewohnheiten = Gewohnheiten['fields'];
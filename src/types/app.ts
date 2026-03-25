// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

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
    status?: LookupValue;
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
    kategorie?: LookupValue;
    ziel_haeufigkeit?: LookupValue;
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    aktiv?: boolean;
  };
}

export const APP_IDS = {
  TAEGLICHER_CHECK_IN: '699d82aeceb3f171fccf9d4c',
  TRACKING_EINTRAEGE: '699d82adf12ba85b5d3e8b45',
  GEWOHNHEITEN: '699d82a9f2a4cf5dbf7a58d8',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'tracking_eintraege': {
    status: [{ key: "erledigt", label: "Erledigt" }, { key: "uebersprungen", label: "Übersprungen" }, { key: "teilweise", label: "Teilweise erledigt" }],
  },
  'gewohnheiten': {
    kategorie: [{ key: "gesundheit", label: "Gesundheit" }, { key: "fitness", label: "Fitness" }, { key: "ernaehrung", label: "Ernährung" }, { key: "produktivitaet", label: "Produktivität" }, { key: "persoenliche_entwicklung", label: "Persönliche Entwicklung" }, { key: "soziales", label: "Soziales" }, { key: "finanzen", label: "Finanzen" }, { key: "kreativitaet", label: "Kreativität" }, { key: "sonstiges", label: "Sonstiges" }],
    ziel_haeufigkeit: [{ key: "taeglich", label: "Täglich" }, { key: "mehrmals_woche", label: "Mehrmals pro Woche" }, { key: "woechentlich", label: "Wöchentlich" }, { key: "mehrmals_monat", label: "Mehrmals pro Monat" }, { key: "monatlich", label: "Monatlich" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'taeglicher_check_in': {
    'checkin_datum': 'date/date',
    'erledigte_gewohnheiten': 'applookup/select',
    'tagesnotizen': 'string/textarea',
  },
  'tracking_eintraege': {
    'gewohnheit': 'applookup/select',
    'datum_uhrzeit': 'date/datetimeminute',
    'status': 'lookup/radio',
    'bewertung': 'number',
    'notizen': 'string/textarea',
  },
  'gewohnheiten': {
    'gewohnheit_name': 'string/text',
    'beschreibung': 'string/textarea',
    'kategorie': 'lookup/select',
    'ziel_haeufigkeit': 'lookup/select',
    'startdatum': 'date/date',
    'aktiv': 'bool',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateTaeglicherCheckIn = StripLookup<TaeglicherCheckIn['fields']>;
export type CreateTrackingEintraege = StripLookup<TrackingEintraege['fields']>;
export type CreateGewohnheiten = StripLookup<Gewohnheiten['fields']>;
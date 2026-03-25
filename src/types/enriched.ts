import type { TaeglicherCheckIn, TrackingEintraege } from './app';

export type EnrichedTaeglicherCheckIn = TaeglicherCheckIn & {
  erledigte_gewohnheitenName: string;
};

export type EnrichedTrackingEintraege = TrackingEintraege & {
  gewohnheitName: string;
};

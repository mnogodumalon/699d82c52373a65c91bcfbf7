import type { EnrichedTaeglicherCheckIn, EnrichedTrackingEintraege } from '@/types/enriched';
import type { Gewohnheiten, TaeglicherCheckIn, TrackingEintraege } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: string | undefined, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface TaeglicherCheckInMaps {
  gewohnheitenMap: Map<string, Gewohnheiten>;
}

export function enrichTaeglicherCheckIn(
  taeglicherCheckIn: TaeglicherCheckIn[],
  maps: TaeglicherCheckInMaps
): EnrichedTaeglicherCheckIn[] {
  return taeglicherCheckIn.map(r => ({
    ...r,
    erledigte_gewohnheitenName: resolveDisplay(r.fields.erledigte_gewohnheiten, maps.gewohnheitenMap, 'gewohnheit_name'),
  }));
}

interface TrackingEintraegeMaps {
  gewohnheitenMap: Map<string, Gewohnheiten>;
}

export function enrichTrackingEintraege(
  trackingEintraege: TrackingEintraege[],
  maps: TrackingEintraegeMaps
): EnrichedTrackingEintraege[] {
  return trackingEintraege.map(r => ({
    ...r,
    gewohnheitName: resolveDisplay(r.fields.gewohnheit, maps.gewohnheitenMap, 'gewohnheit_name'),
  }));
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TaeglicherCheckIn, TrackingEintraege, Gewohnheiten } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [taeglicherCheckIn, setTaeglicherCheckIn] = useState<TaeglicherCheckIn[]>([]);
  const [trackingEintraege, setTrackingEintraege] = useState<TrackingEintraege[]>([]);
  const [gewohnheiten, setGewohnheiten] = useState<Gewohnheiten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [taeglicherCheckInData, trackingEintraegeData, gewohnheitenData] = await Promise.all([
        LivingAppsService.getTaeglicherCheckIn(),
        LivingAppsService.getTrackingEintraege(),
        LivingAppsService.getGewohnheiten(),
      ]);
      setTaeglicherCheckIn(taeglicherCheckInData);
      setTrackingEintraege(trackingEintraegeData);
      setGewohnheiten(gewohnheitenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const gewohnheitenMap = useMemo(() => {
    const m = new Map<string, Gewohnheiten>();
    gewohnheiten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [gewohnheiten]);

  return { taeglicherCheckIn, setTaeglicherCheckIn, trackingEintraege, setTrackingEintraege, gewohnheiten, setGewohnheiten, loading, error, fetchAll, gewohnheitenMap };
}
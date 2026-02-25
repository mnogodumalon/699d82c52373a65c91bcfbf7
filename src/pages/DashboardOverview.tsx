import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichTrackingEintraege } from '@/lib/enrich';
import type { Gewohnheiten, TrackingEintraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { lookupKey } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, CheckCircle2, Circle, SkipForward, Minus, Star, Trophy, Zap, Target, Flame, ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GewohnheitenDialog } from '@/components/dialogs/GewohnheitenDialog';
import { TrackingEintraegeDialog } from '@/components/dialogs/TrackingEintraegeDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, subDays, addDays, parseISO, isToday, startOfDay, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

const KATEGORIE_LABELS: Record<string, string> = {
  gesundheit: 'Gesundheit',
  fitness: 'Fitness',
  ernaehrung: 'Ernährung',
  produktivitaet: 'Produktivität',
  persoenliche_entwicklung: 'Pers. Entwicklung',
  soziales: 'Soziales',
  finanzen: 'Finanzen',
  kreativitaet: 'Kreativität',
  sonstiges: 'Sonstiges',
};

const KATEGORIE_COLORS: Record<string, string> = {
  gesundheit: 'bg-emerald-100 text-emerald-700',
  fitness: 'bg-orange-100 text-orange-700',
  ernaehrung: 'bg-lime-100 text-lime-700',
  produktivitaet: 'bg-violet-100 text-violet-700',
  persoenliche_entwicklung: 'bg-sky-100 text-sky-700',
  soziales: 'bg-pink-100 text-pink-700',
  finanzen: 'bg-yellow-100 text-yellow-700',
  kreativitaet: 'bg-fuchsia-100 text-fuchsia-700',
  sonstiges: 'bg-slate-100 text-slate-600',
};

const STATUS_ICONS = {
  erledigt: <CheckCircle2 size={18} className="text-emerald-500" />,
  uebersprungen: <SkipForward size={18} className="text-yellow-500" />,
  teilweise: <Minus size={18} className="text-blue-500" />,
};

export default function DashboardOverview() {
  const {
    taeglicherCheckIn, trackingEintraege, gewohnheiten,
    gewohnheitenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [gwDialog, setGwDialog] = useState(false);
  const [editGewohnheit, setEditGewohnheit] = useState<Gewohnheiten | null>(null);
  const [deleteGewohnheit, setDeleteGewohnheit] = useState<Gewohnheiten | null>(null);
  const [trackDialog, setTrackDialog] = useState(false);
  const [editTracking, setEditTracking] = useState<TrackingEintraege | null>(null);
  const [deleteTracking, setDeleteTracking] = useState<TrackingEintraege | null>(null);
  const [prefilledGewohnheit, setPrefilledGewohnheit] = useState<string | null>(null);
  const [quickLogging, setQuickLogging] = useState<string | null>(null);

  // Build a map: dateStr -> gewohnheitId -> tracking entries
  const trackingByDateAndHabit = useMemo(() => {
    const map = new Map<string, Map<string, TrackingEintraege[]>>();
    trackingEintraege.forEach(entry => {
      const dt = entry.fields.datum_uhrzeit;
      if (!dt) return;
      const dateStr = dt.substring(0, 10);
      const gwId = extractRecordId(entry.fields.gewohnheit);
      if (!gwId) return;
      if (!map.has(dateStr)) map.set(dateStr, new Map());
      const byHabit = map.get(dateStr)!;
      if (!byHabit.has(gwId)) byHabit.set(gwId, []);
      byHabit.get(gwId)!.push(entry);
    });
    return map;
  }, [trackingEintraege]);

  const activeHabits = useMemo(
    () => gewohnheiten.filter(g => g.fields.aktiv !== false),
    [gewohnheiten]
  );

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const todayTracking = useMemo(
    () => trackingByDateAndHabit.get(selectedDateStr) ?? new Map<string, TrackingEintraege[]>(),
    [trackingByDateAndHabit, selectedDateStr]
  );

  // Streak for each habit (consecutive days with 'erledigt' tracking)
  const habitStreaks = useMemo(() => {
    const streaks: Record<string, number> = {};
    activeHabits.forEach(habit => {
      let streak = 0;
      let checkDate = startOfDay(new Date());
      while (true) {
        const ds = format(checkDate, 'yyyy-MM-dd');
        const entries = trackingByDateAndHabit.get(ds)?.get(habit.record_id) ?? [];
        const done = entries.some(e => lookupKey(e.fields.status) === 'erledigt');
        if (!done) break;
        streak++;
        checkDate = subDays(checkDate, 1);
      }
      streaks[habit.record_id] = streak;
    });
    return streaks;
  }, [activeHabits, trackingByDateAndHabit]);

  // Last 7 days for grid
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  }, []);

  // Stats
  const totalDone = useMemo(() => {
    return trackingEintraege.filter(e => lookupKey(e.fields.status) === 'erledigt').length;
  }, [trackingEintraege]);

  const todayDone = useMemo(() => {
    let count = 0;
    todayTracking.forEach(entries => {
      if (entries.some(e => lookupKey(e.fields.status) === 'erledigt')) count++;
    });
    return count;
  }, [todayTracking]);

  const maxStreak = useMemo(() => Math.max(0, ...Object.values(habitStreaks)), [habitStreaks]);

  const avgRating = useMemo(() => {
    const rated = trackingEintraege.filter(e => e.fields.bewertung != null);
    if (!rated.length) return 0;
    return Math.round((rated.reduce((s, e) => s + (e.fields.bewertung ?? 0), 0) / rated.length) * 10) / 10;
  }, [trackingEintraege]);

  const handleQuickLog = useCallback(async (habit: Gewohnheiten, status: 'erledigt' | 'uebersprungen' | 'teilweise') => {
    setQuickLogging(habit.record_id);
    try {
      const existing = todayTracking.get(habit.record_id) ?? [];
      const now = format(selectedDate, "yyyy-MM-dd'T'HH:mm");
      if (existing.length > 0) {
        await LivingAppsService.updateTrackingEintraegeEntry(existing[0].record_id, { status });
      } else {
        await LivingAppsService.createTrackingEintraegeEntry({
          gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN, habit.record_id),
          datum_uhrzeit: now,
          status,
        });
      }
      fetchAll();
    } finally {
      setQuickLogging(null);
    }
  }, [todayTracking, selectedDate, fetchAll]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const isSelectedToday = isToday(selectedDate);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gewohnheitstracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeHabits.length} aktive Gewohnheit{activeHabits.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <Button onClick={() => { setEditGewohnheit(null); setGwDialog(true); }} className="gap-2 self-start sm:self-auto">
          <Plus size={16} /> Neue Gewohnheit
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Heute erledigt"
          value={`${todayDone}/${activeHabits.length}`}
          description={isSelectedToday ? 'von heute' : format(selectedDate, 'dd.MM.', { locale: de })}
          icon={<CheckCircle2 size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Gesamt Einträge"
          value={String(totalDone)}
          description="Erledigte Einträge"
          icon={<Trophy size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Längste Streak"
          value={`${maxStreak} Tage`}
          description="Beste aktive Gewohnheit"
          icon={<Flame size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Ø Bewertung"
          value={avgRating > 0 ? `${avgRating}/5` : '—'}
          description="Aller Einträge"
          icon={<Star size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => subDays(d, 1))} className="h-8 w-8 p-0">
          <ChevronLeft size={16} />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-foreground text-sm">
            {isSelectedToday ? 'Heute' : format(selectedDate, 'EEEE', { locale: de })}
          </p>
          <p className="text-xs text-muted-foreground">{format(selectedDate, 'dd. MMMM yyyy', { locale: de })}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          disabled={isSelectedToday}
          className="h-8 w-8 p-0"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Main Grid: Habit Checklist + Weekly View */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Habit Checklist - Hero */}
        <div className="xl:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">
              {isSelectedToday ? 'Heutige Gewohnheiten' : `Gewohnheiten am ${format(selectedDate, 'dd.MM.', { locale: de })}`}
            </h2>
            <span className="text-xs text-muted-foreground">{todayDone}/{activeHabits.length} erledigt</span>
          </div>

          {activeHabits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Target size={22} className="text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">Noch keine Gewohnheiten</p>
              <p className="text-sm text-muted-foreground mb-4">Erstelle deine erste Gewohnheit, um zu beginnen.</p>
              <Button size="sm" onClick={() => { setEditGewohnheit(null); setGwDialog(true); }} className="gap-2">
                <Plus size={14} /> Gewohnheit hinzufügen
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeHabits.map(habit => {
                const entries = todayTracking.get(habit.record_id) ?? [];
                const status = entries.length > 0 ? lookupKey(entries[0].fields.status) : null;
                const streak = habitStreaks[habit.record_id] ?? 0;
                const kat = lookupKey(habit.fields.kategorie) ?? 'sonstiges';
                const isLogging = quickLogging === habit.record_id;

                return (
                  <div
                    key={habit.record_id}
                    className={`px-5 py-4 flex items-center gap-4 transition-colors ${
                      status === 'erledigt' ? 'bg-emerald-50/50' : 'hover:bg-accent/30'
                    }`}
                  >
                    {/* Status icon */}
                    <div className="shrink-0">
                      {status === 'erledigt' ? (
                        <CheckCircle2 size={24} className="text-emerald-500" />
                      ) : status === 'uebersprungen' ? (
                        <SkipForward size={24} className="text-yellow-500" />
                      ) : status === 'teilweise' ? (
                        <Minus size={24} className="text-blue-500" />
                      ) : (
                        <Circle size={24} className="text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Habit info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm ${status === 'erledigt' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {habit.fields.gewohnheit_name ?? 'Unbenannte Gewohnheit'}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${KATEGORIE_COLORS[kat] ?? KATEGORIE_COLORS.sonstiges}`}>
                          {KATEGORIE_LABELS[kat] ?? kat}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {streak > 0 && (
                          <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                            <Flame size={11} /> {streak}d
                          </span>
                        )}
                        {entries.length > 0 && entries[0].fields.bewertung != null && (
                          <span className="flex items-center gap-1 text-xs text-yellow-500">
                            <Star size={11} /> {entries[0].fields.bewertung}
                          </span>
                        )}
                        {entries.length > 0 && entries[0].fields.notizen && (
                          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {entries[0].fields.notizen}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {status !== 'erledigt' && (
                        <button
                          onClick={() => handleQuickLog(habit, 'erledigt')}
                          disabled={isLogging}
                          title="Als erledigt markieren"
                          className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors text-emerald-600 disabled:opacity-40"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {status !== 'uebersprungen' && (
                        <button
                          onClick={() => handleQuickLog(habit, 'uebersprungen')}
                          disabled={isLogging}
                          title="Überspringen"
                          className="p-1.5 rounded-lg hover:bg-yellow-100 transition-colors text-yellow-600 disabled:opacity-40"
                        >
                          <SkipForward size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setPrefilledGewohnheit(habit.record_id);
                          setEditTracking(entries[0] ?? null);
                          setTrackDialog(true);
                        }}
                        title="Detailliert erfassen"
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                      >
                        <Zap size={16} />
                      </button>
                      <button
                        onClick={() => { setEditGewohnheit(habit); setGwDialog(true); }}
                        title="Gewohnheit bearbeiten"
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteGewohnheit(habit)}
                        title="Gewohnheit löschen"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Habit Grid */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">7-Tage-Übersicht</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Letzte 7 Tage</p>
          </div>

          {activeHabits.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Keine aktiven Gewohnheiten
            </div>
          ) : (
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-muted-foreground font-medium pb-2 pr-2 max-w-[100px]">Gewohnheit</th>
                    {last7Days.map(d => (
                      <th key={d.toISOString()} className={`text-center pb-2 px-1 font-medium w-8 ${isSameDay(d, selectedDate) ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(d, 'EE', { locale: de }).slice(0, 2)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeHabits.map(habit => (
                    <tr key={habit.record_id} className="border-t border-border/40">
                      <td className="py-2 pr-2 text-foreground font-medium truncate max-w-[90px]" title={habit.fields.gewohnheit_name}>
                        {(habit.fields.gewohnheit_name ?? '?').slice(0, 12)}{(habit.fields.gewohnheit_name?.length ?? 0) > 12 ? '…' : ''}
                      </td>
                      {last7Days.map(d => {
                        const ds = format(d, 'yyyy-MM-dd');
                        const entries = trackingByDateAndHabit.get(ds)?.get(habit.record_id) ?? [];
                        const st = entries.length > 0 ? lookupKey(entries[0].fields.status) : null;
                        return (
                          <td key={d.toISOString()} className="text-center py-2 px-1">
                            {st === 'erledigt' ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white">
                                <CheckCircle2 size={12} />
                              </span>
                            ) : st === 'uebersprungen' ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100">
                                <SkipForward size={10} className="text-yellow-600" />
                              </span>
                            ) : st === 'teilweise' ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
                                <Minus size={10} className="text-blue-600" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted/50 text-muted-foreground/30">
                                <Circle size={10} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="px-4 pb-4 flex gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Erledigt
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-yellow-200 inline-block" /> Übersprungen
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-blue-200 inline-block" /> Teilweise
            </span>
          </div>
        </div>
      </div>

      {/* Recent Tracking Entries */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Letzte Einträge</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{trackingEintraege.length} Einträge gesamt</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setEditTracking(null); setPrefilledGewohnheit(null); setTrackDialog(true); }}
            className="gap-2"
          >
            <Plus size={14} /> Eintrag hinzufügen
          </Button>
        </div>

        {trackingEintraege.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <p className="text-sm text-muted-foreground">Noch keine Tracking-Einträge.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {enrichTrackingEintraege(
              [...trackingEintraege]
                .sort((a, b) => (b.fields.datum_uhrzeit ?? '').localeCompare(a.fields.datum_uhrzeit ?? ''))
                .slice(0, 8),
              { gewohnheitenMap }
            ).map(entry => {
              const st = lookupKey(entry.fields.status);
              return (
                <div key={entry.record_id} className="px-5 py-3 flex items-center gap-4 hover:bg-accent/20 transition-colors">
                  <div className="shrink-0">
                    {st ? STATUS_ICONS[st as keyof typeof STATUS_ICONS] : <Circle size={18} className="text-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">
                        {entry.gewohnheitName || '—'}
                      </span>
                      {st && (
                        <Badge variant="outline" className={`text-xs py-0 ${
                          st === 'erledigt' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                          st === 'uebersprungen' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                          'border-blue-200 text-blue-700 bg-blue-50'
                        }`}>
                          {st === 'erledigt' ? 'Erledigt' : st === 'uebersprungen' ? 'Übersprungen' : 'Teilweise'}
                        </Badge>
                      )}
                      {entry.fields.bewertung != null && (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                          <Star size={11} /> {entry.fields.bewertung}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {entry.fields.datum_uhrzeit
                          ? format(parseISO(entry.fields.datum_uhrzeit), 'dd.MM.yyyy, HH:mm', { locale: de })
                          : '—'}
                      </span>
                      {entry.fields.notizen && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{entry.fields.notizen}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditTracking(entry); setPrefilledGewohnheit(null); setTrackDialog(true); }}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTracking(entry)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <GewohnheitenDialog
        open={gwDialog}
        onClose={() => { setGwDialog(false); setEditGewohnheit(null); }}
        onSubmit={async (fields) => {
          if (editGewohnheit) {
            await LivingAppsService.updateGewohnheitenEntry(editGewohnheit.record_id, fields);
          } else {
            await LivingAppsService.createGewohnheitenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editGewohnheit?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Gewohnheiten']}
      />

      <TrackingEintraegeDialog
        open={trackDialog}
        onClose={() => { setTrackDialog(false); setEditTracking(null); setPrefilledGewohnheit(null); }}
        onSubmit={async (fields) => {
          if (editTracking) {
            await LivingAppsService.updateTrackingEintraegeEntry(editTracking.record_id, fields);
          } else {
            await LivingAppsService.createTrackingEintraegeEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={
          editTracking
            ? editTracking.fields
            : prefilledGewohnheit
            ? { gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN, prefilledGewohnheit) }
            : undefined
        }
        gewohnheitenList={gewohnheiten}
        enablePhotoScan={AI_PHOTO_SCAN['TrackingEintraege']}
      />

      <ConfirmDialog
        open={!!deleteGewohnheit}
        title="Gewohnheit löschen"
        description={`„${deleteGewohnheit?.fields.gewohnheit_name}" wirklich löschen? Alle Tracking-Einträge bleiben erhalten.`}
        onConfirm={async () => {
          if (!deleteGewohnheit) return;
          await LivingAppsService.deleteGewohnheitenEntry(deleteGewohnheit.record_id);
          setDeleteGewohnheit(null);
          fetchAll();
        }}
        onClose={() => setDeleteGewohnheit(null)}
      />

      <ConfirmDialog
        open={!!deleteTracking}
        title="Eintrag löschen"
        description="Diesen Tracking-Eintrag wirklich löschen?"
        onConfirm={async () => {
          if (!deleteTracking) return;
          await LivingAppsService.deleteTrackingEintraegeEntry(deleteTracking.record_id);
          setDeleteTracking(null);
          fetchAll();
        }}
        onClose={() => setDeleteTracking(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}

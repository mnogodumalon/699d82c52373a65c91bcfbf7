import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { TaeglicherCheckIn, Gewohnheiten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { TaeglicherCheckInDialog } from '@/components/dialogs/TaeglicherCheckInDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function TaeglicherCheckInPage() {
  const [records, setRecords] = useState<TaeglicherCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaeglicherCheckIn | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaeglicherCheckIn | null>(null);
  const [gewohnheitenList, setGewohnheitenList] = useState<Gewohnheiten[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, gewohnheitenData] = await Promise.all([
        LivingAppsService.getTaeglicherCheckIn(),
        LivingAppsService.getGewohnheiten(),
      ]);
      setRecords(mainData);
      setGewohnheitenList(gewohnheitenData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: TaeglicherCheckIn['fields']) {
    await LivingAppsService.createTaeglicherCheckInEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: TaeglicherCheckIn['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateTaeglicherCheckInEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteTaeglicherCheckInEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getGewohnheitenDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return gewohnheitenList.find(r => r.record_id === id)?.fields.gewohnheit_name ?? '—';
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Täglicher Check-in"
      subtitle={`${records.length} Täglicher Check-in im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Täglicher Check-in suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Erledigte Gewohnheiten</TableHead>
              <TableHead>Tagesnotizen</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground">{formatDate(record.fields.checkin_datum)}</TableCell>
                <TableCell>{getGewohnheitenDisplayName(record.fields.erledigte_gewohnheiten)}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.tagesnotizen ?? '—'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Täglicher Check-in. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaeglicherCheckInDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        gewohnheitenList={gewohnheitenList}
        enablePhotoScan={AI_PHOTO_SCAN['TaeglicherCheckIn']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Täglicher Check-in löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}
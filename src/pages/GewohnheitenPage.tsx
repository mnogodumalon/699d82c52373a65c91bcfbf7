import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Gewohnheiten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { GewohnheitenDialog } from '@/components/dialogs/GewohnheitenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { displayLookup } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function GewohnheitenPage() {
  const [records, setRecords] = useState<Gewohnheiten[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Gewohnheiten | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gewohnheiten | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      setRecords(await LivingAppsService.getGewohnheiten());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Gewohnheiten['fields']) {
    await LivingAppsService.createGewohnheitenEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Gewohnheiten['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateGewohnheitenEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteGewohnheitenEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
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
      title="Gewohnheiten"
      subtitle={`${records.length} Gewohnheiten im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Gewohnheiten suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name der Gewohnheit</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Ziel-Häufigkeit</TableHead>
              <TableHead>Startdatum</TableHead>
              <TableHead>Gewohnheit ist aktiv</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.gewohnheit_name ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.beschreibung ?? '—'}</span></TableCell>
                <TableCell><Badge variant="secondary">{displayLookup(record.fields.kategorie)}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{displayLookup(record.fields.ziel_haeufigkeit)}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.startdatum)}</TableCell>
                <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.fields.aktiv ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{record.fields.aktiv ? 'Ja' : 'Nein'}</span></TableCell>
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
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Gewohnheiten. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <GewohnheitenDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Gewohnheiten']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Gewohnheiten löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}
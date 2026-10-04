import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit3,
  Eye,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, getTodayIso } from '../../utils/format';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { EmptyState } from '../../components/ui/StateFeedback';
import { JournalEntry } from '../../types';

export function JournalPage() {
  const navigate = useNavigate();
  const journalEntries = useFamilyStore((s) => s.journalEntries);
  const members = useFamilyStore((s) => s.members);
  const profile = useFamilyStore((s) => s.profile);
  const syncStatus = useFamilyStore((s) => s.syncStatus || s.txSyncStatus);

  const addJournalEntry = useFamilyStore((s) => s.addJournalEntry);
  const updateJournalEntry = useFamilyStore((s) => s.updateJournalEntry);
  const deleteJournalEntry = useFamilyStore((s) => s.deleteJournalEntry);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(getTodayIso());
  const [photoUrl, setPhotoUrl] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return journalEntries;
    return journalEntries.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.content.toLowerCase().includes(q) ||
        j.author_name.toLowerCase().includes(q)
    );
  }, [journalEntries, searchQuery]);

  const openCreate = () => {
    setEditingEntry(null);
    setTitle('');
    setContent('');
    setDate(getTodayIso());
    setPhotoUrl('');
    setAuthorName(profile?.full_name || members[0]?.name || 'Keluarga');
    setIsSavingJournal(false);
    setIsFormOpen(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setDate(entry.date);
    setPhotoUrl(entry.photo_url || '');
    setAuthorName(entry.author_name);
    setIsSavingJournal(false);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      setIsSavingJournal(true);
      if (editingEntry) {
        await updateJournalEntry(editingEntry.id, {
          title: title.trim(),
          content: content.trim(),
          date,
          photo_url: photoUrl.trim() || undefined,
          author_name: authorName || 'Keluarga',
        });
      } else {
        await addJournalEntry({
          title: title.trim(),
          content: content.trim(),
          date,
          photo_url: photoUrl.trim() || undefined,
          author_id: profile?.id || '',
          author_name: authorName || profile?.full_name || 'Keluarga',
        });
      }
      setIsSavingJournal(false);
      setIsFormOpen(false);
    } catch {
      setIsSavingJournal(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-lg font-bold text-[#1E2D24]">Jurnal Keluarga</h1>
              <p className="text-xs text-[#5C6B62]">
                Simpan cerita harian, syukur, dan dokumentasi tumbuh kembang keluarga
              </p>
            </div>
            {syncStatus === 'saving' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-xs font-semibold border border-[#2A4D3E]/20 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Jurnal</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari judul, isi cerita, atau penulis jurnal..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24] focus:outline-none focus:border-[#2A4D3E]"
        />
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada catatan jurnal keluarga"
          description="Mulai tulis cerita berkesan hari ini untuk dikenang di masa depan."
          actionLabel="Tulis Jurnal Pertama"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#5C6B62]">
                  <span>
                    {formatDateId(entry.date)} · Oleh{' '}
                    <strong className="text-[#2A4D3E]">{entry.author_name}</strong>
                  </span>
                </div>

                <h2
                  onClick={() => setViewingEntry(entry)}
                  className="text-base font-bold text-[#1E2D24] hover:text-[#2A4D3E] cursor-pointer"
                >
                  {entry.title}
                </h2>

                <p className="text-xs text-[#5C6B62] line-clamp-3 leading-relaxed whitespace-pre-line">
                  {entry.content}
                </p>

                {entry.photo_url && (
                  <img
                    src={entry.photo_url}
                    alt={entry.title}
                    referrerPolicy="no-referrer"
                    onClick={() => setViewingEntry(entry)}
                    className="w-full h-44 object-cover rounded-2xl border border-[#E8E2D5] cursor-pointer"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setViewingEntry(entry)}
                  className="text-xs font-semibold text-[#2A4D3E] hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Baca Selengkapnya</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(entry)}
                    aria-label="Edit jurnal"
                    className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(entry.id)}
                    aria-label="Hapus jurnal"
                    className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL: VIEW DETAIL */}
      <ResponsiveModal
        isOpen={Boolean(viewingEntry)}
        onClose={() => setViewingEntry(null)}
        title={viewingEntry?.title || 'Detail Jurnal'}
        subtitle={
          viewingEntry
            ? `${formatDateId(viewingEntry.date)} · Ditulis oleh ${viewingEntry.author_name}`
            : ''
        }
      >
        {viewingEntry && (
          <div className="space-y-4">
            {viewingEntry.photo_url && (
              <img
                src={viewingEntry.photo_url}
                alt={viewingEntry.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-72 object-cover rounded-2xl border border-[#E8E2D5]"
              />
            )}
            <p className="text-sm text-[#1E2D24] leading-relaxed whitespace-pre-line">
              {viewingEntry.content}
            </p>
          </div>
        )}
      </ResponsiveModal>

      {/* MODAL: ADD / EDIT JOURNAL */}
      <ResponsiveModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEntry ? 'Edit Jurnal Keluarga' : 'Tulis Jurnal Keluarga'}
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Jurnal</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Akhir Pekan Berkebun di Halaman Belakang"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={date} onChange={setDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Penulis</label>
              <select
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Isi Cerita</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan cerita lengkap..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              URL Foto Dokumentasi (Opsional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingJournal}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {isSavingJournal ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Jurnal</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteJournalEntry(deletingId);
        }}
        title="Hapus Jurnal Keluarga?"
        description="Catatan jurnal ini akan dihapus secara permanen."
      />
    </div>
  );
}

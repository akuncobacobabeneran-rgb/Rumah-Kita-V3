import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  FolderKanban,
  HeartPulse,
  Home,
  IdCard,
  Image as ImageIcon,
  Link2,
  Loader2,
  PhoneCall,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { DocumentCategory, FamilyDocument } from '../../types';
import { formatDateId } from '../../utils/format';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { EmptyState } from '../../components/ui/StateFeedback';

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Identitas & Kependudukan',
  'Dokumen Kendaraan',
  'Rumah & Properti',
  'Kesehatan & Asuransi',
  'Tagihan & Kontak Darurat',
];

const QUICK_DOCUMENT_TEMPLATES: Array<{
  label: string;
  title: string;
  category: DocumentCategory;
  owner: string;
  placeholderNumber: string;
}> = [
  {
    label: 'KTP Suami',
    title: 'KTP Suami',
    category: 'Identitas & Kependudukan',
    owner: 'Suami',
    placeholderNumber: 'NIK 16 Digit',
  },
  {
    label: 'KTP Istri',
    title: 'KTP Istri',
    category: 'Identitas & Kependudukan',
    owner: 'Istri',
    placeholderNumber: 'NIK 16 Digit',
  },
  {
    label: 'Kartu Keluarga (KK)',
    title: 'Kartu Keluarga (KK)',
    category: 'Identitas & Kependudukan',
    owner: 'Bersama',
    placeholderNumber: 'Nomor KK 16 Digit',
  },
  {
    label: 'Buku Nikah',
    title: 'Buku / Akta Nikah',
    category: 'Identitas & Kependudukan',
    owner: 'Bersama',
    placeholderNumber: 'Nomor Akta Nikah',
  },
  {
    label: 'STNK Kendaraan',
    title: 'STNK Mobil / Motor',
    category: 'Dokumen Kendaraan',
    owner: 'Bersama',
    placeholderNumber: 'Plat Nomor (Mis: B 1234 XYZ)',
  },
  {
    label: 'BPKB Kendaraan',
    title: 'BPKB Kendaraan',
    category: 'Dokumen Kendaraan',
    owner: 'Bersama',
    placeholderNumber: 'Nomor BPKB / Rangka',
  },
  {
    label: 'SIM A / C',
    title: 'SIM Mengemudi',
    category: 'Dokumen Kendaraan',
    owner: 'Suami',
    placeholderNumber: 'Nomor SIM',
  },
  {
    label: 'Sertifikat Rumah / SHM',
    title: 'Sertifikat Rumah (SHM/HGB)',
    category: 'Rumah & Properti',
    owner: 'Bersama',
    placeholderNumber: 'Nomor Sertifikat / NOP PBB',
  },
  {
    label: 'BPJS / Asuransi',
    title: 'Kartu BPJS Kesehatan / Polis Asuransi',
    category: 'Kesehatan & Asuransi',
    owner: 'Bersama',
    placeholderNumber: 'Nomor Kepesertaan / Polis',
  },
  {
    label: 'ID PLN / PDAM / WiFi',
    title: 'Nomor Pelanggan Listrik PLN / Internet',
    category: 'Tagihan & Kontak Darurat',
    owner: 'Bersama',
    placeholderNumber: 'ID Pelanggan / Nomor Meter',
  },
];

function compressImageFileToDataUrl(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function readRawFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function extractGoogleDriveEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    return `https://drive.google.com/file/d/${matchFile[1]}/preview`;
  }
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) {
    return `https://drive.google.com/file/d/${matchIdParam[1]}/preview`;
  }
  return null;
}

export function DocumentVaultPage() {
  const family = useFamilyStore((s) => s.family);
  const familyDocuments = useFamilyStore((s) => s.familyDocuments);
  const syncStatus = useFamilyStore((s) => s.syncStatus || s.txSyncStatus);
  const addFamilyDocument = useFamilyStore((s) => s.addFamilyDocument);
  const updateFamilyDocument = useFamilyStore((s) => s.updateFamilyDocument);
  const deleteFamilyDocument = useFamilyStore((s) => s.deleteFamilyDocument);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'Semua' | DocumentCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FamilyDocument | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Identitas & Kependudukan');
  const [ownerName, setOwnerName] = useState('Bersama');
  const [documentNumber, setDocumentNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [attachmentTab, setAttachmentTab] = useState<'upload' | 'gdrive'>('upload');
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileMimeType, setFileMimeType] = useState('');
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSavingDoc, setIsSavingDoc] = useState(false);

  // Preview & Delete State
  const [previewDoc, setPreviewDoc] = useState<FamilyDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const partner1Name = family?.partner_1_name || 'Suami';
  const partner2Name = family?.partner_2_name || 'Istri';

  const ownerOptions = useMemo(() => {
    const base = ['Bersama', partner1Name, partner2Name, 'Anak', 'Keluarga'];
    return Array.from(new Set(base));
  }, [partner1Name, partner2Name]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return familyDocuments.filter((doc) => {
      const catMatch = selectedCategory === 'Semua' || doc.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.owner_name.toLowerCase().includes(q) ||
        (doc.document_number && doc.document_number.toLowerCase().includes(q)) ||
        doc.notes.toLowerCase().includes(q)
      );
    });
  }, [familyDocuments, selectedCategory, searchQuery]);

  const expiringSoonDocs = useMemo(() => {
    const today = new Date();
    return familyDocuments.filter((doc) => {
      if (!doc.expiry_date) return false;
      try {
        const diff = differenceInDays(parseISO(doc.expiry_date), today);
        return diff <= 60;
      } catch {
        return false;
      }
    });
  }, [familyDocuments]);

  const openCreateModal = (preset?: (typeof QUICK_DOCUMENT_TEMPLATES)[number]) => {
    setEditingDoc(null);
    setTitle(preset?.title || '');
    setCategory(preset?.category || 'Identitas & Kependudukan');
    setOwnerName(
      preset?.owner === 'Suami'
        ? partner1Name
        : preset?.owner === 'Istri'
        ? partner2Name
        : preset?.owner || 'Bersama'
    );
    setDocumentNumber('');
    setExpiryDate('');
    setAttachmentTab('upload');
    setFileDataUrl('');
    setFileName('');
    setFileMimeType('');
    setGdriveUrl('');
    setNotes('');
    setUploadStatusMsg('');
    setFormError('');
    setIsSavingDoc(false);
    setIsModalOpen(true);
  };

  const openEditModal = (doc: FamilyDocument) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setCategory(doc.category);
    setOwnerName(doc.owner_name || 'Bersama');
    setDocumentNumber(doc.document_number || '');
    setExpiryDate(doc.expiry_date || '');
    setFileDataUrl(doc.file_data_url || '');
    setFileName(doc.file_name || '');
    setFileMimeType(doc.file_mime_type || '');
    setGdriveUrl(doc.gdrive_url || '');
    setAttachmentTab(doc.file_data_url ? 'upload' : doc.gdrive_url ? 'gdrive' : 'upload');
    setNotes(doc.notes || '');
    setUploadStatusMsg('');
    setFormError('');
    setIsSavingDoc(false);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    setUploadStatusMsg('');

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setFormError('Pilih berkas gambar (JPG, PNG, WEBP) atau dokumen PDF.');
      return;
    }

    if (isPdf && file.size > 4.5 * 1024 * 1024) {
      setFormError(
        'Ukuran PDF maksimal 4.5 MB untuk upload langsung. Untuk file lebih besar, silakan gunakan tab Link Google Drive.'
      );
      return;
    }

    try {
      setIsProcessingFile(true);
      if (isImage) {
        const compressed = await compressImageFileToDataUrl(file);
        setFileDataUrl(compressed);
        setFileName(file.name);
        setFileMimeType('image/jpeg');
        setUploadStatusMsg(`Foto "${file.name}" berhasil dioptimalkan dan siap disimpan.`);
      } else {
        const dataUrl = await readRawFileToDataUrl(file);
        setFileDataUrl(dataUrl);
        setFileName(file.name);
        setFileMimeType('application/pdf');
        setUploadStatusMsg(`Dokumen PDF "${file.name}" siap disimpan.`);
      }
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setFormError(err?.message || 'Gagal memproses berkas.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Nama dokumen wajib diisi.');
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      owner_name: ownerName.trim() || 'Bersama',
      document_number: documentNumber.trim() || undefined,
      expiry_date: expiryDate || undefined,
      file_data_url: fileDataUrl || undefined,
      file_name: fileName || undefined,
      file_mime_type: fileMimeType || undefined,
      gdrive_url: gdriveUrl.trim() || undefined,
      notes: notes.trim(),
    };

    try {
      setIsSavingDoc(true);
      if (editingDoc) {
        await updateFamilyDocument(editingDoc.id, payload);
      } else {
        await addFamilyDocument(payload);
      }
      setIsSavingDoc(false);
      setIsModalOpen(false);
    } catch {
      setIsSavingDoc(false);
    }
  };

  const handleCopyNumber = async (id: string, text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const getCategoryIcon = (cat: DocumentCategory) => {
    switch (cat) {
      case 'Identitas & Kependudukan':
        return <IdCard className="w-5 h-5 text-[#2A4D3E]" />;
      case 'Dokumen Kendaraan':
        return <Car className="w-5 h-5 text-[#457B9D]" />;
      case 'Rumah & Properti':
        return <Home className="w-5 h-5 text-[#D4A359]" />;
      case 'Kesehatan & Asuransi':
        return <HeartPulse className="w-5 h-5 text-[#B55B73]" />;
      case 'Tagihan & Kontak Darurat':
        return <PhoneCall className="w-5 h-5 text-[#6B9080]" />;
    }
  };

  const getExpiryBadge = (expiryDateStr?: string) => {
    if (!expiryDateStr) return null;
    try {
      const days = differenceInDays(parseISO(expiryDateStr), new Date());
      if (days < 0) {
        return {
          text: `Lewat masa berlaku (${formatDateId(expiryDateStr)})`,
          colorClass: 'text-[#C84B31]',
          urgent: true,
        };
      }
      if (days <= 60) {
        return {
          text: `Berlaku s/d ${formatDateId(expiryDateStr)} (${days} hari lagi)`,
          colorClass: 'text-[#B36B00]',
          urgent: true,
        };
      }
      return {
        text: `Berlaku s/d ${formatDateId(expiryDateStr)}`,
        colorClass: 'text-[#5C6B62]',
        urgent: false,
      };
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-[#2A4D3E] via-[#234235] to-[#193026] text-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F4D393]">
              <ShieldCheck className="w-4 h-4" />
              <span>Arsip & Brankas Keluarga</span>
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                Brankas Dokumen & Info Penting
              </h1>
              {syncStatus === 'saving' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[#FAF7F2] text-xs font-semibold backdrop-blur-md border border-white/20 animate-pulse mt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              Simpan KTP, Kartu Keluarga, Buku Nikah, STNK/BPKB kendaraan, sertifikat rumah, hingga
              ID pelanggan. Bisa diupload langsung (Foto/PDF) atau dihubungkan ke link Google Drive.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4A359] hover:bg-[#DFB36B] text-[#1E2D24] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumen</span>
          </button>
        </div>

        {/* Quick Preset Buttons */}
        <div className="pt-2 border-t border-white/15 space-y-2">
          <p className="text-[11px] text-white/75 font-medium">
            Tambah cepat berdasarkan jenis dokumen:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {QUICK_DOCUMENT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => openCreateModal(tpl)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3 h-3 text-[#F4D393]" />
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EXPIRY ALERT BANNER */}
      {expiringSoonDocs.length > 0 && (
        <section className="rounded-2xl bg-[#FFF8EB] border border-[#F0D9B5] p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B36B00] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-[#1E2D24]">
              Perhatian Masa Berlaku Dokumen ({expiringSoonDocs.length} Dokumen)
            </p>
            <div className="text-[#5C6B62] space-y-0.5">
              {expiringSoonDocs.map((d) => (
                <p key={d.id}>
                  • <span className="font-semibold text-[#1E2D24]">{d.title}</span> — Masa berlaku:{' '}
                  <span className="font-mono-num font-semibold text-[#B36B00]">
                    {formatDateId(d.expiry_date || '')}
                  </span>
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEARCH & CATEGORY FILTER */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari KTP, STNK, nomor NIK, plat nomor, atau nama pemilik..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-sm text-[#1E2D24]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['Semua', ...DOCUMENT_CATEGORIES] as const).map((cat) => {
            const count =
              cat === 'Semua'
                ? familyDocuments.length
                : familyDocuments.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-[#2A4D3E] text-white'
                    : 'bg-[#FAF7F2] border border-[#E8E2D5] text-[#5C6B62] hover:text-[#1E2D24]'
                }`}
              >
                <span>{cat}</span>
                <span className="font-mono-num text-[11px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* DOCUMENT CARDS LIST */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Belum ada dokumen yang disimpan"
          description="Simpan foto/PDF KTP, KK, STNK, BPKB, atau tautan Google Drive agar mudah diakses oleh Suami & Istri kapan saja."
          actionLabel="Tambah Dokumen Pertama"
          onAction={() => openCreateModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const expiryInfo = getExpiryBadge(doc.expiry_date);
            const hasDirectFile = Boolean(doc.file_data_url);
            const hasGdrive = Boolean(doc.gdrive_url);
            const isImageFile =
              doc.file_mime_type?.startsWith('image/') ||
              doc.file_data_url?.startsWith('data:image/');

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Icon + Title + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center shrink-0">
                        {getCategoryIcon(doc.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5C6B62]">
                          <span>{doc.category}</span>
                          <span>·</span>
                          <span className="font-semibold text-[#2A4D3E]">{doc.owner_name}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#1E2D24] truncate mt-0.5">
                          {doc.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        aria-label="Edit dokumen"
                        className="min-h-[40px] min-w-[40px] rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#FAF7F2] flex items-center justify-center"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingDocId(doc.id)}
                        aria-label="Hapus dokumen"
                        className="min-h-[40px] min-w-[40px] rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FAF7F2] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Document Number with 1-Click Copy */}
                  {doc.document_number && (
                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-[11px] text-[#5C6B62]">
                          Nomor Dokumen / Plat / ID
                        </span>
                        <span className="font-mono-num text-sm font-bold text-[#1E2D24] break-all">
                          {doc.document_number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(doc.id, doc.document_number)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D5] text-xs font-semibold text-[#2A4D3E] hover:bg-[#F4EFE6] flex items-center gap-1.5 shrink-0"
                      >
                        {copiedId === doc.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#2A6F4E]" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Image Preview Thumbnail if uploaded directly */}
                  {hasDirectFile && isImageFile && (
                    <div
                      onClick={() => setPreviewDoc(doc)}
                      className="relative group cursor-pointer overflow-hidden rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] h-36"
                    >
                      <img
                        src={doc.file_data_url}
                        alt={doc.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>Klik untuk perbesar dokumen</span>
                      </div>
                    </div>
                  )}

                  {/* Metadata & Notes */}
                  <div className="space-y-1 text-xs text-[#5C6B62]">
                    {expiryInfo && (
                      <p className={`font-mono-num font-medium ${expiryInfo.colorClass}`}>
                        {expiryInfo.text}
                      </p>
                    )}
                    {doc.notes && <p className="leading-relaxed">{doc.notes}</p>}
                  </div>
                </div>

                {/* Footer Attachment Actions (Website Upload & Google Drive Link) */}
                <div className="pt-3 border-t border-[#E8E2D5] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#5C6B62]">
                    {hasDirectFile && (
                      <span className="inline-flex items-center gap-1 text-[#2A4D3E] font-medium">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Berkas Tersimpan</span>
                      </span>
                    )}
                    {hasDirectFile && hasGdrive && <span>·</span>}
                    {hasGdrive && (
                      <span className="inline-flex items-center gap-1 text-[#457B9D] font-medium">
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Google Drive</span>
                      </span>
                    )}
                    {!hasDirectFile && !hasGdrive && <span>Tanpa lampiran berkas</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {(hasDirectFile || hasGdrive) && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4EFE6] hover:bg-[#E8E2D5] text-[#1E2D24] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Dokumen</span>
                      </button>
                    )}

                    {hasDirectFile && (
                      <a
                        href={doc.file_data_url}
                        download={doc.file_name || `${doc.title}.jpg`}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] hover:bg-[#F4EFE6] text-[#1E2D24] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </a>
                    )}

                    {hasGdrive && (
                      <a
                        href={doc.gdrive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2A4D3E] hover:bg-[#213D31] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka GDrive</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT DOCUMENT */}
      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoc ? 'Edit Dokumen Keluarga' : 'Tambah Dokumen Keluarga'}
        subtitle="Simpan dokumen dengan upload file langsung di website atau tautan Google Drive"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3.5 py-2.5 rounded-xl">
              {formError}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Nama Dokumen
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: KTP Suami, STNK Mobil Honda HR-V, Kartu Keluarga"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Kategori Dokumen
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Pemilik Dokumen
              </label>
              <select
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                {ownerOptions.map((ow) => (
                  <option key={ow} value={ow}>
                    {ow}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Nomor Dokumen / NIK / Plat Nomor (Opsional)
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Contoh: 3201234567890001 / B 1234 XYZ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm font-mono-num text-[#1E2D24]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Masa Berlaku / Jatuh Tempo Pajak (dd/mm/yyyy)
              </label>
              <DateInput value={expiryDate} onChange={setExpiryDate} />
            </div>
          </div>

          {/* DUAL ATTACHMENT SECTION: UPLOAD FILE VS GOOGLE DRIVE LINK */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1E2D24]">
                Lampiran Berkas Dokumen (Bisa Pilih Salah Satu atau Keduanya)
              </label>
            </div>

            {/* Segmented Mode Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#E8E2D5]/60">
              <button
                type="button"
                onClick={() => setAttachmentTab('upload')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  attachmentTab === 'upload'
                    ? 'bg-white text-[#1E2D24] shadow-xs'
                    : 'text-[#5C6B62] hover:text-[#1E2D24]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload di Website</span>
                {fileDataUrl && <Check className="w-3.5 h-3.5 text-[#2A6F4E]" />}
              </button>

              <button
                type="button"
                onClick={() => setAttachmentTab('gdrive')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  attachmentTab === 'gdrive'
                    ? 'bg-white text-[#1E2D24] shadow-xs'
                    : 'text-[#5C6B62] hover:text-[#1E2D24]'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link Google Drive</span>
                {gdriveUrl.trim() && <Check className="w-3.5 h-3.5 text-[#2A6F4E]" />}
              </button>
            </div>

            {attachmentTab === 'upload' ? (
              <div className="space-y-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!fileDataUrl ? (
                  <button
                    type="button"
                    disabled={isProcessingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-[#C7BFA8] bg-white hover:bg-[#F4EFE6]/50 text-center space-y-1.5 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-[#2A4D3E] mx-auto" />
                    <p className="text-xs font-bold text-[#1E2D24]">
                      {isProcessingFile
                        ? 'Memproses & mengoptimalkan berkas...'
                        : 'Klik untuk Pilih Foto (KTP/STNK/KK) atau File PDF'}
                    </p>
                    <p className="text-[11px] text-[#5C6B62]">
                      Mendukung foto kamera HP (JPG, PNG, WEBP) atau dokumen PDF
                    </p>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-[#E8E2D5] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {fileMimeType?.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-[#2A4D3E] shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-[#C84B31] shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-[#1E2D24] truncate">
                          {fileName || 'Berkas Dokumen Terlampir'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] text-[11px] font-semibold text-[#1E2D24]"
                        >
                          Ganti File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileDataUrl('');
                            setFileName('');
                            setFileMimeType('');
                            setUploadStatusMsg('');
                          }}
                          className="p-1 rounded-lg text-[#C84B31] hover:bg-[#FDECEC]"
                          aria-label="Hapus lampiran file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {fileMimeType?.startsWith('image/') && (
                      <img
                        src={fileDataUrl}
                        alt="Pratinjau Dokumen"
                        referrerPolicy="no-referrer"
                        className="w-full max-h-44 object-contain rounded-lg bg-[#FAF7F2] border border-[#E8E2D5]"
                      />
                    )}

                    {uploadStatusMsg && (
                      <p className="text-[11px] text-[#2A6F4E] font-medium">{uploadStatusMsg}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#1E2D24]">
                  URL / Tautan Google Drive atau Cloud
                </label>
                <input
                  type="url"
                  value={gdriveUrl}
                  onChange={(e) => setGdriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
                />
                <p className="text-[11px] text-[#5C6B62]">
                  Tempel link Google Drive (pastikan akses link diatur ke "Siapa saja yang memiliki
                  link" atau akun pasangan sudah diberi akses).
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Dokumen asli disimpan di laci lemari kamar utama map warna hijau..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessingFile || isSavingDoc}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {isSavingDoc ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Dokumen</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: PREVIEW DOCUMENT */}
      <ResponsiveModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || 'Pratinjau Dokumen'}
        subtitle={
          previewDoc ? `${previewDoc.category} · Pemilik: ${previewDoc.owner_name}` : undefined
        }
      >
        {previewDoc && (
          <div className="space-y-4">
            {previewDoc.document_number && (
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[11px] text-[#5C6B62]">Nomor Dokumen / ID</span>
                  <span className="font-mono-num text-sm font-bold text-[#1E2D24]">
                    {previewDoc.document_number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyNumber(previewDoc.id, previewDoc.document_number)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D5] text-xs font-semibold text-[#2A4D3E] flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === previewDoc.id ? 'Tersalin' : 'Salin Nomor'}</span>
                </button>
              </div>
            )}

            {/* Direct Uploaded Image or PDF */}
            {previewDoc.file_data_url && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E2D24]">
                    Berkas yang Diupload ({previewDoc.file_name || 'Dokumen'})
                  </span>
                  <a
                    href={previewDoc.file_data_url}
                    download={previewDoc.file_name || `${previewDoc.title}.jpg`}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File</span>
                  </a>
                </div>

                {previewDoc.file_mime_type === 'application/pdf' ||
                previewDoc.file_data_url.startsWith('data:application/pdf') ? (
                  <iframe
                    src={previewDoc.file_data_url}
                    title={previewDoc.title}
                    className="w-full h-96 rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2]"
                  />
                ) : (
                  <div className="rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] p-2 overflow-auto max-h-[65vh]">
                    <img
                      src={previewDoc.file_data_url}
                      alt={previewDoc.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-contain rounded-xl"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Google Drive Preview / Link */}
            {previewDoc.gdrive_url && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E2D24]">Tautan Google Drive</span>
                  <a
                    href={previewDoc.gdrive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Tab Baru</span>
                  </a>
                </div>

                {extractGoogleDriveEmbedUrl(previewDoc.gdrive_url) ? (
                  <iframe
                    src={extractGoogleDriveEmbedUrl(previewDoc.gdrive_url) || ''}
                    title={`Google Drive - ${previewDoc.title}`}
                    className="w-full h-80 rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2]"
                    allow="autoplay"
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#5C6B62] break-all">
                    {previewDoc.gdrive_url}
                  </div>
                )}
              </div>
            )}

            {previewDoc.notes && (
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#5C6B62]">
                <span className="block font-semibold text-[#1E2D24] mb-0.5">Lokasi / Catatan:</span>
                {previewDoc.notes}
              </div>
            )}
          </div>
        )}
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingDocId)}
        onClose={() => setDeletingDocId(null)}
        onConfirm={() => {
          if (deletingDocId) deleteFamilyDocument(deletingDocId);
        }}
        title="Hapus Dokumen dari Brankas?"
        description="Dokumen ini beserta lampirannya akan dihapus dari penyimpanan keluarga."
      />
    </div>
  );
}

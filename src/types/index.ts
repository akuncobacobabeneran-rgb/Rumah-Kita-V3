export type WalletType = 'Tunai' | 'Bank' | 'Dompet Digital';

export type TransactionType = 'Pemasukan' | 'Pengeluaran' | 'Transfer';

export type DebtType = 'Utang' | 'Piutang';
export type DebtStatus = 'Belum lunas' | 'Sebagian' | 'Lunas';

export type AssetCategory = 'Kendaraan' | 'Rumah' | 'Emas' | 'Investasi' | 'Aset lainnya';

export type FrequencyType = 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan';

export type TaskStatus = 'Belum selesai' | 'Selesai';
export type MaintenanceStatus = 'Belum dikerjakan' | 'Sedang dikerjakan' | 'Selesai';

export type ConversationCategory =
  | 'Hubungan'
  | 'Komunikasi'
  | 'Masa depan'
  | 'Keuangan'
  | 'Keluarga'
  | 'Fun';

export type NotificationSource =
  | 'Task'
  | 'Agenda'
  | 'Jatuh tempo'
  | 'Budget'
  | 'Transaksi'
  | 'Reminder';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  family_id: string;
  role: 'Admin' | 'Pasangan' | 'Anggota';
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  partner_1_name: string;
  partner_2_name: string;
  partner_1_avatar?: string;
  partner_2_avatar?: string;
  couple_motto?: string;
  anniversary_date?: string;
  custom_shortcuts?: string[];
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Pasangan' | 'Anggota';
  avatar_url?: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  family_id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategory {
  id: string;
  family_id: string;
  name: string;
  type: 'Pemasukan' | 'Pengeluaran';
  icon: string;
  color: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  category_id: string;
  wallet_id: string;
  to_wallet_id?: string; // Used when type === 'Transfer'
  member_id: string;
  member_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  family_id: string;
  category_id: string;
  amount: number;
  period_month: string; // YYYY-MM
  allocation_group?: 'Kebutuhan Pokok' | 'Tabungan & Investasi' | 'Gaya Hidup & Keluarga';
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  family_id: string;
  type: DebtType;
  person_name: string;
  total_amount: number;
  paid_amount: number;
  start_date: string;
  due_date: string;
  notes: string;
  status: DebtStatus;
  wallet_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  family_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  icon: string;
  color: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  family_id: string;
  name: string;
  category: AssetCategory;
  value: number;
  acquisition_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  family_id: string;
  name: string;
  type: 'Pemasukan' | 'Pengeluaran';
  amount: number;
  category_id: string;
  wallet_id: string;
  start_date: string;
  frequency: FrequencyType;
  end_date?: string;
  next_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  family_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  family_id: string;
  title: string;
  description: string;
  category_id: string;
  due_date: string; // YYYY-MM-DD
  recurrence: 'Tidak berulang' | FrequencyType;
  assignee_id: string;
  assignee_name: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceItem {
  id: string;
  family_id: string;
  title: string;
  category: string; // 'Kendaraan' | 'Rumah' | 'Elektronik' (or legacy categories)
  sub_type?: string; // 'Mobil' | 'Motor' | 'Rumah' | 'Elektronik'
  icon?: string;
  color?: string;
  scheduled_date: string;
  reminder_date?: string;
  assignee_name: string;
  status: MaintenanceStatus;
  estimated_cost?: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  category: 'Keluarga' | 'Agenda' | 'Date Night' | 'Penting' | 'Acara';
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  notes: string;
  is_completed: boolean;
  is_date_night?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoupleMoment {
  id: string;
  family_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  story: string;
  photo_url?: string;
  mood_tag?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCard {
  id: string;
  family_id: string;
  category: ConversationCategory;
  question: string;
  is_discussed: boolean;
  is_favorite: boolean;
  answer_notes?: string;
  discussed_at?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  family_id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  photo_url?: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  family_id: string;
  title: string;
  message: string;
  source: NotificationSource;
  is_read: boolean;
  link_path?: string;
  created_at: string;
  priority?: 'urgent' | 'high' | 'normal';
  action_type?: 'task' | 'event' | 'budget' | 'debt';
  action_id?: string;
}

export type DocumentCategory =
  | 'Identitas & Kependudukan'
  | 'Dokumen Kendaraan'
  | 'Rumah & Properti'
  | 'Kesehatan & Asuransi'
  | 'Tagihan & Kontak Darurat';

export interface FamilyDocument {
  id: string;
  family_id: string;
  title: string;
  category: DocumentCategory;
  owner_name: string;
  document_number?: string;
  expiry_date?: string; // YYYY-MM-DD
  file_data_url?: string; // Direct uploaded file (compressed image or PDF data URL)
  file_name?: string;
  file_mime_type?: string;
  gdrive_url?: string; // Google Drive or external cloud link
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ShoppingCategory =
  | 'Dapur & Sayur'
  | 'Kebutuhan Rumah'
  | 'Anak & Kesehatan'
  | 'Lainnya';

export interface ShoppingItem {
  id: string;
  family_id: string;
  name: string;
  category: ShoppingCategory;
  quantity: string;
  estimated_price: number;
  is_checked: boolean;
  created_at: string;
  updated_at: string;
}

export type MealDayName =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu'
  | 'Minggu';

export interface MealPlanDay {
  id: string;
  family_id: string;
  day_name: MealDayName;
  breakfast: string;
  lunch: string;
  dinner: string;
  notes?: string;
  updated_at: string;
}

export type BucketCategory =
  | 'Liburan & Perjalanan'
  | 'Rumah & Kehidupan'
  | 'Pengalaman Berdua'
  | 'Ibadah & Spiritual'
  | 'Romantis';

export interface CoupleBucketItem {
  id: string;
  family_id: string;
  title: string;
  category: BucketCategory;
  target_date?: string; // YYYY-MM-DD
  is_achieved: boolean;
  achieved_date?: string; // YYYY-MM-DD
  notes: string;
  created_at: string;
  updated_at: string;
}


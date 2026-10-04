import {
  ConversationCard,
  ConversationCategory,
  TaskCategory,
  TransactionCategory,
} from '../types';
import { generateUuid } from './format';

export function createDefaultTransactionCategories(familyId: string): TransactionCategory[] {
  const now = new Date().toISOString();
  const defaults: Array<{
    name: string;
    type: 'Pemasukan' | 'Pengeluaran';
    icon: string;
    color: string;
  }> = [
    { name: 'Gaji & Penghasilan', type: 'Pemasukan', icon: 'Briefcase', color: '#2A4D3E' },
    { name: 'Bonus & Tunjangan', type: 'Pemasukan', icon: 'Gift', color: '#D4A359' },
    { name: 'Hasil Investasi', type: 'Pemasukan', icon: 'TrendingUp', color: '#457B9D' },
    { name: 'Pemasukan Lainnya', type: 'Pemasukan', icon: 'PlusCircle', color: '#84A59D' },
    { name: 'Belanja Dapur & Makan', type: 'Pengeluaran', icon: 'Utensils', color: '#E07A5F' },
    { name: 'Tagihan & Utilitas', type: 'Pengeluaran', icon: 'Zap', color: '#D4A359' },
    { name: 'Rumah & Cicilan', type: 'Pengeluaran', icon: 'Home', color: '#2A4D3E' },
    { name: 'Transportasi', type: 'Pengeluaran', icon: 'Car', color: '#457B9D' },
    { name: 'Anak & Pendidikan', type: 'Pengeluaran', icon: 'GraduationCap', color: '#6B9080' },
    { name: 'Kesehatan', type: 'Pengeluaran', icon: 'HeartPulse', color: '#D88C9A' },
    { name: 'Hiburan & Date Night', type: 'Pengeluaran', icon: 'Sparkles', color: '#9D8189' },
    { name: 'Lainnya', type: 'Pengeluaran', icon: 'MoreHorizontal', color: '#84A59D' },
  ];

  return defaults.map((item) => ({
    id: generateUuid(),
    family_id: familyId,
    name: item.name,
    type: item.type,
    icon: item.icon,
    color: item.color,
    is_default: true,
    created_at: now,
    updated_at: now,
  }));
}

export function createDefaultTaskCategories(familyId: string): TaskCategory[] {
  const now = new Date().toISOString();
  const list = [
    { name: 'Urusan Rumah Harian', color: '#2A4D3E', sort_order: 0 },
    { name: 'Belanja & Kebutuhan', color: '#D4A359', sort_order: 1 },
    { name: 'Keluarga & Anak', color: '#D88C9A', sort_order: 2 },
    { name: 'Administrasi & Dokumen', color: '#457B9D', sort_order: 3 },
  ];

  return list.map((item) => ({
    id: generateUuid(),
    family_id: familyId,
    name: item.name,
    color: item.color,
    sort_order: item.sort_order,
    created_at: now,
    updated_at: now,
  }));
}

export const DEFAULT_CONVERSATION_CARD_BANK: Array<{
  category: ConversationCategory;
  question: string;
}> = [
  // ===========================================================================
  // 1. HUBUNGAN (25 Kartu)
  // ===========================================================================
  {
    category: 'Hubungan',
    question: 'Momen sederhana apa dalam seminggu terakhir yang membuatmu merasa paling disayang olehku?',
  },
  {
    category: 'Hubungan',
    question: 'Kebiasaan kecil apa yang ingin kita mulai lakukan bersama setiap pagi atau sebelum tidur?',
  },
  {
    category: 'Hubungan',
    question: 'Apa hal yang paling kamu syukuri dari perjalanan pernikahan dan hubungan kita sejauh ini?',
  },
  {
    category: 'Hubungan',
    question: 'Ketika kamu sedang lelah setelah seharian beraktivitas, bentuk perhatian apa yang paling kamu butuhkan dariku?',
  },
  {
    category: 'Hubungan',
    question: 'Bahasa cinta (love language) apa yang saat ini paling membuat hatimu terasa penuh dan hangat?',
  },
  {
    category: 'Hubungan',
    question: 'Kenangan masa awal pernikahan atau pendekatan mana yang paling sering membuatmu tersenyum sendiri?',
  },
  {
    category: 'Hubungan',
    question: 'Sifat atau karakter apa dariku yang membuatmu merasa aman dan tenang menjalani hidup bersama?',
  },
  {
    category: 'Hubungan',
    question: 'Apa perubahan positif yang paling kamu banggakan dari diri kita berdua sejak menikah?',
  },
  {
    category: 'Hubungan',
    question: 'Bagaimana cara kita menjaga keromantisan tetap hidup di tengah kesibukan mengurus rumah tangga?',
  },
  {
    category: 'Hubungan',
    question: 'Pelukan atau sentuhan kasih sayang seperti apa yang paling menenangkanmu saat sedang cemas?',
  },
  {
    category: 'Hubungan',
    question: 'Apa satu hal kecil yang pernah kulakukan untukmu dan diam-diam tidak pernah kamu lupakan sampai sekarang?',
  },
  {
    category: 'Hubungan',
    question: 'Menurutmu, apa kekuatan terbesar kita sebagai pasangan ketika menghadapi masa-masa sulit?',
  },
  {
    category: 'Hubungan',
    question: 'Kapan terakhir kali kamu merasa sangat bangga menjadi pasanganku?',
  },
  {
    category: 'Hubungan',
    question: 'Apa arti "pulang ke rumah" bagimu semenjak kita membangun rumah tangga bersama?',
  },
  {
    category: 'Hubungan',
    question: 'Hal romantis apa yang dulu sering kita lakukan dan ingin kita hidupkan kembali bulan ini?',
  },
  {
    category: 'Hubungan',
    question: 'Bagaimana aku bisa menjadi tempat ternyaman bagimu untuk berbagi rasa takut atau keraguan?',
  },
  {
    category: 'Hubungan',
    question: 'Apa pujian dariku yang paling berkesan dan selalu meningkatkan rasa percaya dirimu?',
  },
  {
    category: 'Hubungan',
    question: 'Jika kamu bisa mengulang satu hari indah dalam perjalanan cinta kita, hari apa yang ingin kamu jalani lagi?',
  },
  {
    category: 'Hubungan',
    question: 'Bagaimana cara terbaik bagiku untuk menunjukkan bahwa kamu selalu menjadi prioritas utamaku?',
  },
  {
    category: 'Hubungan',
    question: 'Apa hal baru tentang diriku yang baru kamu sadari dan sukai setelah kita tinggal satu atap?',
  },
  {
    category: 'Hubungan',
    question: 'Dalam hal apa hubungan kita membuatmu tumbuh menjadi pribadi yang lebih baik?',
  },
  {
    category: 'Hubungan',
    question: 'Kejutan kecil seperti apa yang paling bisa mencerahkan harimu tanpa harus menunggu hari spesial?',
  },
  {
    category: 'Hubungan',
    question: 'Apa doa yang paling sering kamu panjatkan secara khusus untuk kebaikan hubungan kita berdua?',
  },
  {
    category: 'Hubungan',
    question: 'Bagaimana kita bisa saling mengingatkan dengan lembut saat salah satu dari kita mulai terlalu sibuk?',
  },
  {
    category: 'Hubungan',
    question: 'Apa definisi pernikahan yang bahagia dan menenteramkan menurut versimu saat ini?',
  },

  // ===========================================================================
    {
    category: 'Hubungan',
    question: 'Kapan momen kamu merasa kita berdua benar-benar sefrekuensi dalam memandang hidup?',
  },
  {
    category: 'Hubungan',
    question: 'Apa lagu yang paling mengingatkanmu pada cerita cinta kita dari dulu sampai sekarang?',
  },
  {
    category: 'Hubungan',
    question: 'Hal apa yang paling kamu rindukan saat kita harus berpisah beberapa hari karena urusan kerja?',
  },
  {
    category: 'Hubungan',
    question: 'Bagaimana kita bisa membuat waktu berdua (quality time) di akhir pekan terasa lebih istimewa?',
  },
  {
    category: 'Hubungan',
    question: 'Apa hal paling menyentuh hati yang pernah aku katakan padamu saat kamu sedang terpuruk?',
  },
  {
    category: 'Hubungan',
    question: 'Jika ada satu sifat manjamu yang hanya boleh kamu tunjukkan padaku, sifat apa itu?',
  },
  {
    category: 'Hubungan',
    question: 'Bagaimana caraku menemanimu yang paling terasa menyejukkan hati saat kamu sedang sedih?',
  },
  {
    category: 'Hubungan',
    question: 'Apa impian liburan berdua tanpa kesibukan yang paling ingin kita wujudkan tahun ini?',
  },
  {
    category: 'Hubungan',
    question: 'Apa arti komitmen pernikahan kita bagimu ketika kita sedang berada di titik jenuh?',
  },
  {
    category: 'Hubungan',
    question: 'Hal apa yang membuatmu selalu bersyukur bahwa takdir mempertemukan kita berdua?',
  },

  // 2. KOMUNIKASI (25 Kartu)
  // ===========================================================================
  {
    category: 'Komunikasi',
    question: 'Bagaimana cara terbaik bagiku untuk menyampaikan pendapat saat kita sedang berbeda pandangan?',
  },
  {
    category: 'Komunikasi',
    question: 'Adakah topik yang selama ini ingin kamu ceritakan tetapi belum menemukan waktu yang pas?',
  },
  {
    category: 'Komunikasi',
    question: 'Apa tanda-tanda yang perlu aku pahami ketika kamu sedang butuh ruang tenang sejenak?',
  },
  {
    category: 'Komunikasi',
    question: 'Hal apa yang menurutmu sudah membaik dari cara kita berkomunikasi tahun ini?',
  },
  {
    category: 'Komunikasi',
    question: 'Saat kamu sedang curhat tentang masalahmu, kapan kamu butuh didengarkan saja dan kapan kamu butuh saran solusi?',
  },
  {
    category: 'Komunikasi',
    question: 'Nada bicara atau pilihan kata seperti apa yang paling membuatmu merasa dihargai saat kita berdiskusi?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana cara kita menyelesaikan kesalahpahaman agar tidak berlarut-larut melewati waktu tidur?',
  },
  {
    category: 'Komunikasi',
    question: 'Adakah kebiasaan komunikasiku yang kadang tanpa sengaja membuatmu merasa kurang didengarkan?',
  },
  {
    category: 'Komunikasi',
    question: 'Apa kode rahasia atau kalimat singkat yang bisa kita pakai saat salah satu dari kita merasa kewalahan?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana cara terbaik bagiku untuk meminta maaf ketika aku melakukan kesalahan agar hatimu benar-benar lega?',
  },
  {
    category: 'Komunikasi',
    question: 'Kapan waktu terbaik dalam sehari bagi kita untuk mengobrol serius tanpa gangguan gawai (HP)?',
  },
  {
    category: 'Komunikasi',
    question: 'Hal apa yang membuatmu merasa paling mudah terbuka dan jujur kepadaku?',
  },
  {
    category: 'Komunikasi',
    question: 'Ketika kita sedang sama-sama emosi, apa langkah jeda terbaik yang sebaiknya kita sepakati?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana kita bisa membiasakan budaya saling mengapresiasi hal-hal kecil setiap hari di rumah?',
  },
  {
    category: 'Komunikasi',
    question: 'Adakah ekspektasi yang belum sempat kamu ucapkan secara langsung kepadaku akhir-akhir ini?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana perasaanmu tentang intensitas obrolan mendalam (deep talk) kita dalam sebulan terakhir?',
  },
  {
    category: 'Komunikasi',
    question: 'Saat aku memberikan masukan untukmu, cara penyampaian seperti apa yang paling nyaman kamu terima?',
  },
  {
    category: 'Komunikasi',
    question: 'Apa hal tersulit bagimu untuk diungkapkan saat kamu sedang merasa sedih atau kecewa?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana kita memastikan keputusan besar di rumah selalu terasa adil dan disepakati bersama?',
  },
  {
    category: 'Komunikasi',
    question: 'Pertanyaan harian apa yang paling senang kamu dengar dariku sepulang beraktivitas?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana cara kita menjaga agar obrolan kita tidak hanya seputar tagihan dan tugas rumah semata?',
  },
  {
    category: 'Komunikasi',
    question: 'Dalam situasi sosial atau keluarga besar, bagaimana kita bisa saling memberi sinyal dukungan satu sama lain?',
  },
  {
    category: 'Komunikasi',
    question: 'Apa momen obrolan kita yang paling berkesan dan membuatmu merasa sangat dimengerti?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana cara kita menyampaikan ketidaksukaan secara jujur namun tetap penuh kasih sayang?',
  },
  {
    category: 'Komunikasi',
    question: 'Satu kalimat penyemangat apa dariku yang selalu berhasil menenangkan pikiranmu?',
  },

  // ===========================================================================
    {
    category: 'Komunikasi',
    question: 'Apakah ada ucapan terima kasih yang belum sempat kamu sampaikan untuk hal kecil yang kulakukan belakangan ini?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana kita bisa lebih peka membaca bahasa tubuh satu sama lain saat sedang tidak enak hati?',
  },
  {
    category: 'Komunikasi',
    question: 'Topik apa yang menurutmu perlu lebih sering kita bicarakan secara santai di meja makan?',
  },
  {
    category: 'Komunikasi',
    question: 'Saat kita berbeda pendapat di depan orang lain, bagaimana cara kita menjaga wibawa satu sama lain?',
  },
  {
    category: 'Komunikasi',
    question: 'Apa respons pertama yang paling kamu harapkan dariku saat kamu bercerita tentang harimu yang buruk?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana cara terbaik bagiku untuk mengingatkanmu menjaga kesehatan tanpa terkesan menggurui?',
  },
  {
    category: 'Komunikasi',
    question: 'Apakah ada hal yang membuatmu merasa sungkan padaku yang ingin kamu hilangkan?',
  },
  {
    category: 'Komunikasi',
    question: 'Bagaimana kita bisa merayakan keberhasilan kecil masing-masing dengan lebih hangat dan meriah?',
  },
  {
    category: 'Komunikasi',
    question: 'Jika kamu merasa kesepian atau butuh teman bicara larut malam, apakah aku sudah cukup hadir untukmu?',
  },
  {
    category: 'Komunikasi',
    question: 'Kata atau sapaan apa di pesan WhatsApp yang paling membuatmu tersenyum di tengah jam kerja?',
  },

  // 3. MASA DEPAN (25 Kartu)
  // ===========================================================================
  {
    category: 'Masa depan',
    question: 'Seperti apa gambaran kehidupan keluarga ideal kita dalam 5 tahun ke depan menurutmu?',
  },
  {
    category: 'Masa depan',
    question: 'Impian pribadi apa yang ingin kamu wujudkan tahun depan dan bagaimana aku bisa mendukungmu?',
  },
  {
    category: 'Masa depan',
    question: 'Tradisi keluarga baru apa yang ingin kita bangun dan wariskan di rumah kita?',
  },
  {
    category: 'Masa depan',
    question: 'Jika kita punya waktu luang satu bulan penuh bersama, proyek atau perjalanan apa yang ingin kita lakukan?',
  },
  {
    category: 'Masa depan',
    question: 'Seperti apa suasana masa tua yang paling ingin kita nikmati berdua kelak?',
  },
  {
    category: 'Masa depan',
    question: 'Keterampilan atau ilmu baru apa yang ingin kita pelajari bersama untuk bekal masa depan keluarga?',
  },
  {
    category: 'Masa depan',
    question: 'Lingkungan tempat tinggal dan rumah seperti apa yang menjadi impian jangka panjang kita?',
  },
  {
    category: 'Masa depan',
    question: 'Apa nilai hidup terpenting yang ingin kita tanamkan kepada anak-anak dan keturunan kita nanti?',
  },
  {
    category: 'Masa depan',
    question: 'Jika suatu hari kita membuat usaha atau proyek bersama, bidang apa yang paling seru untuk kita bangun?',
  },
  {
    category: 'Masa depan',
    question: 'Target kesehatan atau kebugaran apa yang ingin kita capai berdua agar tetap bugar hingga tua?',
  },
  {
    category: 'Masa depan',
    question: 'Perjalanan ibadah atau wisata spiritual apa yang paling ingin kita wujudkan bersama?',
  },
  {
    category: 'Masa depan',
    question: 'Apa tiga hal utama yang ingin kita capai sebagai pasangan sebelum ulang tahun pernikahan berikutnya?',
  },
  {
    category: 'Masa depan',
    question: 'Bagaimana pandanganmu tentang keseimbangan antara karier/pekerjaan dan waktu berkualitas bersama keluarga ke depannya?',
  },
  {
    category: 'Masa depan',
    question: 'Kontribusi sosial atau amal kebaikan apa yang ingin rutin dilakukan oleh keluarga kita di masa depan?',
  },
  {
    category: 'Masa depan',
    question: 'Jika kita menulis surat untuk diri kita 10 tahun lagi, pesan utama apa yang ingin kita sampaikan?',
  },
  {
    category: 'Masa depan',
    question: 'Perubahan gaya hidup apa yang perlu kita mulai dari sekarang demi kualitas hidup yang lebih tenang nanti?',
  },
  {
    category: 'Masa depan',
    question: 'Destinasi impian mana di Indonesia atau dunia yang wajib masuk daftar perjalanan kita berdua?',
  },
  {
    category: 'Masa depan',
    question: 'Bagaimana rencana kita dalam mempersiapkan kemandirian di masa pensiun kelak?',
  },
  {
    category: 'Masa depan',
    question: 'Ruangan atau sudut impian apa yang paling ingin kamu wujudkan di rumah kita nanti?',
  },
  {
    category: 'Masa depan',
    question: 'Apa ketakutan terbesar tentang masa depan yang bisa kita hadapi dan persiapkan bersama mulai hari ini?',
  },
  {
    category: 'Masa depan',
    question: 'Hal baru apa yang belum pernah kita coba sejak menikah dan ingin kita jadwalkan tahun ini?',
  },
  {
    category: 'Masa depan',
    question: 'Bagaimana kita bisa terus mendukung pertumbuhan karier atau passion masing-masing tanpa mengorbankan waktu berdua?',
  },
  {
    category: 'Masa depan',
    question: 'Warisan kebaikan dan kenangan seperti apa yang ingin dikenang oleh orang-orang terdekat tentang keluarga kita?',
  },
  {
    category: 'Masa depan',
    question: 'Jika tidak ada batasan waktu dan biaya, kehidupan sehari-hari seperti apa yang paling kamu impikan?',
  },
  {
    category: 'Masa depan',
    question: 'Langkah kecil apa yang bisa kita ambil minggu ini untuk mendekatkan kita pada mimpi besar keluarga?',
  },

  // ===========================================================================
  // 4. KEUANGAN (25 Kartu)
  // ===========================================================================
  {
    category: 'Keuangan',
    question: 'Prioritas keuangan apa yang menurutmu paling penting untuk kita capai dalam 12 bulan ke depan?',
  },
  {
    category: 'Keuangan',
    question: 'Pengeluaran apa yang menurutmu paling memberikan kebahagiaan dan nilai tambah bagi keluarga kita?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana perasaanmu tentang pembagian anggaran dan tabungan darurat kita saat ini?',
  },
  {
    category: 'Keuangan',
    question: 'Nilai atau kebiasaan finansial apa yang paling ingin kita terapkan di rumah tangga kita?',
  },
  {
    category: 'Keuangan',
    question: 'Apa pelajaran keuangan paling berharga dari orang tuamu yang ingin kita ambil atau kita perbaiki?',
  },
  {
    category: 'Keuangan',
    question: 'Pos pengeluaran mana yang menurutmu masih bisa kita hemat tanpa mengurangi kenyamanan hidup kita?',
  },
  {
    category: 'Keuangan',
    question: 'Berapa batas nominal belanja pribadi yang sebaiknya kita komunikasikan dulu sebelum membeli?',
  },
  {
    category: 'Keuangan',
    question: 'Apa arti "rasa aman secara finansial" bagimu, dan berapa target dana darurat yang membuatmu tenang?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana cara kita mengatur anggaran untuk hiburan dan Date Night agar tetap rutin tanpa rasa bersalah?',
  },
  {
    category: 'Keuangan',
    question: 'Instrumen tabungan atau aset investasi apa yang paling nyaman dan sesuai dengan profil risiko keluarga kita?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana kita menyepakati alokasi dana untuk membantu orang tua atau keluarga besar dengan bijak?',
  },
  {
    category: 'Keuangan',
    question: 'Jika kita mendapat rezeki tambahan atau bonus tak terduga tahun ini, bagaimana pembagian idealnya menurutmu?',
  },
  {
    category: 'Keuangan',
    question: 'Apa kebiasaan belanja impulsif yang perlu kita saling ingatkan dengan cara yang menyenangkan?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana pandanganmu tentang utang produktif vs membeli secara tunai untuk kebutuhan besar keluarga?',
  },
  {
    category: 'Keuangan',
    question: 'Target tabungan (Goal) mana yang paling membuatmu bersemangat setiap kali kita menyisihkan uang?',
  },
  {
    category: 'Keuangan',
    question: 'Seberapa sering waktu ideal bagi kita untuk duduk bersama mengevaluasi laporan keuangan bulanan?',
  },
  {
    category: 'Keuangan',
    question: 'Apa peluang penghasilan tambahan atau pengembangan aset yang menarik untuk kita pelajari bersama?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana cara kita menjaga agar pembahasan soal uang selalu terasa kompak sebagai satu tim?',
  },
  {
    category: 'Keuangan',
    question: 'Hal apa yang menurutmu jauh lebih berharga untuk dibeli dengan kualitas terbaik demi jangka panjang?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana kita mengatur dana khusus untuk zakat, sedekah, dan berbagi kepada sesama setiap bulan?',
  },
  {
    category: 'Keuangan',
    question: 'Apa pencapaian finansial keluarga kita sejauh ini yang patut kita syukuri bersama?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana kita menyiapkan dana tahunan seperti pajak, servis kendaraan, dan hari raya agar tidak mengganggu kas bulanan?',
  },
  {
    category: 'Keuangan',
    question: 'Jika kita harus menyederhanakan gaya hidup selama 6 bulan demi sebuah target besar, hal apa yang siap kita kurangi?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana perasaanmu mengenai transparansi dompet dan pencatatan transaksi kita saat ini?',
  },
  {
    category: 'Keuangan',
    question: 'Kebiasaan finansial cerdas apa yang ingin kita ajarkan kepada anak-anak kita sejak dini?',
  },

  // ===========================================================================
    {
    category: 'Keuangan',
    question: 'Bagaimana perasaanmu tentang keterbukaan keuangan kita sejauh ini, apakah ada yang perlu diperbaiki?',
  },
  {
    category: 'Keuangan',
    question: 'Pengeluaran bersama apa yang menurutmu paling memberikan kebahagiaan dan kepuasan batin bagi kita?',
  },
  {
    category: 'Keuangan',
    question: 'Apa target tabungan atau dana darurat yang paling ingin kita amankan sebelum akhir tahun ini?',
  },
  {
    category: 'Keuangan',
    question: 'Jika ada rezeki nomplok tak terduga, berapa persen yang sebaiknya kita tabung, investasikan, dan nikmati?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana kita membagi peran dalam mengelola anggaran bulanan agar tidak ada yang merasa terbebani?',
  },
  {
    category: 'Keuangan',
    question: 'Pola belanja seperti apa yang menurutmu bisa kita hemat bersama tanpa mengurangi kenyamanan hidup?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana pandanganmu tentang persiapan dana pendidikan atau dana pensiun di usia kita sekarang?',
  },
  {
    category: 'Keuangan',
    question: 'Apa batasan nominal belanja yang kita sepakati harus dibicarakan berdua sebelum membelinya?',
  },
  {
    category: 'Keuangan',
    question: 'Bagaimana caramu melihat perbedaan gaya mengelola uang antara keluargamu dan keluargaku dahulu?',
  },
  {
    category: 'Keuangan',
    question: 'Apa definisi kebebasan finansial (financial freedom) yang ingin kita capai bersama sebagai sebuah tim?',
  },

  // 5. KELUARGA (25 Kartu)
  // ===========================================================================
  {
    category: 'Keluarga',
    question: 'Kenangan masa kecil apa yang paling hangat dan ingin kita hadirkan kembali di keluarga kita?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana kita bisa membagi peran tugas rumah tangga agar terasa lebih ringan bagi kita berdua?',
  },
  {
    category: 'Keluarga',
    question: 'Suasana seperti apa yang ingin dirasakan oleh siapa pun yang berkunjung ke rumah kita?',
  },
  {
    category: 'Keluarga',
    question: 'Apa kegiatan akhir pekan di rumah yang paling membuatmu merasa dekat sebagai keluarga?',
  },
  {
    category: 'Keluarga',
    question: 'Pekerjaan rumah tangga apa yang sebenarnya paling kamu sukai dan mana yang paling membuatmu lelah?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita menjaga hubungan yang harmonis dan sehat dengan orang tua serta mertua?',
  },
  {
    category: 'Keluarga',
    question: 'Ritual makan bersama seperti apa yang ingin kita jaga di meja makan keluarga kita?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita menciptakan suasana rumah yang tenang setelah hari kerja yang padat?',
  },
  {
    category: 'Keluarga',
    question: 'Prinsip pengasuhan (parenting) apa yang menurutmu paling penting untuk kita pegang secara kompak?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita merayakan ulang tahun atau pencapaian kecil anggota keluarga di rumah?',
  },
  {
    category: 'Keluarga',
    question: 'Sudut mana di rumah kita yang paling kamu sukai untuk menghabiskan waktu bersantai bersama?',
  },
  {
    category: 'Keluarga',
    question: 'Kebiasaan sehat apa (seperti olahraga pagi atau makan sayur/buah) yang ingin kita rutinkan sekeluarga?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana kita menetapkan batasan yang sehat antara urusan rumah tangga inti kita dengan pihak luar?',
  },
  {
    category: 'Keluarga',
    question: 'Apa masakan rumahan favoritmu yang selalu membuatmu rindu suasana rumah?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana kita saling bergantian memberi waktu istirahat ("me time") saat pekerjaan rumah sedang menumpuk?',
  },
  {
    category: 'Keluarga',
    question: 'Kegiatan ibadah atau doa bersama apa yang ingin kita kuatkan di dalam keluarga kita?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita menjaga kerapian dan perawatan rumah agar tidak terasa menjadi beban satu orang saja?',
  },
  {
    category: 'Keluarga',
    question: 'Nilai kesopanan, empati, dan tanggung jawab seperti apa yang menjadi ciri khas keluarga kita?',
  },
  {
    category: 'Keluarga',
    question: 'Ketika ada anggota keluarga yang sedang sakit, bagaimana cara kita saling menopang dengan tenang?',
  },
  {
    category: 'Keluarga',
    question: 'Apa tradisi hari raya atau liburan keluarga yang paling kamu nantikan setiap tahunnya?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana kita mendokumentasikan foto dan cerita perjalanan keluarga agar tidak hilang ditelan waktu?',
  },
  {
    category: 'Keluarga',
    question: 'Perbaikan atau penataan kecil apa di rumah yang menurutmu akan membuat aktivitas harian kita jauh lebih nyaman?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita mengajarkan rasa syukur di tengah keluarga dalam kehidupan sehari-hari?',
  },
  {
    category: 'Keluarga',
    question: 'Siapa sosok pasangan atau keluarga panutan yang paling menginspirasimu dalam membangun rumah tangga?',
  },
  {
    category: 'Keluarga',
    question: 'Apa satu hal tentang keluarga kecil kita yang selalu membuatmu bersyukur setiap malam?',
  },

  // ===========================================================================
    {
    category: 'Keluarga',
    question: 'Tradisi akhir pekan apa yang ingin kita bangun agar rumah kita selalu menjadi tempat paling hangat?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita saling mendukung saat menghadapi dinamika atau perbedaan pendapat dengan keluarga besar?',
  },
  {
    category: 'Keluarga',
    question: 'Aturan rumah tangga apa yang menurutmu paling penting untuk kita sepakati dan jaga bersama?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita menjaga privasi dan keutuhan rumah tangga kita dari campur tangan pihak luar?',
  },
  {
    category: 'Keluarga',
    question: 'Pelajaran hidup paling berharga apa dari orang tuamu yang ingin kamu terapkan dalam keluarga kita?',
  },

  // 6. FUN & SANTAI (25 Kartu)
  // ===========================================================================
  {
    category: 'Fun',
    question: 'Jika malam ini kita bisa makan malam di mana saja di dunia, tempat dan menu apa yang kamu pilih?',
  },
  {
    category: 'Fun',
    question: 'Apa kesan pertamamu saat pertama kali kita bertemu yang belum pernah kamu ceritakan detailnya?',
  },
  {
    category: 'Fun',
    question: 'Kalau kisah perjalanan kita dijadikan film, adegan mana yang paling lucu untuk ditonton ulang?',
  },
  {
    category: 'Fun',
    question: 'Hobi baru apa yang seru untuk kita coba pelajari berdua bulan ini?',
  },
  {
    category: 'Fun',
    question: 'Jika kita bertukar peran selama seharian penuh besok, hal apa dariku yang paling lucu untuk kamu tiru?',
  },
  {
    category: 'Fun',
    question: 'Lagu apa yang setiap kali diputar langsung mengingatkanmu pada kenangan kita berdua?',
  },
  {
    category: 'Fun',
    question: 'Apa kebiasaan unik atau tingkah lucuku yang diam-diam selalu berhasil membuatmu tertawa?',
  },
  {
    category: 'Fun',
    question: 'Kalau kita ikut lomba masak berdua tanpa resep, hidangan apa yang paling yakin bisa kita menangkan?',
  },
  {
    category: 'Fun',
    question: 'Jika kita bisa memiliki kekuatan super sebagai pasangan, kekuatan apa yang paling cocok untuk kita?',
  },
  {
    category: 'Fun',
    question: 'Apa momen konyol saat kita bepergian atau tersesat bersama yang justru menjadi kenangan tak terlupakan?',
  },
  {
    category: 'Fun',
    question: 'Kalau akhir pekan ini kita melakukan kencan kejutan dengan anggaran maksimal Rp 100.000, ide seru apa yang kamu pilih?',
  },
  {
    category: 'Fun',
    question: 'Film, serial, atau buku apa yang ingin kita tonton/baca bersama sambil minum teh hangat malam ini?',
  },
  {
    category: 'Fun',
    question: 'Apa makanan atau jajanan kaki lima favoritmu yang tidak pernah membosankan untuk kita beli berdua?',
  },
  {
    category: 'Fun',
    question: 'Jika kita mendesain kaos couple atau merchandise keluarga sendiri, tulisan lucu apa yang pas di depannya?',
  },
  {
    category: 'Fun',
    question: 'Sebutkan 3 kata yang paling menggambarkan gaya kita berdua saat sedang liburan!',
  },
  {
    category: 'Fun',
    question: 'Permainan papan (board game), kartu, atau olahraga santai apa yang seru untuk kita mainkan akhir pekan ini?',
  },
  {
    category: 'Fun',
    question: 'Apa mimpi masa kecilmu yang paling unik atau lucu ketika ditanya "mau jadi apa kalau sudah besar"?',
  },
  {
    category: 'Fun',
    question: 'Kalau kita membuka kafe atau toko kecil bersama, nama unik apa yang akan kita berikan dan apa menu andalannya?',
  },
  {
    category: 'Fun',
    question: 'Foto kita berdua mana di galeri HP-mu yang paling kamu sukai dan apa cerita di baliknya?',
  },
  {
    category: 'Fun',
    question: 'Jika kita melakukan road trip tanpa tujuan pasti besok pagi, ke arah mana kamu ingin kita menyetir?',
  },
  {
    category: 'Fun',
    question: 'Apa hal paling spontan yang pernah kita lakukan berdua dan ingin kita ulangi lagi?',
  },
  {
    category: 'Fun',
    question: 'Kalau kamu harus memilih satu menu sarapan buatan rumah untuk dimakan setiap akhir pekan, menu apa itu?',
  },
  {
    category: 'Fun',
    question: 'Apa julukan atau panggilan sayang paling lucu yang pernah terpikirkan olehmu untukku?',
  },
  {
    category: 'Fun',
    question: 'Jika kita mengadakan piknik sore berdua minggu ini, 3 barang atau camilan apa yang wajib dibawa?',
  },
  {
    category: 'Fun',
    question: 'Tantangan seru tanpa gawai (digital detox) apa yang berani kita coba selama 3 jam malam ini?',
  },
  {
    category: 'Fun',
    question: 'Jika kita berdua menjadi peserta kuis masak di televisi, siapa yang akan panik duluan dan siapa yang memasak?',
  },
  {
    category: 'Fun',
    question: 'Film atau serial apa yang menurutmu paling seru untuk kita tonton maraton sambil makan popcorn di kamar?',
  },
  {
    category: 'Fun',
    question: 'Kalau kita punya pintu ke mana saja hari ini selama 2 jam, kamu ingin kita teleportasi ke mana?',
  },
  {
    category: 'Fun',
    question: 'Apa kebiasaan tidur atau kebiasaan anehku yang diam-diam menurutmu lucu atau menggemaskan?',
  },
  {
    category: 'Fun',
    question: 'Jika kita bertukar peran selama satu hari penuh, hal apa yang menurutmu paling menantang untuk kamu lakukan?',
  },
  {
    category: 'Keluarga',
    question: 'Kapan momen terbaik saat liburan bersama keluarga besar yang paling berkesan bagimu?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana cara kita membagi waktu yang adil saat hari raya atau liburan antara keluargamu dan keluargaku?',
  },
  {
    category: 'Keluarga',
    question: 'Aktivitas berkebun atau menata rumah apa yang ingin kita jadikan rutinitas santai keluarga?',
  },
  {
    category: 'Keluarga',
    question: 'Bagaimana kita bisa mencontohkan komunikasi yang sehat dan saling menghargai di depan anak-anak kelak?',
  },
  {
    category: 'Keluarga',
    question: 'Apa harapan terbesarmu untuk keharmonisan dan kehangatan rumah tangga kita di tahun-tahun mendatang?',
  },
  {
    category: 'Fun',
    question: 'Kalau kita ikut acara reality show survival di pulau terpencil, siapa yang bertahan lebih lama?',
  },
  {
    category: 'Fun',
    question: 'Apa lagu karaoke yang paling percaya diri kamu nyanyikan jika kita karaoke berdua?',
  },
  {
    category: 'Fun',
    question: 'Jika kamu bisa menciptakan satu hari libur nasional khusus untuk kita berdua, hari itu dirayakan dengan apa?',
  },
  {
    category: 'Fun',
    question: 'Hal konyol apa yang pernah kamu lakukan demi menarik perhatianku waktu kita masih pendekatan?',
  },
  {
    category: 'Fun',
    question: 'Kalau kita punya hewan peliharaan ajaib yang bisa berbicara, hewan apa itu dan apa yang akan dia katakan tentang kita?',
  },
];

export function createDefaultConversationCards(familyId: string): ConversationCard[] {
  const now = new Date().toISOString();
  return DEFAULT_CONVERSATION_CARD_BANK.map((item) => ({
    id: generateUuid(),
    family_id: familyId,
    category: item.category,
    question: item.question,
    is_discussed: false,
    is_favorite: false,
    created_at: now,
  }));
}

export function ensureFullConversationCardBank(
  familyId: string,
  existingCards: ConversationCard[] = []
): ConversationCard[] {
  const now = new Date().toISOString();
  const seenQuestions = new Set(
    existingCards.map((c) => (c.question || '').trim().toLowerCase())
  );

  const missingCards: ConversationCard[] = [];
  for (const item of DEFAULT_CONVERSATION_CARD_BANK) {
    const normQ = item.question.trim().toLowerCase();
    if (!seenQuestions.has(normQ)) {
      seenQuestions.add(normQ);
      missingCards.push({
        id: generateUuid(),
        family_id: familyId,
        category: item.category,
        question: item.question,
        is_discussed: false,
        is_favorite: false,
        created_at: now,
      });
    }
  }

  return missingCards.length > 0 ? [...existingCards, ...missingCards] : existingCards;
}

export function createDefaultMealPlans(
  familyId: string,
  existing: Array<{
    id: string;
    family_id: string;
    day_name: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
    breakfast: string;
    lunch: string;
    dinner: string;
    notes?: string;
    updated_at: string;
  }> = []
) {
  const now = new Date().toISOString();
  const days: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'> = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ];
  const byDay = new Map(existing.map((d) => [d.day_name, d]));
  return days.map((day) => {
    const found = byDay.get(day);
    if (found) return { ...found, family_id: familyId };
    return {
      id: generateUuid(),
      family_id: familyId,
      day_name: day,
      breakfast: '',
      lunch: '',
      dinner: '',
      notes: '',
      updated_at: now,
    };
  });
}


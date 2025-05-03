// Türkçe aylar için dizi
const turkishMonths = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Türkçe relatif zaman formatlama fonksiyonu
const getRelativeTimeInTurkish = (dateString) => {
  if (!dateString) return "Bilinmeyen Süre";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Bilinmeyen Süre";

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} saniye önce`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} gün önce`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ay önce`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} yıl önce`;
};

// Tarih formatlama fonksiyonu
const formatTurkishDate = (dateString) => {
  if (!dateString) return "Bilinmeyen Tarih";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Bilinmeyen Tarih"; // Geçersiz tarih kontrolü

  const day = date.getDate().toString().padStart(2, "0");
  const month = turkishMonths[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // Relatif zaman
  const relativeTime = getRelativeTimeInTurkish(dateString);

  return `${day} ${month} ${year} ${hours}:${minutes} (${relativeTime})`; // Örn: 27 Nisan 2025 02:10 (2 saat önce)
};

// Talep tablosu sütunları
const columns = [
  {
    header: "Talep No",
    accessor: "id",
  },
  {
    header: "Oluşturulma Tarihi",
    accessor: "create_date",
    Cell: ({ value }) => formatTurkishDate(value), // Türkçe tarih ve relatif zaman
  },
  {
    header: "Yanıtlayan Eczane Sayısı",
    accessor: "response_count",
    Cell: ({ value }) => value || 0 // Null gelirse 0 göster
  }
];

// Talep detay tablosu sütunları
const columns_requestDetail = [
  {
    header: "İlaç No",
    accessor: "medicine_id",
    Cell: ({ value }) => value || "Bilinmeyen ID",
  },
  {
    header: "Miktar",
    accessor: "medicine_qty",
    Cell: ({ value }) => value || "0",
  },
  {
    header: "İlaç İsmi",
    accessor: "medicine.name",
    Cell: ({ value }) => value || "Bilinmeyen İlaç",
  },
];

export { columns, columns_requestDetail };
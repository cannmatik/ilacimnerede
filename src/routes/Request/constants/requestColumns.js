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

// Ana tablo sütunları
const columns = [
  {
    headerName: "Talep No",
    header: "Talep No",
    field: "id",
    accessor: "id",
    flex: 1,
  },
  {
    headerName: "Oluşturulma Tarihi",
    header: "Oluşturulma Tarihi",
    field: "create_date",
    accessor: "create_date",
    flex: 2,
    renderCell: (params) => formatTurkishDate(params.value), // Türkçe tarih ve relatif zaman
    Cell: ({ value }) => formatTurkishDate(value),
  },
  {
    headerName: "Yanıtlayan Eczane Sayısı",
    header: "Yanıtlayan Eczane Sayısı",
    field: "response_count",
    accessor: "response_count",
    flex: 1,
    renderCell: (params) => params.value || 0, // Null gelirse 0 göster
    Cell: ({ value }) => value || 0,
  },
];

// Talep detay tablosu sütunları
const columns_requestDetail = [
  {
    headerName: "İlaç No",
    header: "İlaç No",
    field: "medicine_id",
    accessor: "medicine_id",
    flex: 1,
    renderCell: (params) => params.value || "Bilinmeyen ID",
    Cell: ({ value }) => value || "Bilinmeyen ID",
  },
  {
    headerName: "Miktar",
    header: "Miktar",
    field: "medicine_qty",
    accessor: "medicine_qty",
    flex: 1,
    renderCell: (params) => params.value || "0",
    Cell: ({ value }) => value || "0",
  },
  {
    headerName: "İlaç İsmi",
    header: "İlaç İsmi",
    field: "medicineName",
    accessor: "medicine.name",
    flex: 2,
    valueGetter: (value, row) => row.medicine?.name || "Bilinmeyen İlaç",
    Cell: ({ row }) => row.medicine?.name || "Bilinmeyen İlaç",
  },
];

export { columns, columns_requestDetail, formatTurkishDate };
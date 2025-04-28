// Türkçe aylar için dizi
const turkishMonths = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

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

  return `${day} ${month} ${year} ${hours}:${minutes}`; // Örn: 27 Nisan 2025 02:10
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
    Cell: ({ value }) => formatTurkishDate(value), // Türkçe tarih formatı
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
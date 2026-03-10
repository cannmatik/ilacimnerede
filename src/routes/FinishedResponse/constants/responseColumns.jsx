// responseColumns.jsx
// Removed frstyle.scss import
import { CheckCircle, Cancel } from "@mui/icons-material";

// Türkçe aylar için dizi
const turkishMonths = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Tarih formatlama fonksiyonu
const formatTurkishDate = (dateString) => {
  if (!dateString) return "Bilinmeyen Tarih";
  
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Bilinmeyen Tarih"; // Geçersiz tarih kontrolü
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = turkishMonths[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day} ${month} ${year} ${hours}:${minutes}`;
};

// Ana tablo sütunları
const columns = [
  {
    headerName: "Talep No",
    header: "Talep No",
    field: "request_id",
    accessor: "request_id",
    flex: 1,
  },
  {
    headerName: "Oluşturulma Tarihi",
    header: "Oluşturulma Tarihi",
    field: "create_date",
    accessor: "create_date",
    flex: 2,
    renderCell: (params) => formatTurkishDate(params.value), // Türkçe tarih formatı
    Cell: ({ value }) => formatTurkishDate(value),
  },
];

// Detay tablo sütunları
const columns_requestDetail = [
  {
    headerName: "Barkod No",
    header: "Barkod No",
    field: "medicine_id",
    accessor: "medicine_id",
    flex: 1,
  },
  {
    headerName: "Adet",
    header: "Adet",
    field: "medicine_qty",
    accessor: "medicine_qty",
    flex: 1,
  },
  {
    headerName: "İlaç Adı",
    header: "İlaç Adı",
    field: "medicineName",
    accessor: "medicine.name",
    flex: 2,
    valueGetter: (value, row) => row.medicine?.name || "Bilinmeyen İlaç",
    Cell: ({ row }) => row.medicine?.name || "Bilinmeyen İlaç",
  },
  {
    headerName: "Durum",
    header: "Durum",
    field: "status",
    accessor: "status",
    flex: 1,
    renderCell: (params) => {
      const currentStatus = params.row.status;
      const icon = currentStatus === true ? (
        <CheckCircle
          sx={{
            fontSize: { xs: 14, sm: 16 }, // Mobil için 14px, masaüstü için 16px
            color: "#4caf50", // Yeşil
            verticalAlign: "middle",
          }}
        />
      ) : currentStatus === false ? (
        <Cancel
          sx={{
            fontSize: { xs: 14, sm: 16 }, // Mobil için 14px, masaüstü için 16px
            color: "#ff4d4f", // Kırmızı
            verticalAlign: "middle",
          }}
        />
      ) : (
        "Bilinmeyen Durum"
      );
      return icon;
    },
    Cell: ({ row }) => {
      const currentStatus = row.status;
      const icon = currentStatus === true ? (
        <CheckCircle
          sx={{
            fontSize: { xs: 14, sm: 16 },
            color: "#4caf50",
            verticalAlign: "middle",
          }}
        />
      ) : currentStatus === false ? (
        <Cancel
          sx={{
            fontSize: { xs: 14, sm: 16 },
            color: "#ff4d4f",
            verticalAlign: "middle",
          }}
        />
      ) : (
        "Bilinmeyen Durum"
      );
      return icon;
    },
  },
];

export { columns, columns_requestDetail };
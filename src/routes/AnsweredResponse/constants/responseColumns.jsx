// responseColumns.jsx
import "../arstyle.scss";
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
    console.error("Geçersiz tarih:", dateString);
    return "Bilinmeyen Tarih"; // Geçersiz tarih kontrolü
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = turkishMonths[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const formattedDate = `${day} ${month} ${year} ${hours}:${minutes}`; // Örn: 15 Ekim 2023 14:30
  console.log("responseColumns.jsx - Formatlanmış tarih:", formattedDate);
  return formattedDate;
};

// Ana tablo sütunları
const columns = [
  {
    field: "request_id",
    headerName: "Talep No",
    header: "Talep No",
    accessor: "request_id",
    flex: 1,
  },
  {
    field: "create_date",
    headerName: "Oluşturulma Tarihi",
    header: "Oluşturulma Tarihi",
    accessor: "create_date",
    flex: 2,
    renderCell: (params) => formatTurkishDate(params.value),
    Cell: ({ value }) => formatTurkishDate(value), // Türkçe tarih formatı
  },
];

// Detay tablo sütunları
const columns_requestDetail = [
  {
    field: "medicine_id",
    headerName: "Barkod No",
    header: "Barkod No",
    accessor: "medicine_id",
    flex: 1,
  },
  {
    field: "medicine_qty",
    headerName: "Adet",
    header: "Adet",
    accessor: "medicine_qty",
    flex: 1,
  },
  {
    field: "medicineName",
    headerName: "İlaç İsmi",
    header: "İlaç İsmi",
    accessor: "medicine.name",
    flex: 2,
    valueGetter: (value, row) => row.medicine?.name || "Bilinmeyen İlaç",
    Cell: ({ row }) => row.medicine?.name || "Bilinmeyen İlaç",
  },
  {
    field: "status",
    headerName: "Durum",
    header: "Durum",
    accessor: "status",
    flex: 1,
    renderCell: (params) => {
      const currentStatus = params.row.status;
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
    // TRUE -> yeşil tik (CheckCircle), FALSE -> kırmızı çarpı (Cancel)
    Cell: ({ row }) => {
      console.log("Durum sütunu - row:", row);
      const currentStatus = row.status; // row.original yerine row.status kullanıldı
      console.log("Durum sütunu - currentStatus:", currentStatus);
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
        "Bilinmeyen Durum" // status undefined veya beklenmeyen bir değer ise
      );
      console.log("Durum sütunu - render edilen ikon:", icon);
      return icon;
    },
  },
];

export { columns, columns_requestDetail };
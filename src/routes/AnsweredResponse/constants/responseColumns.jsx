// responseColumns.jsx
import "../arstyle.scss";

// Ana tablo sütunları
const columns = [
  {
    header: "Talep No",
    accessor: "request_id",
  },
  {
    header: "Oluşturulma Tarihi",
    accessor: "create_date",
  },
];

// Detay tablo sütunları
const columns_requestDetail = [
  {
    header: "Barkod No",
    accessor: "medicine_id",
  },
  {
    header: "Adet",
    accessor: "medicine_qty",
  },
  {
    header: "İlaç İsmi",
    accessor: "medicine.name",
  },
  {
    header: "Durum",
    accessor: "status",
    // TRUE -> yeşil tik, FALSE -> kırmızı çarpı
    cell: ({ row }) => {
      const currentStatus = row.original.status;
      return (
        <div>
          {currentStatus
            ? <span className="answered-icon answered-tick-icon" />
            : <span className="answered-icon answered-cross-icon" />
          }
        </div>
      );
    },
  },
];

export { columns, columns_requestDetail };

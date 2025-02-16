// responseColumns.jsx
import "../style.scss";

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
    cell: ({ row }) => (
      <div>
        {row.original.status ? (
          <span className="answered-icon answered-tick-icon"></span>
        ) : (
          <span className="answered-icon answered-cross-icon"></span>
        )}
      </div>
    ),
  },
];

export { columns, columns_requestDetail };

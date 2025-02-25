import "../frstyle.scss";

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

// Aşağıdaki 'status' sütunu TRUE => tik, FALSE => çarpı ikonu kullanır
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
    header: "İlaç Adı",
    accessor: "medicine.name",
  },
  {
    header: "Durum",
    accessor: "status",
    cell: ({ row }) => {
      const st = row.original.status; // st: true/false
      return (
        <div>
          {st ? (
            <span className="icon tick-icon"></span>
          ) : (
            <span className="icon cross-icon"></span>
          )}
        </div>
      );
    },
  },
];

export { columns, columns_requestDetail };

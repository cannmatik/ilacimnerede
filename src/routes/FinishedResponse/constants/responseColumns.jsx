import { INCheckbox } from "@components";
import "../style.scss";

const columns = [
  {
    header: "Request Id",
    accessor: "request_id",
  },
  {
    header: "Create Date",
    accessor: "create_date",
  },
];

const columns_requestDetail = [
  {
    header: "Medicine Id",
    accessor: "medicine_id",
  },
  {
    header: "Medicine Quantity",
    accessor: "medicine_qty",
  },
  {
    header: "Medicine Name",
    accessor: "medicine.name",
  },
  {
    header: "Durum",
    accessor: "status",
    cell: ({ row }) => <div>{row.original.status ? <span className="icon tick-icon"></span> : <span className="icon cross-icon"></span>}</div>,
  },
];

export { columns, columns_requestDetail };

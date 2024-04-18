const columns = [
  {
    header: "Request Id",
    accessor: "id",
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
];

export { columns, columns_requestDetail };

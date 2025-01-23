import moment from 'moment';
import 'moment/locale/tr';

const columns = [
  {
    header: "Talep No",
    accessor: "id",
  },
  {
    header: "Oluşturulma Tarihi",
    accessor: "create_date",
    Cell: ({ value }) => {
      return moment(value).locale('tr').format('DD.MM.YYYY HH:mm');
    }
  },
];
const columns_requestDetail = [
  {
    header: "İlaç No",
    accessor: "medicine_id",
  },
  {
    header: "İlaç Adedi",
    accessor: "medicine_qty",
  },
  {
    header: "İlaç İsmi",
    accessor: "medicine.name",
  },
  {
    header: "Mevcut",
    accessor: "status",
  },
];

export { columns, columns_requestDetail };
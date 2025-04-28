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
      return moment(value).format('DD MMMM YYYY HH:mm'); // 📌 Türkçe tarih formatı
    }      
  },
  {
    header: "Yanıtlayan Eczane Sayısı",  // 📌 Yeni sütun ekledik
    accessor: "response_count",
    Cell: ({ value }) => value || 0 // Eğer null gelirse 0 göster
  }
];

const columns_requestDetail = [
  {
    header: "İlaç No",
    accessor: "medicine_id",
  },
  {
    header: "Miktar",
    accessor: "medicine_qty",
  },
  {
    header: "İlaç İsmi",
    accessor: "medicine.name",
  },
];

export { columns, columns_requestDetail };
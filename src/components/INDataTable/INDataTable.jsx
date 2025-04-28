import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./style.scss";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  MenuItem,
  Select,
  Paper,
  Box,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";
import { Clear as ClearIcon } from "@mui/icons-material";
import dayjs from "dayjs";

// İç içe nesneler için değer alma (örneğin, medicine.name)
const getNestedValue = (obj, path) => {
  try {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  } catch (error) {
    console.error("getNestedValue hatası:", error, "obj:", obj, "path:", path);
    return null;
  }
};

// MUI Table bileşeniyle tablo oluştur
function INDataTable({
  data,
  columns,
  checkboxed,
  setSelectedRows,
  unSelectAllOnClick,
  unSelectAllOnTabChange,
  selectedRequest,
  onRowClick,
  rowHoverStyle,
  isLoading,
  bufferedMedicines,
  deleteFromResponseBuffer,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState(
    columns[0]?.accessor || ""
  );
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [dateFilter, setDateFilter] = useState(null); // Tarih filtresi için state
  const pharmacy_id = useSelector(selectUserPharmacyId);

  // Veri ve sütun logları (hata ayıklama için)
  useEffect(() => {
    console.log("INDataTable - veri:", data);
    console.log("INDataTable - sütunlar:", columns);
    console.log("INDataTable - checkboxed:", checkboxed);
    console.log("INDataTable - bufferedMedicines:", bufferedMedicines);
    console.log("INDataTable - globalFilter:", globalFilter);
    console.log("INDataTable - dateFilter:", dateFilter);
  }, [data, columns, checkboxed, bufferedMedicines, globalFilter, dateFilter]);

  // Seçili satırları güncelle
  useEffect(() => {
    const checkedRows = data.filter((row) => selectedRowIds.includes(row.id));
    console.log("Seçili satırlar güncellendi:", checkedRows);
    setSelectedRows(checkedRows);
  }, [selectedRowIds, data, setSelectedRows]);

  // unSelectAllOnTabChange değiştiğinde seçimi sıfırla
  useEffect(() => {
    setSelectedRowIds([]);
  }, [unSelectAllOnTabChange]);

  // bufferedMedicines'e göre satırları önceden seç
  useEffect(() => {
    if (bufferedMedicines && checkboxed) {
      const preSelectedIds = data
        .filter((row) =>
          bufferedMedicines.some((item) => item.medicine_id === row.medicine_id)
        )
        .map((row) => row.id);
      console.log("Önceden seçilen satır ID'leri:", preSelectedIds);
      setSelectedRowIds(preSelectedIds);
    }
  }, [bufferedMedicines, data, checkboxed]);

  // Filtreleme mantığı
  const filteredData = data.filter((row) => {
    // Metin bazlı arama
    if (globalFilter && !dateFilter) {
      const value = getNestedValue(row, selectedFilterColumn);
      return value?.toString().toLowerCase().includes(globalFilter.toLowerCase());
    }

    // Tarih bazlı arama (create_date sütunu için)
    if (dateFilter && selectedFilterColumn === "create_date") {
      const selectedDate = dayjs(dateFilter).format("YYYY-MM-DD");
      const rowDate = dayjs(row.create_date).format("YYYY-MM-DD");
      console.log("Tarih filtresi - selectedDate:", selectedDate, "rowDate:", rowDate);
      return rowDate === selectedDate;
    }

    // Filtre yoksa tüm veriyi döndür
    return true;
  });

  // Sıralama mantığı
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = getNestedValue(a, sortConfig.key);
    const bValue = getNestedValue(b, sortConfig.key);
    if (!aValue || !bValue) return 0;
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Sıralama işleyici
  const handleSort = (key) => {
    console.log("Sıralama tetiklendi:", key);
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Satır tıklama işleyici
  const handleRowClick = (row) => {
    console.log("handleRowClick - row:", row);
    if (checkboxed) {
      toggleRowSelection(row.id);
    } else {
      onRowClick(row);
    }
  };

  // Checkbox seçimi işleyici
  const toggleRowSelection = (id) => {
    setSelectedRowIds((prev) => {
      const isSelected = prev.includes(id);
      console.log("toggleRowSelection - id:", id, "isSelected:", isSelected);
      if (!isSelected) {
        return [...prev, id];
      }
      return prev.filter((rowId) => rowId !== id);
    });
  };

  // Tarih filtresi sıfırlama işleyici
  const clearDateFilter = () => {
    setDateFilter(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return <Box sx={{ p: 2, textAlign: "center" }}>Veri bulunamadı.</Box>;
  }

  return (
    <Box className="ilacimNerede-data-table-container">
      {/* Filtreleme alanı */}
      <Box className="table-filter-container">
        <Select
          value={selectedFilterColumn}
          onChange={(e) => {
            setSelectedFilterColumn(e.target.value);
            setGlobalFilter(""); // Sütun değiştiğinde metin filtresini sıfırla
            setDateFilter(null); // Sütun değiştiğinde tarih filtresini sıfırla
          }}
          size="small"
          className="table-filter-select"
        >
          {columns.map((col) => (
            <MenuItem key={col.accessor} value={col.accessor}>
              {col.header}
            </MenuItem>
          ))}
        </Select>
        {selectedFilterColumn === "create_date" ? (
          <Box display="flex" alignItems="center" gap={1}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={dateFilter}
                onChange={(newValue) => setDateFilter(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    className="table-filter-textfield"
                    placeholder="Tarih Seçin"
                  />
                )}
                format="DD/MM/YYYY"
              />
            </LocalizationProvider>
            {dateFilter && (
              <IconButton onClick={clearDateFilter} size="small">
                <ClearIcon />
              </IconButton>
            )}
          </Box>
        ) : (
          <TextField
            placeholder="Tabloda Ara..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            size="small"
            className="table-filter-textfield"
          />
        )}
      </Box>

      {/* Tablo */}
      <TableContainer component={Paper} sx={{ boxShadow: 0, border: "1px solid #dde1e7", borderRadius: 2 }}>
        <Table stickyHeader sx={{ tableLayout: "auto" }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.accessor}
                  onClick={() => handleSort(column.accessor)}
                  sx={{
                    backgroundColor: "#f4f7fb",
                    fontWeight: 600,
                    fontSize: { xs: 12, sm: 14 },
                    color: "#333",
                    padding: { xs: "6px 8px", sm: "10px 15px" },
                    border: "1px solid #dde1e7",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#e9eff6",
                      borderColor: "#a7b1c2",
                    },
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    maxWidth: { xs: 100, sm: 150 },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  data-column={column.accessor}
                >
                  {column.header}
                  {sortConfig.key === column.accessor &&
                    (sortConfig.direction === "asc" ? " 🔼" : " 🔽")}
                </TableCell>
              ))}
              {checkboxed && (
                <TableCell
                  sx={{
                    backgroundColor: "#f4f7fb",
                    fontWeight: 600,
                    fontSize: { xs: 12, sm: 14 },
                    color: "#333",
                    padding: { xs: "6px 8px", sm: "10px 15px" },
                    border: "1px solid #dde1e7",
                    textAlign: "center",
                  }}
                >
                  Mevcut
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => handleRowClick(row)}
                onDoubleClick={() => toggleRowSelection(row.id)}
                className={selectedRowIds.includes(row.id) && checkboxed ? "selected-row" : checkboxed ? "unselected-row" : ""}
                sx={{
                  cursor: "pointer",
                  backgroundColor: selectedRowIds.includes(row.id) && checkboxed
                    ? "#25b597"
                    : !selectedRowIds.includes(row.id) && checkboxed
                    ? "#f8d7da"
                    : "inherit",
                  "&:hover": {
                    backgroundColor: rowHoverStyle.background
                      ? "#f0f4f8"
                      : "inherit",
                  },
                }}
              >
                {columns.map((column) => {
                  let cellContent;
                  if (column.Cell) {
                    const cellResult = column.Cell({ row, value: getNestedValue(row, column.accessor) });
                    cellContent = cellResult !== undefined && cellResult !== null ? cellResult : "-";
                  } else {
                    cellContent = getNestedValue(row, column.accessor) || "-";
                  }
                  console.log(`Hücre içeriği - column.accessor: ${column.accessor}, cellContent:`, cellContent);
                  return (
                    <TableCell
                      key={column.accessor}
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        padding: { xs: "6px 8px", sm: "8px 15px" },
                        border: rowHoverStyle.border
                          ? "1px solid #dde1e7"
                          : "none",
                        color: selectedRowIds.includes(row.id) && checkboxed ? "#fff" : "#333",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        maxWidth: { xs: 100, sm: 150 },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      data-column={column.accessor}
                    >
                      {cellContent}
                    </TableCell>
                  );
                })}
                {checkboxed && (
                  <TableCell
                    sx={{
                      fontSize: { xs: 12, sm: 14 },
                      padding: { xs: "6px 8px", sm: "8px 15px" },
                      border: rowHoverStyle.border
                        ? "1px solid #dde1e7"
                        : "none",
                      textAlign: "center",
                    }}
                  >
                    <Checkbox
                      checked={selectedRowIds.includes(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      className={selectedRowIds.includes(row.id) ? "selected-row-checkbox" : "unselected-row-checkbox"}
                      sx={{
                        color: "#333 !important",
                        "&.Mui-checked": {
                          color: "#333 !important",
                        },
                      }}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

INDataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})),
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  checkboxed: PropTypes.bool,
  setSelectedRows: PropTypes.func,
  unSelectAllOnClick: PropTypes.bool,
  unSelectAllOnTabChange: PropTypes.string,
  checkedActionsBar: PropTypes.node,
  onRowClick: PropTypes.func,
  rowHoverStyle: PropTypes.shape({
    background: PropTypes.bool,
    border: PropTypes.bool,
  }),
  isLoading: PropTypes.bool,
  bufferedMedicines: PropTypes.arrayOf(
    PropTypes.shape({
      medicine_id: PropTypes.number,
      medicine_name: PropTypes.string,
    })
  ),
  deleteFromResponseBuffer: PropTypes.func,
};

INDataTable.defaultProps = {
  data: [],
  checkboxed: false,
  setSelectedRows: () => {},
  unSelectAllOnClick: false,
  unSelectAllOnTabChange: "",
  checkedActionsBar: null,
  onRowClick: () => {},
  rowHoverStyle: {
    background: true,
    border: true,
  },
  isLoading: false,
  bufferedMedicines: [],
  deleteFromResponseBuffer: () => {},
};

export default INDataTable;
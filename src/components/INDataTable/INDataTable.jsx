import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./style.scss";
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox, Input, Select } from "antd";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";

// Helper to create column definitions
const columnHelper = createColumnHelper();

// Checkbox column definition
const checkboxObj = [
  {
    accessor: "checkbox",
    id: "checkbox",
    header: "Mevcut",
    cell: ({ row, deleteFromResponseBuffer }) => {
      const pharmacy_id = useSelector(selectUserPharmacyId);
      return (
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          checked={row.getIsSelected()}
          onChange={(e) => {
            const isChecked = e.target.checked;
            console.log("Checkbox change:", {
              rowId: row.id,
              isChecked,
              medicine_id: row.original.medicine_id,
              pharmacy_id,
            });
            row.toggleSelected(isChecked);
            if (!isChecked && row.original.medicine_id && pharmacy_id) {
              console.log("Triggering deleteFromResponseBuffer:", {
                pharmacy_id,
                medicine_id: row.original.medicine_id,
              });
              try {
                deleteFromResponseBuffer({
                  pharmacy_id,
                  medicine_id: row.original.medicine_id,
                });
              } catch (error) {
                console.error("Failed to delete from response_buffer:", error);
              }
            }
          }}
        />
      );
    },
  },
];

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
  const [columnFilters, setColumnFilters] = useState([]);

  // Place checkbox column on the right if checkboxed is true
  const $columns = checkboxed ? [...columns, ...checkboxObj] : columns;

  // Map columns to react-table format
  const tableColumns = $columns.map((column) =>
    columnHelper.accessor(column.accessor, {
      ...column,
      id: column.id || column.accessor,
      filterFn: column.filterFn || "includesString",
      cell: column.cell || ((info) => info.getValue()),
    })
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
  });

  const {
    getHeaderGroups,
    getRowModel,
    getSelectedRowModel,
    toggleAllPageRowsSelected,
  } = table;

  // Update selected rows
  useEffect(() => {
    const checkedRows = getSelectedRowModel().rows.map((item) => item.original);
    console.log("Selected rows updated:", checkedRows);
    setSelectedRows(checkedRows);
  }, [getSelectedRowModel().rows, setSelectedRows]);

  // Clear selection when unSelectAllOnTabChange changes
  useEffect(() => {
    toggleAllPageRowsSelected(false);
  }, [unSelectAllOnTabChange, toggleAllPageRowsSelected]);

  // Pre-select rows based on bufferedMedicines
  useEffect(() => {
    if (bufferedMedicines && checkboxed) {
      getRowModel().rows.forEach((row) => {
        if (bufferedMedicines.some((item) => item.medicine_id === row.original.medicine_id)) {
          row.toggleSelected(true);
        }
      });
    }
  }, [bufferedMedicines, data, getRowModel]);

  // Update column filters based on global filter
  useEffect(() => {
    if (globalFilter) {
      setColumnFilters([{ id: selectedFilterColumn, value: globalFilter }]);
    } else {
      setColumnFilters([]);
    }
  }, [globalFilter, selectedFilterColumn]);

  const handleRowClick = (row) => {
    if (checkboxed) {
      row.toggleSelected();
    } else {
      onRowClick(row);
    }
  };

  return (
    <div className="ilacimNerede-data-table-container">
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <Select
          style={{ width: "200px" }}
          value={selectedFilterColumn}
          onChange={setSelectedFilterColumn}
        >
          {columns.map((col) => (
            <Select.Option key={col.accessor} value={col.accessor}>
              {col.header}
            </Select.Option>
          ))}
        </Select>
        <Input
          placeholder="Tabloda Ara..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            {getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={classNames({
                      "sortable-header": true,
                      "left-corner": index === 0,
                      "right-corner": index === headerGroup.headers.length - 1,
                      [header.column.columnDef.headerClassName]:
                        header.column.columnDef.headerClassName !== undefined,
                    })}
                    style={header.column.columnDef.headerStyle}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getIsSorted()
                      ? header.column.getIsSorted() === "desc"
                        ? " 🔽"
                        : " 🔼"
                      : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}
                onDoubleClick={() => row.toggleSelected()}
                className={classNames({
                  "selected-row": row.getIsSelected() && checkboxed,
                  "unselected-row": !row.getIsSelected() && checkboxed,
                  "no-hover-bg": !rowHoverStyle.background,
                  "no-hover-border": !rowHoverStyle.border,
                })}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={classNames({
                      "left-corner": index === 0,
                      "right-corner":
                        index === row.getVisibleCells().length - 1,
                      [typeof cell.column.columnDef.cellClassName === "function"
                        ? cell.column.columnDef.cellClassName(
                            cell.row.original
                          )
                        : cell.column.columnDef.cellClassName]:
                        cell.column.columnDef.cellClassName !== undefined,
                      "show-on-hover": cell.column.columnDef.showOnRowHover,
                    })}
                    style={
                      typeof cell.column.columnDef.cellStyle === "function"
                        ? cell.column.columnDef.cellStyle(cell.row.original)
                        : cell.column.columnDef.cellStyle
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, {
                      ...cell.getContext(),
                      deleteFromResponseBuffer,
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
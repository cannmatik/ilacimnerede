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

const columnHelper = createColumnHelper();

const checkboxObj = [
  {
    accessor: "checkbox",
    header: "Mevcut",
    cell: ({ row }) => (
      <Checkbox
        onClick={(e) => e.stopPropagation()} // Checkbox tıklamasını engellemek için
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
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
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState(columns[0]?.accessor || "");

  const $columns = checkboxed ? [...columns, ...checkboxObj] : columns;

  const table = useReactTable({
    data,
    columns: $columns.map((column) =>
      columnHelper.accessor(column.accessor, { ...column })
    ),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const {
    getHeaderGroups,
    getRowModel,
    getSelectedRowModel,
    toggleAllPageRowsSelected,
  } = table;

  useEffect(() => {
    const checkedRows = getSelectedRowModel().rows.map((item) => item.original);
    setSelectedRows(checkedRows);
  }, [getSelectedRowModel().rows]);

  useEffect(() => {
    toggleAllPageRowsSelected(false);
  }, [unSelectAllOnTabChange]);

  const handleRowClick = (row) => {
    if (checkboxed) {
      row.toggleSelected(); // Checkbox varsa satırı seç
    } else {
      onRowClick(row); // Yoksa satır seçimini çalıştır
    }
  };

  return (
    <div className="ilacimNerede-data-table-container">
      {/* 🔎 Filtreleme Alanı */}
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
                    onClick={header.column.getToggleSortingHandler()} // Sıralama için tıklanabilir başlıklar
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
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === "desc" ? " 🔽" : " 🔼"
                    ) : null}
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
                onDoubleClick={() => row.toggleSelected()} // Çift tıklama ile seçim yapma
                className={classNames({
                  "selected-row": row.getIsSelected() && checkboxed, // Seçili satırlar checkbox varsa renk değiştirir
                  "unselected-row": !row.getIsSelected() && checkboxed, // Seçilmeyen satırlar
                  "no-hover-bg": !rowHoverStyle.background,
                  "no-hover-border": !rowHoverStyle.border,
                })}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={classNames({
                      "left-corner": index === 0,
                      "right-corner": index === row.getVisibleCells().length - 1,
                      [typeof cell.column.columnDef.cellClassName === "function"
                        ? cell.column.columnDef.cellClassName(cell.row.original)
                        : cell.column.columnDef.cellClassName]:
                        cell.column.columnDef.cellClassName !== undefined,
                      "show-on-hover": cell.column.columnDef.showOnRowHover,
                    })}
                    style={typeof cell.column.columnDef.cellStyle === "function"
                        ? cell.column.columnDef.cellStyle(cell.row.original)
                        : cell.column.columnDef.cellStyle
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  isLoading: PropTypes.bool.isRequired,
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
};

export default INDataTable;

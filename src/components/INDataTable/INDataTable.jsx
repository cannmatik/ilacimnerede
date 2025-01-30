import { useEffect } from "react";
import PropTypes from "prop-types";
import "./style.scss";
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox } from "antd";
import classNames from "classnames";

const columnHelper = createColumnHelper();

const checkboxObj = [
  {
    accessor: "checkbox",
    header: "Mevcut",
    cell: ({ row }) => (
      <Checkbox
        onClick={(e) => e.stopPropagation()}  // Checkbox tıklamasını engellemek için
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
  const $columns = checkboxed ? [...columns, ...checkboxObj] : columns;

  const table = useReactTable({
    data,
    columns: $columns.map((column) =>
      columnHelper.accessor(column.accessor, { ...column })
    ),
    getCoreRowModel: getCoreRowModel(),
  });

  const {
    getHeaderGroups,
    getRowModel,
    getSelectedRowModel,
    toggleAllPageRowsSelected,
  } = table;

  const checkedRows = JSON.stringify(
    getSelectedRowModel().rows.map((item) => item.original)
  );

  useEffect(() => {
    const $checkedRows = JSON.parse(checkedRows);
    setSelectedRows($checkedRows);
  }, [checkedRows]);

  useEffect(() => {
    toggleAllPageRowsSelected(false);
  }, [unSelectAllOnTabChange]);

  // Row click handler modification based on checkbox availability
  const handleRowClick = (row) => {
    if (checkboxed) {
      // Row seçimi sadece checkbox tablosu için yapılır
      row.toggleSelected();
    } else {
      // Eğer checkbox yoksa, onRowClick çalıştırılır (yani normal tıklama işlevi)
      onRowClick(row);
    }
  };

  return (
    <div className="ilacimNerede-data-table-container">
      <div className="table-wrapper">
        <table>
          <thead>
            {getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={classNames({
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
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}  // Row selection based on checkbox availability
                onDoubleClick={() => row.toggleSelected()}
                className={classNames({
                  'selected-row': row.getIsSelected() && checkboxed, // Seçili satırlar sadece checkbox varsa renk değiştirir
                  'unselected-row': !row.getIsSelected() && checkboxed, // Seçilmeyen satırlar
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

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
// import NoDataOrLoading from "./NoDataOrLoading";

const columnHelper = createColumnHelper();

const checkboxObj = [
  {
    accessor: "checkbox",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onClick={(e) => e.stopPropagation()}
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
  checkedActionsBar,
  onRowClick,
  rowHoverStyle,
  isLoading,
}) {
  const $columns = checkboxed ? [...checkboxObj, ...columns] : columns;

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

  // Setting all checkboxes to unchecked state
  useEffect(() => {
    toggleAllPageRowsSelected(false);
  }, [unSelectAllOnClick, unSelectAllOnTabChange]);

  const isAnyRowSelected = getSelectedRowModel().rows.length > 0;

  return (
    <div className="ilacimNerede-data-table-container">
      {isAnyRowSelected && (
        <div className="ilacimNerede-table-action-bar">
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
          {checkedActionsBar}
        </div>
      )}
      <table>
        {!isAnyRowSelected && (
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
        )}
        <tbody>
          {getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={classNames({
                "no-hover-bg": !rowHoverStyle.background,
                "no-hover-border": !rowHoverStyle.border,
              })}
              onClick={() => onRowClick(row)}
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
                  style={
                    typeof cell.column.columnDef.cellStyle === "function"
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
      {/* <NoDataOrLoading isLoading={isLoading} data={data} /> */}
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
    border: false,
  },
};

export default INDataTable;

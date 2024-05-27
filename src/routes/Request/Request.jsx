import React, { useEffect, useState } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";
import { before, next } from "@assets";
import { Checkbox } from "antd";
import {
  useGetRequest,
  useGetRequestDetails,
  useResponseRequest,
} from "./queries";
import { columns_requestDetail, columns } from "./constants/requestColumns";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";

function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState();
  const [selectedRows, setSelectedRows] = useState([]);
  const pharmacyId = useSelector(selectUserPharmacyId);

  const { data: requests, isLoading } = useGetRequest();
  // console.log(selectedRequest, "selectedRequest");
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);

  // console.log(requests, "requests");
  // console.log(requestDetail, "requestDetail");

  const { mutate: responseRequestMutation } = useResponseRequest();

  // console.log(getCoreRowModel, "getCoreRowModel;");

  // const checkedRows = JSON.stringify(
  //   getSelectedRowModel().getSelectedRowModel().flatRows
  // );

  const openPrevRequest = () => {
    // console.log(requests.findIndex((item) => item.id === selectedRequest?.id));

    if (requests?.findIndex((item) => item.id === selectedRequest?.id) > 0) {
      setSelectedRequest(
        requests[
          requests?.findIndex((item) => item.id === selectedRequest?.id) - 1
        ]
      );
    } else {
      setIsPrevDisabled(true);
    }
  };

  const openNextRequest = () => {
    if (
      requests?.findIndex((item) => item.id === selectedRequest?.id) <
      requests?.length - 1
    ) {
      setSelectedRequest(
        requests[
          requests?.findIndex((item) => item.id === selectedRequest?.id) + 1
        ]
      );
    } else {
      setIsNextDisabled(true);
    }
  };

  useEffect(() => {
    if (requests?.findIndex((item) => item.id === selectedRequest?.id) > 0) {
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
    if (
      requests?.findIndex((item) => item.id === selectedRequest?.id) <
      requests?.length - 1
    ) {
      setIsNextDisabled(false);
    } else {
      setIsNextDisabled(true);
    }
  }, [selectedRequest]);

  const handleConfirmRequest = async () => {
    debugger;
    const selectedRowsIds = selectedRows.map(({ id }) => id);
    const checkedRequestDetails = selectedRows.map(({ id }) => ({
      request_item_id: id,
      status: true,
    }));

    const uncheckedRequestDetails = requestDetail
      .filter(({ id }) => !selectedRowsIds.includes(id))
      .map(({ id }) => ({
        request_item_id: id,
        status: false,
      }));

    const response = {
      request_id: selectedRequest?.id,
      pharmacy_id: pharmacyId,
      create_date: Date.now,
    };
    const finalData = [...checkedRequestDetails, ...uncheckedRequestDetails];

    responseRequestMutation({ finalData, response });
  };

  // console.log(selectedRequest, "selectedRequest;");

  // console.log(selectedRows, "selectedRows;");

  return (
    <>
      <Row style={{ marginLeft: "25px" }}>Açık Talepler</Row>
      <br></br>
      <Row>
        <Col xs={6}>
          <INDataTable
            data={requests || []}
            columns={columns || []}
            rowHoverStyle={{ border: true }}
            setSelectedRows={setSelectedRows}
            onRowClick={(row) => {
              setSelectedRequest(row.original);
            }}
            isLoading={isLoading}
          />
        </Col>
        <Col xs={6} className="request-table">
          <div className="request-info">
            <span>Request Number {selectedRequest?.id}</span>
            <span>REÇETE NO: {selectedRequest?.prescript_no}</span>
            <span>TC NO: {selectedRequest?.tc_no}</span>
          </div>
          <INDataTable
            data={requestDetail || []}
            // columns={[...columns_requestDetail, ...checkboxObj] || []}
            columns={columns_requestDetail || []}
            rowHoverStyle={{ border: true }}
            checkboxed={true}
            selectedRequest={selectedRequest}
            setSelectedRows={setSelectedRows}
            unSelectAllOnTabChange={selectedRequest}
          />
          <div className="request-accept-footer">
            <img
              src={before}
              className={`prev-or-next ${
                !isPrevDisabled ? "enabled" : "disabled"
              }`}
              onClick={() => {
                openPrevRequest();
              }}
            ></img>
            <INButton
              flex={true}
              onClick={handleConfirmRequest}
              text="Onayla"
            ></INButton>
            <img
              src={next}
              className={`prev-or-next ${
                !isNextDisabled ? "enabled" : "disabled"
              }`}
              onClick={() => {
                openNextRequest();
              }}
            ></img>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Request;

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

function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState();
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: requests, isLoading } = useGetRequest();
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);
  // Inside your component or function where you want to use responseRequest
  const { mutate: responseRequestMutation } = useResponseRequest();

  // console.log(getCoreRowModel, "getCoreRowModel;");

  // const checkedRows = JSON.stringify(
  //   getSelectedRowModel().getSelectedRowModel().flatRows
  // );

  const openPrevRequest = () => {
    console.log(requests.findIndex((item) => item.id === selectedRequest?.id));

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

  const confirmRequest = async () => {
    if (!selectedRequest || !selectedRows || !requestDetail) {
      console.log("One of the required parameters is missing.");
      return;
    }

    const checkedRequestDetails = selectedRows.map((item) => {
      return {
        id: item.request_id,
        position_no: item.position_no,
        medicine_id: item.medicine_id,
        medicine_qty: item.medicine_qty,
        status: true,
      };
    });

    const unCheckedRequestDetails = requestDetail
      .filter((item) => {
        return !selectedRows.some(
          (selectedRow) =>
            selectedRow.request_id === item.request_id &&
            selectedRow.position_no === item.position_no &&
            selectedRow.medicine_id === item.medicine_id
        );
      })
      .map((item) => {
        return {
          id: item.request_id,
          position_no: item.position_no,
          medicine_id: item.medicine_id,
          medicine_qty: item.medicine_qty,
          status: false,
        };
      });
    const finalData = [...checkedRequestDetails, ...unCheckedRequestDetails];
    const finalData2 = finalData.map((item) => {
      return {
        response_id: item.id,
        position_no: item.position_no,
        pharmacy_id: "34000418",
        status: item.status,
      };
    });
    console.log(finalData2, "finalData");
    console.log(checkedRequestDetails, "checkedRequestDetails");
    console.log(unCheckedRequestDetails, "unCheckedRequestDetails");
    responseRequestMutation(finalData2);

    // const { error } = await supabase
    //   .from("user_request")
    //   .update({ is_confirmed: true })
    //   .eq("id", selectedRequest.id);
    // if (error) {
    //   console.log("error");
    // }
  };

  // async function getRequests() {
  //   const { data, error } = await supabase.from("user_request").select();
  //   if (error) {
  //     console.log("error");
  //   }
  //   if (data) {
  //     setRequestData(data);
  //   }
  //   debugger;
  // }
  // async function getRequestDetails(rowData) {
  //   setSelectedRequest(rowData);
  //   console.log(selectedRequest, "selectedRequest");
  //   const { data, error } = await supabase
  //     .from("request_item")
  //     .select()
  //     .eq("request_id", rowData?.id);
  //   if (error) {
  //     console.log("error");
  //   }
  //   if (data) {
  //     setRequestDetailData(data);
  //   }
  //   debugger;
  // }
  // useEffect(() => {
  //   getRequests();
  //   requestData?.map((item) => {
  //     console.log(item, "item");
  //   });
  // }, []);

  console.log(selectedRequest, "selectedRequest;");

  console.log(selectedRows, "selectedRows;");

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
              onClick={confirmRequest}
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

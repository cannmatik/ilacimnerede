import React, { useEffect, useState } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";
import { before, next } from "@assets";
import { useGetRequest, useGetRequestDetails } from "./queries";

function Request() {
  const [requestDetailData, setRequestDetailData] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState();
  const { data: requests } = useGetRequest();
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);

  console.log(requests, "requests;");

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
  console.log(selectedRequest, "requestData");
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
      header: "Prescription Number",
      accessor: "prescript_no",
    },
  ];
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
            onRowClick={(row) => {
              console.log(row, "row");
              setSelectedRequest(row.original);
            }}
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
            columns={columns_requestDetail || []}
            rowHoverStyle={{ border: true }}
            onRowClick={(row) => {}}
          />
          <div className="request-accept-footer">
            <img
              src={before}
              style={{ width: "30px", height: "30px", padding: "5px" }}
            ></img>
            <INButton flex={true} onClick={{}} text="Onayla"></INButton>
            <img
              src={next}
              style={{ width: "30px", height: "30px", padding: "5px" }}
            ></img>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Request;

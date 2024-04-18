import React, { useEffect, useState } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";
import { before, next } from "@assets";
import { Checkbox } from "antd";
import { useGetRequest, useGetRequestDetails } from "./queries";
import { columns_requestDetail, columns } from "./constants/requestColumns";

function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState();
  const { data: requests } = useGetRequest();
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);

  console.log(requests, "requests;");

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

  const checkboxObj = [
    {
      accessor: "checkbox",
      header: "Var",
      cell: ({ row }) => (
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
  ];

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
            columns={[...columns_requestDetail, ...checkboxObj] || []}
            rowHoverStyle={{ border: true }}
            onRowClick={(row) => {}}
            // checkboxed={true}
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
            <INButton flex={true} onClick={{}} text="Onayla"></INButton>
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

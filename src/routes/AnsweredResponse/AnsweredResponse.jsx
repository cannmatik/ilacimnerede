import { INDataTable } from "@components";
import React, { useState, useEffect } from "react";
import { Col, Row } from "react-grid-system";
import { useGetFetchedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";
import { before, next } from "@assets";
import "./style.scss";

function AnsweredResponse() {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState();
  const { data: answeredRequests, isLoading } =
    useGetFetchedRequests(pharmacyId);
  const { data: answeredRequestDetails } = useGetRequestDetails(
    selectedRequest?.request_id,
    selectedRequest?.id
  );

  // console.log(answeredRequests, "answeredRequests");
  // console.log(selectedRequest, "selectedRequest");
  // console.log(answeredRequestDetails, "answeredRequestDetails");

  const openPrevRequest = () => {
    // console.log(
    //   answeredRequests.findIndex(
    //     (item) => item.request_id === selectedRequest?.request_id
    //   )
    // );

    if (
      answeredRequests?.findIndex(
        (item) => item.request_id === selectedRequest?.request_id
      ) > 0
    ) {
      setSelectedRequest(
        answeredRequests[
          answeredRequests?.findIndex(
            (item) => item.request_id === selectedRequest?.request_id
          ) - 1
        ]
      );
    } else {
      setIsPrevDisabled(true);
    }
  };

  const openNextRequest = () => {
    if (
      answeredRequests?.findIndex(
        (item) => item.request_id === selectedRequest?.request_id
      ) <
      answeredRequests?.length - 1
    ) {
      setSelectedRequest(
        answeredRequests[
          answeredRequests?.findIndex(
            (item) => item.request_id === selectedRequest?.request_id
          ) + 1
        ]
      );
    } else {
      setIsNextDisabled(true);
    }
  };

  useEffect(() => {
    if (
      answeredRequests?.findIndex(
        (item) => item.request_id === selectedRequest?.request_id
      ) > 0
    ) {
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
    if (
      answeredRequests?.findIndex(
        (item) => item.request_id === selectedRequest?.request_id
      ) <
      answeredRequests?.length - 1
    ) {
      setIsNextDisabled(false);
    } else {
      setIsNextDisabled(true);
    }
  }, [selectedRequest]);
  return (
    <>
      <Row style={{ marginLeft: "25px" }}>Cevaplanan Talepler</Row>
      <br></br>
      <Row>
        <Col xs={6}>
          <INDataTable
            data={answeredRequests || []}
            columns={columns || []}
            rowHoverStyle={{ border: true }}
            onRowClick={(row) => {
              setSelectedRequest(row.original);
            }}
            isLoading={isLoading}
          />
        </Col>
        <Col xs={6} className="request-table">
          <div className="request-info">
            <span>Request Number: {selectedRequest?.request_id}</span>
            <span>REÇETE NO: {selectedRequest?.prescript_no}</span>
            <span>TC NO: {selectedRequest?.tc_no}</span>
          </div>
          <INDataTable
            data={answeredRequestDetails || []}
            columns={columns_requestDetail || []}
            rowHoverStyle={{ border: true }}
            onRowClick={(row) => {
              console.log(row.orgininal);
            }}
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

export default AnsweredResponse;

import { INDataTable } from "@components";
import React, { useState, useEffect } from "react";
import { Col, Row } from "react-grid-system";
import { useGetFinishedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";
import { before, next } from "@assets";
import "./style.scss";
import { Spin, Empty } from "antd";

function FinishedResponse() {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState();
  const { data: answeredRequests, isLoading } = useGetFinishedRequests(pharmacyId);
  const { data: answeredRequestDetails, isLoading: isLoadingDetails } = useGetRequestDetails(
    selectedRequest?.request_id,
    selectedRequest?.id,
    pharmacyId
  );

  const openPrevRequest = () => {
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
  }, [selectedRequest, answeredRequests]);

  return (
    <>
      <br></br>
      <Row>
        <Col xs={12} md={6}>
          {isLoading ? (
            <div className="spin-container center-content pulse">
              <Spin size="large" />
            </div>
          ) : answeredRequests && answeredRequests.length > 0 ? (
            <div className="fade-in" style={{ width: "100%" }}>
              <INDataTable
                data={answeredRequests}
                columns={columns}
                rowHoverStyle={{ border: true }}
                onRowClick={(row) => {
                  setSelectedRequest(row.original);
                }}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <div className="center-content fade-in pulse">
              <Empty description="Şu an kapatılan talebiniz yok." />
            </div>
          )}
        </Col>
        <Col xs={12} md={6} className="request-table">
          {/* Koşullu renderlama - Talep seçili ise göster */}
          {selectedRequest && (
            <div className="request-info">
              <span>Talep Numarası: {selectedRequest?.request_id}</span>
              <span>Mesaj: {selectedRequest?.message_text}</span>
            </div>
          )}
          {/* Sağ taraf için koşullu renderlama */}
          {selectedRequest &&
            (isLoadingDetails ? (
              <div className="spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : answeredRequestDetails && answeredRequestDetails.length > 0 ? (
              <div className="fade-in" style={{ width: "100%" }}>
                <INDataTable
                  data={answeredRequestDetails}
                  columns={columns_requestDetail}
                  rowHoverStyle={{ border: true }}
                  onRowClick={(row) => {
                    // console.log(row.orgininal);
                  }}
                />
              </div>
            ) : (
              <div className="center-content fade-in pulse">
                <Empty description="Talep detayı bulunamadı." />
              </div>
            ))}

          {/* Butonları da koşullu olarak göster - Talep seçili ise göster */}
          {selectedRequest && (
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
          )}
        </Col>
      </Row>
    </>
  );
}

export default FinishedResponse;
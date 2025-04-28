import React, { useState, useEffect } from "react";
import { Spin, Empty } from "antd";
import { INDataTable } from "@components";
import { Col, Row } from "react-grid-system";
import { useGetFinishedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { Button } from "@mui/material";
import { ArrowBack, ArrowForward, ArrowBackIos } from "@mui/icons-material";
import "./frstyle.scss";

function FinishedResponse() {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Sorgular
  const { data: answeredRequests = [], isLoading: isRequestsLoading } = useGetFinishedRequests(pharmacyId);
  const {
    data: answeredRequestDetails = [],
    isLoading: isDetailsLoading,
    error: detailsError,
    isFetching: isDetailsFetching,
  } = useGetRequestDetails(selectedRequest?.request_id, selectedRequest?.id, pharmacyId);

  // Hata ayıklama logları
  useEffect(() => {
    console.log("FinishedResponse.jsx - answeredRequests:", answeredRequests);
    console.log("FinishedResponse.jsx - answeredRequestDetails:", answeredRequestDetails);
    console.log("FinishedResponse.jsx - detailsError:", detailsError);
    console.log("FinishedResponse.jsx - isDetailsLoading:", isDetailsLoading);
    console.log("FinishedResponse.jsx - isDetailsFetching:", isDetailsFetching);
    console.log("FinishedResponse.jsx - selectedRequest:", selectedRequest);
  }, [answeredRequests, answeredRequestDetails, detailsError, isDetailsLoading, isDetailsFetching, selectedRequest]);

  // Responsive kontrol
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Önceki talep
  const openPrevRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex > 0) {
      setSelectedRequest(answeredRequests[currentIndex - 1]);
    }
  };

  // Sonraki talep
  const openNextRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex < answeredRequests.length - 1) {
      setSelectedRequest(answeredRequests[currentIndex + 1]);
    }
  };

  // Buton aktifliklerini güncelle
  useEffect(() => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= answeredRequests.length - 1);
  }, [selectedRequest, answeredRequests]);

  return (
    <div className="finished-content">
      <Row>
        {(!isMobile || !selectedRequest) && (
          <Col xs={12} md={6} className="finished-table-container">
            {isRequestsLoading ? (
              <div className="finished-spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : answeredRequests.length > 0 ? (
              <div className="finished-table-wrapper fade-in" style={{ width: "100%" }}>
                <INDataTable
                  data={answeredRequests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  onRowClick={(row) => {
                    console.log("onRowClick - row:", row);
                    setSelectedRequest(row);
                  }}
                />
              </div>
            ) : (
              <div className="finished-empty-container fade-in pulse">
                <Empty description={<span className="empty-list-text">Kapatılan talebiniz yok.</span>} />
              </div>
            )}
          </Col>
        )}

        {selectedRequest && (
          <Col xs={12} md={6} className="finished-request-table">
            <div className="right-panel">
              <div className="right-header">
                <div className="request-info">
                  <span>Talep Numarası: {selectedRequest?.request_id}</span>
                  <span>Mesaj: {selectedRequest?.message_text}</span>
                </div>
              </div>

              <div className="table-scroll-container">
                {isDetailsLoading || isDetailsFetching ? (
                  <div className="finished-spin-container center-content pulse">
                    <Spin size="large" />
                  </div>
                ) : detailsError ? (
                  <div className="finished-empty-container fade-in pulse">
                    <Empty description={`Hata: Detaylar yüklenemedi. ${detailsError.message}`} />
                  </div>
                ) : !answeredRequestDetails || answeredRequestDetails.length === 0 ? (
                  <div className="finished-empty-container fade-in pulse">
                    <Empty description={<span className="empty-list-text">Talep detayı bulunamadı.</span>} />
                  </div>
                ) : (
                  <INDataTable
                    key={`${selectedRequest?.id}-${selectedRequest?.request_id}`}
                    data={answeredRequestDetails}
                    columns={columns_requestDetail}
                    rowHoverStyle={{ border: true }}
                    emptyText={<span className="empty-list-text">Talep detayı bulunamadı.</span>}
                  />
                )}
              </div>

              {/* Alt butonların yerleşimi */}
              <div className="bottom-footer-finished">
                <div className="footer-row">
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={openPrevRequest}
                    disabled={isPrevDisabled}
                    sx={{ margin: "0 8px" }}
                  >
                    Önceki Talep
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ArrowForward />}
                    onClick={openNextRequest}
                    disabled={isNextDisabled}
                    sx={{ margin: "0 8px" }}
                  >
                    Sonraki Talep
                  </Button>
                </div>
                {isMobile && (
                  <div className="footer-row back-button-row">
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIos />}
                      onClick={() => setSelectedRequest(null)}
                      sx={{ margin: "0 8px", width: "100%" }}
                      aria-label="mobile-back"
                    >
                      Geri
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
}

export default FinishedResponse;
import React, { useState, useEffect } from "react";
import { Spin, Empty } from "antd";
import { INDataTable, INButton } from "@components";
import { Col, Row } from "react-grid-system";
import { useGetFinishedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { LeftOutlined } from "@ant-design/icons";
import "./frstyle.scss";

function FinishedResponse() {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Sorgular
  const { data: answeredRequests = [], isLoading } = useGetFinishedRequests(pharmacyId);
  const {
    data: answeredRequestDetails = [],
    isLoading: isLoadingDetails,
  } = useGetRequestDetails(selectedRequest?.request_id, selectedRequest?.id, pharmacyId);

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
            {isLoading ? (
              <div className="finished-spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : answeredRequests.length > 0 ? (
              <div className="finished-table-wrapper fade-in" style={{ width: "100%" }}>
                <INDataTable
                  data={answeredRequests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  onRowClick={(row) => setSelectedRequest(row.original)}
                />
              </div>
            ) : (
              <div className="finished-empty-container fade-in pulse">
                <Empty description="Kapatılan talebiniz yok." />
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
                {isLoadingDetails ? (
                  <div className="finished-spin-container center-content pulse">
                    <Spin size="large" />
                  </div>
                ) : answeredRequestDetails.length > 0 ? (
                  <INDataTable
                    data={answeredRequestDetails}
                    columns={columns_requestDetail}
                    rowHoverStyle={{ border: true }}
                    emptyText="Talep detayı bulunamadı."
                  />
                ) : (
                  <div className="finished-empty-container fade-in pulse">
                    <Empty description="Talep detayı bulunamadı." />
                  </div>
                )}
              </div>

              {/* Alt butonların yerleşimi */}
              <div className="bottom-footer-finished">
                <div className="footer-row">
                  <INButton
                    onClick={!isPrevDisabled ? openPrevRequest : undefined}
                    text="Önceki Talep"
                    disabled={isPrevDisabled}
                    className="nav-button"
                  />
                  <INButton
                    onClick={!isNextDisabled ? openNextRequest : undefined}
                    text="Sonraki Talep"
                    disabled={isNextDisabled}
                    className="nav-button"
                  />
                </div>
                {isMobile && (
                  <div className="footer-row back-button-row">
                    <INButton
                      onClick={() => setSelectedRequest(null)}
                      text={
                        <>
                          <LeftOutlined style={{ marginRight: 4 }} />
                          Geri
                        </>
                      }
                      className="nav-button"
                    />
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

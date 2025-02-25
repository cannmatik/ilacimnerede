import React, { useState, useEffect } from "react";
import { Spin, Empty } from "antd";
import { supabase } from "@routes/Login/useCreateClient";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { INDataTable, INButton } from "@components";
import { Col, Row } from "react-grid-system";
import { useGetFetchedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import "./arstyle.scss";
import { LeftOutlined } from "@ant-design/icons";

const AnsweredResponse = () => {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Sorgular
  const {
    data: answeredRequests = [],
    isLoading,
    refetch,
  } = useGetFetchedRequests(pharmacyId);

  const { data: answeredRequestDetails = [] } = useGetRequestDetails(
    selectedRequest?.request_id,
    selectedRequest?.id
  );

  // Yeniden veri çekme
  useEffect(() => {
    if (pharmacyId) refetch();
  }, [pharmacyId, refetch]);

  // Responsive kontrol
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Önceki / Sonraki talep
  const openPrevRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex > 0) {
      setSelectedRequest(answeredRequests[currentIndex - 1]);
    }
  };

  const openNextRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex < answeredRequests.length - 1) {
      setSelectedRequest(answeredRequests[currentIndex + 1]);
    }
  };

  // Talep silme (Verilen yanıtı geri alma)
  const handleDeleteRequest = async (responseId) => {
    setLoading(true);
    setNotification("");

    try {
      const { error } = await supabase.from("response").delete().eq("id", responseId);
      if (error) throw error;

      setNotification("Yanıt başarıyla geri alındı.");
      refetch();

      // Sonrakine geç
      const currentIndex = answeredRequests.findIndex(
        (item) => item.request_id === selectedRequest?.request_id
      );
      if (currentIndex < answeredRequests.length - 1) {
        setSelectedRequest(answeredRequests[currentIndex + 1]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      setNotification("Bir hata oluştu! Lütfen tekrar deneyin.");
      console.error("Silme hatası:", error);
    } finally {
      setLoading(false);
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
    <div className="answered-content">
      <Row>
        {(!isMobile || !selectedRequest) && (
          <Col xs={12} md={6} className="answered-table-container">
            {isLoading ? (
              <div className="answered-spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : answeredRequests.length > 0 ? (
              <div className="answered-table-wrapper fade-in" style={{ width: "100%" }}>
                <INDataTable
                  data={answeredRequests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  onRowClick={(row) => setSelectedRequest(row.original)}
                />
              </div>
            ) : (
              <div className="answered-empty-container fade-in pulse">
                <Empty description="Henüz hiçbir talebi cevaplamadınız." />
              </div>
            )}
          </Col>
        )}

        {selectedRequest && (
          <Col xs={12} md={6} className="answered-request-table">
            <div className="right-panel">
              <div className="right-header">
                <div className="request-info">
                  <span>Talep Numarası: {selectedRequest?.request_id}</span>
                  <span>Mesaj: {selectedRequest?.message_text}</span>
                </div>
              </div>

              <div className="table-scroll-container">
                {answeredRequestDetails.length > 0 ? (
                  <INDataTable
                    key={`${selectedRequest?.id}-${selectedRequest?.request_id}`}
                    data={answeredRequestDetails}
                    columns={columns_requestDetail}
                    rowHoverStyle={{ border: true }}
                    emptyText="Detay bulunamadı"
                  />
                ) : isLoading ? (
                  <div className="answered-spin-container center-content pulse">
                    <Spin size="large" />
                  </div>
                ) : (
                  <div className="answered-empty-container fade-in pulse">
                    <Empty description="Detay bulunamadı." />
                  </div>
                )}
              </div>

              <div className="bottom-footer">
                <div className="footer-row">
                  <INButton
                    onClick={!isPrevDisabled ? openPrevRequest : undefined}
                    text="Önceki Talep"
                    disabled={isPrevDisabled}
                    className="nav-button"
                  />

                  <INButton
                    className="answered-delete-button"
                    onClick={() => handleDeleteRequest(selectedRequest?.id)}
                    text="Verilen Yanıtı Geri Al"
                    disabled={loading}
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

              {notification && (
                <div
                  className={`answered-notification ${
                    notification.includes("başarı") ? "success" : "error"
                  }`}
                >
                  {notification}
                </div>
              )}
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default AnsweredResponse;

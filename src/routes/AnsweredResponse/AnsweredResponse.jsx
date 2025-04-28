import React, { useState, useEffect } from "react";
import { Spin, Empty } from "antd";
import { supabase } from "@routes/Login/useCreateClient";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { INDataTable } from "@components";
import { Col, Row } from "react-grid-system";
import { useGetFetchedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import "./arstyle.scss";
import { Button } from "@mui/material";
import { ArrowBack, ArrowForward, Delete, ArrowBackIos } from "@mui/icons-material";

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
    isLoading: isRequestsLoading,
    refetch,
  } = useGetFetchedRequests(pharmacyId);

  const {
    data: answeredRequestDetails = [],
    isLoading: isDetailsLoading,
    error: detailsError,
    isFetching: isDetailsFetching,
  } = useGetRequestDetails(
    selectedRequest?.request_id,
    selectedRequest?.id
  );

  // Hata ayıklama logları
  useEffect(() => {
    console.log("AnsweredResponse.jsx - answeredRequests:", answeredRequests);
    console.log("AnsweredResponse.jsx - answeredRequestDetails:", answeredRequestDetails);
    console.log("AnsweredResponse.jsx - detailsError:", detailsError);
    console.log("AnsweredResponse.jsx - isDetailsLoading:", isDetailsLoading);
    console.log("AnsweredResponse.jsx - isDetailsFetching:", isDetailsFetching);
    console.log("AnsweredResponse.jsx - selectedRequest:", selectedRequest);
  }, [answeredRequests, answeredRequestDetails, detailsError, isDetailsLoading, isDetailsFetching, selectedRequest]);

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
            {isRequestsLoading ? (
              <div className="answered-spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : answeredRequests.length > 0 ? (
              <div className="answered-table-wrapper fade-in" style={{ width: "100%" }}>
                <INDataTable
                  data={answeredRequests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  onRowClick={(row) => {
                    console.log("onRowClick - row:", row);
                    setSelectedRequest(row); // row.original yerine row kullanılıyor, INDataTable doğrudan row nesnesini geçiriyor
                  }}
                />
              </div>
            ) : (
              <div className="answered-empty-container fade-in pulse">
                <Empty description={<span className="empty-list-text">Henüz hiçbir talebi cevaplamadınız.</span>} />
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
                {isDetailsLoading || isDetailsFetching ? (
                  <div className="answered-spin-container center-content pulse">
                    <Spin size="large" />
                  </div>
                ) : detailsError ? (
                  <div className="answered-empty-container fade-in pulse">
                    <Empty description={`Hata: Detaylar yüklenemedi. ${detailsError.message}`} />
                  </div>
                ) : !answeredRequestDetails || answeredRequestDetails.length === 0 ? (
                  <div className="answered-empty-container fade-in pulse">
                    <Empty description={<span className="empty-list-text">Detay bulunamadı. Seçilen talep ID: {selectedRequest?.request_id}</span>} />
                  </div>
                ) : (
                  <INDataTable
                    key={`${selectedRequest?.id}-${selectedRequest?.request_id}`}
                    data={answeredRequestDetails}
                    columns={columns_requestDetail}
                    rowHoverStyle={{ border: true }}
                    emptyText={<span className="empty-list-text">Detay bulunamadı</span>}
                  />
                )}
              </div>

              <div className="bottom-footer">
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
                    variant="contained"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteRequest(selectedRequest?.id)}
                    disabled={loading}
                    sx={{ margin: "0 8px" }}
                    aria-label="delete-request"
                  >
                    Verilen Yanıtı Geri Al
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
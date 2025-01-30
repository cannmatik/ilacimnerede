// AnsweredResponse.jsx
import { Spin, Empty } from "antd";
import { supabase } from "@routes/Login/useCreateClient";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { INDataTable, INButton } from "@components";
import { Col, Row } from "react-grid-system";
import { useState, useEffect } from "react";
import { before, next } from "@assets";
import { useGetFetchedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import "./style.scss";

const AnsweredResponse = () => {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { 
    data: answeredRequests = [], 
    isLoading, 
    error: fetchError,
    refetch 
  } = useGetFetchedRequests(pharmacyId);

  const { data: answeredRequestDetails = [] } = useGetRequestDetails(
    selectedRequest?.request_id, 
    selectedRequest?.id
  );

  // Verileri yeniden çek
  useEffect(() => {
    if (pharmacyId) refetch();
  }, [pharmacyId, refetch]);

  // Responsive kontrol
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Önceki talep
  const openPrevRequest = () => {
    const currentIndex = answeredRequests.findIndex(item => item.request_id === selectedRequest?.request_id);
    if (currentIndex > 0) setSelectedRequest(answeredRequests[currentIndex - 1]);
  };

  // Sonraki talep
  const openNextRequest = () => {
    const currentIndex = answeredRequests.findIndex(item => item.request_id === selectedRequest?.request_id);
    if (currentIndex < answeredRequests.length - 1) setSelectedRequest(answeredRequests[currentIndex + 1]);
  };

  // Talep silme
  const handleDeleteRequest = async (responseId) => {
    setLoading(true);
    setNotification("");
    
    try {
      const { error } = await supabase.from("response").delete().eq("id", responseId);
      if (error) throw error;
      
      setNotification("Talep başarıyla silindi.");
      refetch();
      
      const currentIndex = answeredRequests.findIndex(item => item.request_id === selectedRequest?.request_id);
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

  // Navigasyon durumu
  useEffect(() => {
    const currentIndex = answeredRequests.findIndex(item => item.request_id === selectedRequest?.request_id);
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= answeredRequests.length - 1);
  }, [selectedRequest, answeredRequests]);

  return (
    <>
      <br />
      <Row>
        {(!isMobile || !selectedRequest) && (
          <Col xs={12} md={6} className="table-container">
            {isLoading ? (
              <div className="spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : answeredRequests.length > 0 ? (
              <div className="fade-in" style={{ width: "100%" }}>
                <INDataTable
                  data={answeredRequests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  onRowClick={(row) => setSelectedRequest(row.original)}
                />
              </div>
            ) : (
              <div className="center-content fade-in pulse">
                <Empty description="Şu an cevaplanmış talep yok." />
              </div>
            )}
          </Col>
        )}

        {(selectedRequest && !isMobile) || (isMobile && selectedRequest) ? (
          <Col xs={12} md={6} className="request-table">
            {isMobile && (
              <div className="mobile-header">
                <INButton
                  flex={true}
                  onClick={() => setSelectedRequest(null)}
                  text="Geri Dön"
                />
              </div>
            )}

            <div className="request-info">
              <span>Talep Numarası: {selectedRequest?.request_id}</span>
              <span>Mesaj: {selectedRequest?.prescript_no}</span>
            </div>

            <INDataTable
              key={`${selectedRequest?.id}-${selectedRequest?.request_id}`}
              data={answeredRequestDetails}
              columns={columns_requestDetail}
              rowHoverStyle={{ border: true }}
              emptyText="Detay bulunamadı"
            />

            <div className="request-accept-footer">
              <img
                src={before}
                className={`prev-or-next ${isPrevDisabled ? "disabled" : "enabled"}`}
                onClick={!isPrevDisabled ? openPrevRequest : undefined}
                alt="Önceki Talep"
              />
              
              <INButton
                className="delete-request-button"
                onClick={() => handleDeleteRequest(selectedRequest?.id)}
                text="Verilen Yanıtı Geri Al"
                disabled={loading}
              />
              
              <img
                src={next}
                className={`prev-or-next ${isNextDisabled ? "disabled" : "enabled"}`}
                onClick={!isNextDisabled ? openNextRequest : undefined}
                alt="Sonraki Talep"
              />
            </div>

            {notification && (
              <div className={`notification ${notification.includes("başarı") ? "success" : "error"}`}>
                {notification}
              </div>
            )}
          </Col>
        ) : null}
      </Row>
    </>
  );
};

export default AnsweredResponse;
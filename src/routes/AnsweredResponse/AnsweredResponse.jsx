import { supabase } from "@routes/Login/useCreateClient";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { INDataTable } from "@components";
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
  const [selectedRequest, setSelectedRequest] = useState();
  const [loading, setLoading] = useState(false); // Yükleme durumu için state
  const [notification, setNotification] = useState(""); // Başarı/Hata bildirimi için state
  const { data: answeredRequests, isLoading, refetch } = useGetFetchedRequests(pharmacyId);
  const { data: answeredRequestDetails } = useGetRequestDetails(selectedRequest?.request_id, selectedRequest?.id);

  const openPrevRequest = () => {
    const currentIndex = answeredRequests?.findIndex((item) => item.request_id === selectedRequest?.request_id);
    if (currentIndex > 0) {
      setSelectedRequest(answeredRequests[currentIndex - 1]);
    } else {
      setIsPrevDisabled(true);
    }
  };

  const openNextRequest = () => {
    const currentIndex = answeredRequests?.findIndex((item) => item.request_id === selectedRequest?.request_id);
    if (currentIndex < answeredRequests?.length - 1) {
      setSelectedRequest(answeredRequests[currentIndex + 1]);
    } else {
      setIsNextDisabled(true);
    }
  };

  // Cevaplanan talebi silme fonksiyonu
  const handleDeleteRequest = async (responseId) => {
    setLoading(true); // Yükleme başlasın
    setNotification(""); // Önceki bildirimleri sıfırla

    const { error } = await supabase.from("response").delete().eq("id", responseId);
    setLoading(false); // Yükleme bitti

    if (error) {
      console.error("Error deleting response:", error);
      setNotification("Bir hata oluştu! Lütfen tekrar deneyin."); // Hata mesajı
    } else {
      setNotification("Talep başarıyla silindi."); // Başarı mesajı
      refetch();  // Yanıt silindikten sonra tekrar veri çekme

      // Silme işleminden sonra bir sonraki talebe geç
      const currentIndex = answeredRequests?.findIndex((item) => item.request_id === selectedRequest?.request_id);
      if (currentIndex < answeredRequests?.length - 1) {
        setSelectedRequest(answeredRequests[currentIndex + 1]); // Bir sonraki talebe geç
      } else {
        setSelectedRequest(null); // Eğer bir sonraki talep yoksa, null yaparak "Şu an bekleyen talep yok" mesajını göster
      }
    }
  };

  useEffect(() => {
    if (answeredRequests?.findIndex((item) => item.request_id === selectedRequest?.request_id) > 0) {
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
    if (answeredRequests?.findIndex((item) => item.request_id === selectedRequest?.request_id) < answeredRequests?.length - 1) {
      setIsNextDisabled(false);
    } else {
      setIsNextDisabled(true);
    }
  }, [selectedRequest, answeredRequests]);

  return (
    <>
      <br />
      <Row>
        <Col xs={6}>
          <INDataTable
            data={answeredRequests || []}
            columns={columns}
            rowHoverStyle={{ border: true }}
            onRowClick={(row) => {
              setSelectedRequest(row.original);
            }}
            isLoading={isLoading}
          />
        </Col>
        <Col xs={6} className="request-table">
          <div className="request-info">
            <span>Talep Numarası : {selectedRequest?.request_id}</span>
            <span>Mesaj: {selectedRequest?.prescript_no}</span>
          </div>
          <INDataTable
            data={answeredRequestDetails || []}
            columns={columns_requestDetail || []}
            rowHoverStyle={{ border: true }}
            onRowClick={(row) => {
              console.log(row.original);
            }}
          />
          <div className="request-accept-footer">
            <img
              src={before}
              className={`prev-or-next ${!isPrevDisabled ? "enabled" : "disabled"}`}
              onClick={() => openPrevRequest()}
            />
            <img
              src={next}
              className={`prev-or-next ${!isNextDisabled ? "enabled" : "disabled"}`}
              onClick={() => openNextRequest()}
            />
          </div>
          {/* Yükleme çubuğu */}
          {loading && (
            <div className="loading-bar">
              <div className="progress-bar"></div>
            </div>
          )}
          {/* Cevaplanan Talebi Sil butonu */}
          <div className="delete-request-button-container">
            <button
              className="delete-request-button"
              onClick={() => handleDeleteRequest(selectedRequest?.id)} // response_id kullanarak silme
            >
              Cevaplanan Talebi Sil
            </button>
          </div>
          {/* Bildirim */}
          {notification && (
            <div className="notification">
              <p>{notification}</p>
            </div>
          )}
        </Col>
      </Row>
    </>
  );
};

export default AnsweredResponse;
  
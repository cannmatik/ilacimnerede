import React, { useEffect, useState, useRef } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import "./rstyle.scss";
import { Spin, Progress, Empty, Collapse } from "antd";
import {
  useGetRequest,
  useGetRequestDetails,
  useResponseRequest,
  useGetResponseBuffer,
  useDeleteFromResponseBuffer,
} from "./queries";
import { columns_requestDetail, columns } from "./constants/requestColumns";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";
import { Button, IconButton } from "@mui/material";
import { ArrowBack, ArrowForward, Check, ArrowBackIos, Delete } from "@mui/icons-material";

// Geçici Stok Listesi için sütun tanımları
const bufferColumns = [
  {
    header: "İlaç Adı",
    accessor: "medicine_name",
  },
  {
    header: "ID",
    accessor: "medicine_id",
  },
  {
    header: "Sil",
    accessor: "action",
    Cell: ({ row, deleteFromResponseBuffer, pharmacyId }) => (
      <IconButton
        onClick={() => {
          console.log("Geçici stoktan manuel silme:", {
            pharmacy_id: pharmacyId,
            medicine_id: row.medicine_id,
          });
          deleteFromResponseBuffer({
            pharmacy_id: pharmacyId,
            medicine_id: row.medicine_id,
          });
        }}
        color="error"
      >
        <Delete />
      </IconButton>
    ),
  },
];

// Talep ekranı bileşeni
function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [progress, setProgress] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [notification, setNotification] = useState(""); // Bildirim için state
  const pharmacyId = useSelector(selectUserPharmacyId);
  const touchTime = useRef(0);
  const [messageText, setMessageText] = useState("");

  const {
    data: requests,
    isLoading: isRequestsLoading,
    highlightedRequestIds,
  } = useGetRequest();
  const {
    data: requestDetail,
    isLoading: isRequestDetailLoading,
    error: requestDetailError,
  } = useGetRequestDetails(selectedRequest?.id);
  const { data: bufferedMedicines } = useGetResponseBuffer();
  const { mutate: responseRequestMutation } = useResponseRequest();
  const { mutate: deleteFromResponseBuffer } = useDeleteFromResponseBuffer();

  // Verileri ve hataları konsola yazdır (hata ayıklama için)
  useEffect(() => {
    console.log("Request.jsx - requests:", requests);
    console.log("Request.jsx - requestDetail:", requestDetail);
    console.log("Request.jsx - requestDetailError:", requestDetailError);
    console.log("Request.jsx - bufferedMedicines:", bufferedMedicines);
    console.log("Request.jsx - selectedRequest:", selectedRequest);
    console.log("Request.jsx - notification:", notification);
  }, [requests, requestDetail, requestDetailError, bufferedMedicines, selectedRequest, notification]);

  // Talep değiştiğinde seçimi ve mesajı sıfırla
  useEffect(() => {
    setSelectedRows([]);
    setMessageText("");
  }, [selectedRequest?.id]);

  // Pencere boyutunu izle (mobil tespit için)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobil cihazlarda çift dokunma ile seçim
  const handleDoubleTap = (row) => {
    console.log("handleDoubleTap - row:", row);
    const now = new Date().getTime();
    const doubleTapDelay = 300;
    if (touchTime.current + doubleTapDelay > now) {
      const isSelected = selectedRows.some((item) => item.id === row.original.id);
      setSelectedRows((prev) =>
        isSelected
          ? prev.filter((item) => item.id !== row.original.id)
          : [...prev, row.original]
      );
      touchTime.current = 0;
    } else {
      touchTime.current = now;
    }
  };

  // Önceki talebe geçiş
  const openPrevRequest = () => {
    const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
    if (currentIndex > 0) {
      setSelectedRequest(requests[currentIndex - 1]);
      setSelectedRows([]);
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
  };

  // Sonraki talebe geçiş
  const openNextRequest = () => {
    const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
    if (currentIndex < requests?.length - 1) {
      setSelectedRequest(requests[currentIndex + 1]);
      setSelectedRows([]);
      setIsNextDisabled(currentIndex + 1 >= requests?.length - 1);
    } else {
      setIsNextDisabled(true);
    }
  };

  // Navigasyon butonlarının durumunu güncelle
  useEffect(() => {
    const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= (requests?.length || 0) - 1);
  }, [selectedRequest, requests]);

  // Talep yanıtını gönder
  const handleConfirmRequest = async () => {
    setProgress(0);
    setMessageText("");
    setNotification(""); // Bildirimi sıfırla

    const selectedRowsIds = selectedRows.map(({ id }) => id);
    const checkedRequestDetails = selectedRows.map(({ id, medicine_id }) => ({
      request_item_id: id,
      status: true,
      medicine_id,
    }));

    const uncheckedRequestDetails = (requestDetail || [])
      .filter(({ id }) => !selectedRowsIds.includes(id))
      .map(({ id, medicine_id }) => ({
        request_item_id: id,
        status: false,
        medicine_id,
      }));

    const response = {
      request_id: selectedRequest?.id,
      pharmacy_id: pharmacyId,
      create_date: new Date().toISOString(),
      message_text: messageText,
      status: 1, // Status 1: Yanıtlandı
    };

    const finalData = [...checkedRequestDetails, ...uncheckedRequestDetails];

    // response_buffer'dan kaldırılacak ilaçları belirle (seçilmemiş olanlar)
    const selectedMedicineIds = selectedRows.map((row) => row.medicine_id);
    const medicinesToRemove = bufferedMedicines
      ? bufferedMedicines
          .filter((item) => !selectedMedicineIds.includes(item.medicine_id))
          .map((item) => item.medicine_id)
      : [];

    console.log("response_buffer'dan kaldırılacak ilaçlar:", medicinesToRemove);

    // Seçilmemiş ilaçları response_buffer'dan sil
    if (medicinesToRemove.length > 0 && pharmacyId) {
      for (const medicine_id of medicinesToRemove) {
        try {
          console.log("response_buffer'dan kaldırılıyor:", { pharmacy_id, medicine_id });
          await deleteFromResponseBuffer({ pharmacy_id: pharmacyId, medicine_id });
        } catch (error) {
          console.error("response_buffer'dan silme başarısız:", error);
        }
      }
    }

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 500);

    try {
      await responseRequestMutation({ finalData, response });
      setProgress(100);
      setNotification("Talep başarıyla yanıtlandı!"); // Başarı bildirimi
      setSelectedRows([]);
      const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
      if (currentIndex < (requests?.length || 0) - 1) {
        setSelectedRequest(requests[currentIndex + 1]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Talep yanıtlanırken hata:", error);
      setNotification("Talep yanıtlanırken hata oluştu: " + error.message); // Hata bildirimi
      setProgress(-1);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setProgress(-1);
      }, 2000);
    }
  };

  // Talep seçili değilse seçimi sıfırla
  useEffect(() => {
    if (!selectedRequest) {
      setSelectedRows([]);
    }
  }, [selectedRequest]);

  return (
    <div className="req_main-content">
      {/* Bildirim sayfanın üst kısmında gösteriliyor */}
      {notification && (
        <div
          className={`req_notification ${
            notification.includes("başarı") ? "success" : "error"
          }`}
        >
          {notification}
        </div>
      )}

      <Row>
        {(!isMobile || !selectedRequest) && (
          <Col xs={12} md={6} className="req_table-container">
            {isRequestsLoading ? (
              <div className="req_spin-container req_center-content req_pulse">
                <Spin size="large" />
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="req_list-scroll-container">
                <Collapse
                  items={[
                    {
                      key: "1",
                      label: "Geçici Stok Listesi",
                      children: (
                        <INDataTable
                          data={bufferedMedicines || []}
                          columns={bufferColumns.map((col) =>
                            col.header === "Sil"
                              ? { ...col, deleteFromResponseBuffer, pharmacyId }
                              : col
                          )}
                          rowHoverStyle={{ border: true }}
                          emptyText={<span className="req_empty-list-text">Geçici stok listesinde ilaç yok.</span>}
                        />
                      ),
                    },
                  ]}
                />
                <INDataTable
                  data={requests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  setSelectedRows={setSelectedRows}
                  isLoading={isRequestsLoading}
                  rowClassName={(row) =>
                    highlightedRequestIds.includes(row.original.id)
                      ? "req_blink-row"
                      : ""
                  }
                  onRowClick={(row) => {
                    console.log("onRowClick - row:", row);
                    setSelectedRequest(row);
                  }}
                />
              </div>
            ) : (
              <div className="req_empty-container req_fade-in req_pulse">
                <Empty description={<span className="empty-list-text">Şu an bekleyen talebiniz yok.</span>} />
              </div>
            )}
          </Col>
        )}

        {selectedRequest && (
          <Col xs={12} md={6} className="req_request-table">
            <div className="req_right-panel">
              <div className="req_right-header">
                <div className="req_request-info">
                  <span>Talep Numarası: {selectedRequest?.id || "Bilinmeyen"}</span>
                  <span>Mesaj: {selectedRequest?.message_text || "Mesaj yok"}</span>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="req_message-input"
                  />
                </div>
              </div>

              <div className="req_table-scroll-container">
                {isRequestDetailLoading ? (
                  <Spin size="large" />
                ) : requestDetailError ? (
                  <div>Hata: Talep detayları yüklenemedi. {requestDetailError.message}</div>
                ) : !requestDetail || requestDetail.length === 0 ? (
                  <div>Talep detayları bulunamadı.</div>
                ) : (
                  <INDataTable
                    key={selectedRequest?.id || "request-detail-table"}
                    data={requestDetail}
                    columns={columns_requestDetail}
                    rowHoverStyle={{ border: true, background: !isMobile }}
                    checkboxed={true}
                    setSelectedRows={setSelectedRows}
                    unSelectAllOnTabChange={String(selectedRequest?.id || "")}
                    bufferedMedicines={bufferedMedicines || []}
                    deleteFromResponseBuffer={deleteFromResponseBuffer}
                    isLoading={isRequestDetailLoading}
                    onRowClick={(row) => isMobile && handleDoubleTap(row)}
                  />
                )}
              </div>

              <div className="req_bottom-footer-req">
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
                  startIcon={<Check />}
                  onClick={handleConfirmRequest}
                  disabled={!selectedRequest || (progress > -1 && progress < 100)}
                  sx={{ margin: "0 8px" }}
                  aria-label="respond-request"
                >
                  Talebi Yanıtla
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
                {isMobile && (
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIos />}
                    onClick={() => setSelectedRequest(null)}
                    sx={{ margin: "0 8px", width: "100%" }}
                    aria-label="mobile-back"
                  >
                    Geri
                  </Button>
                )}
              </div>
            </div>
          </Col>
        )}
      </Row>

      {progress > -1 && (
        <div className="req_progress-container">
          <Progress
            percent={progress}
            status={progress === 100 ? "success" : "active"}
            style={{ marginTop: "20px", height: "30px" }}
          />
        </div>
      )}
    </div>
  );
}

export default Request; 
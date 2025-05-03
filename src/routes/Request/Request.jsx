import React, { useEffect, useState, useRef } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import "./rstyle.scss";
import { Spin, Progress, Empty, Modal } from "antd";
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
import { ArrowBack, ArrowForward, Check, ArrowBackIos, Delete, VisibilityOff } from "@mui/icons-material";
import { supabase } from "@routes/Login/useCreateClient";

// Error Boundary Component
class DataTableErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="req_empty-container req_fade-in req_pulse">
          <Empty description="Tablo yüklenirken bir hata oluştu." />
        </div>
      );
    }
    return this.props.children;
  }
}

// Talep ekranı bileşeni
function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [progress, setProgress] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [notification, setNotification] = useState("");
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [isHiddenRequestsModalVisible, setIsHiddenRequestsModalVisible] = useState(false);
  const [hiddenRequests, setHiddenRequests] = useState([]);
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

  // Fetch hidden requests
  useEffect(() => {
    const fetchHiddenRequests = async () => {
      if (pharmacyId) {
        const { data, error } = await supabase
          .from("hide_request")
          .select("request_id")
          .eq("pharmacy_id", pharmacyId);
        if (error) {
          console.error("Error fetching hidden requests:", error);
          setNotification("Gizli talepler yüklenirken hata oluştu.");
        } else {
          setHiddenRequests(data.map((item) => item.request_id));
        }
      }
    };
    fetchHiddenRequests();
  }, [pharmacyId]);

  // Filter out hidden requests
  const visibleRequests = requests?.filter(
    (request) => !hiddenRequests.includes(request.id)
  ) || [];

  // Verileri ve hataları konsola yazdır (hata ayıklama için)
  useEffect(() => {
    console.log("Request.jsx - requests:", requests);
    console.log("Request.jsx - visibleRequests:", visibleRequests);
    console.log("Request.jsx - requestDetail:", requestDetail);
    console.log("Request.jsx - requestDetailError:", requestDetailError);
    console.log("Request.jsx - bufferedMedicines:", bufferedMedicines);
    console.log("Request.jsx - selectedRequest:", selectedRequest);
    console.log("Request.jsx - selectedRows:", selectedRows);
    console.log("Request.jsx - hiddenRequests:", hiddenRequests);
    console.log("Request.jsx - notification:", notification);
  }, [
    requests,
    visibleRequests,
    requestDetail,
    requestDetailError,
    bufferedMedicines,
    selectedRequest,
    selectedRows,
    hiddenRequests,
    notification,
  ]);

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
    const currentIndex = visibleRequests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    if (currentIndex > 0) {
      setSelectedRequest(visibleRequests[currentIndex - 1]);
      setSelectedRows([]);
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
  };

  // Sonraki talebe geçiş
  const openNextRequest = () => {
    const currentIndex = visibleRequests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    if (currentIndex < visibleRequests?.length - 1) {
      setSelectedRequest(visibleRequests[currentIndex + 1]);
      setSelectedRows([]);
      setIsNextDisabled(currentIndex + 1 >= visibleRequests?.length - 1);
    } else {
      setIsNextDisabled(true);
    }
  };

  // Navigasyon butonlarının durumunu güncelle
  useEffect(() => {
    const currentIndex = visibleRequests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= (visibleRequests?.length || 0) - 1);
  }, [selectedRequest, visibleRequests]);

  // Talep yanıtını gönder
  const handleConfirmRequest = async () => {
    setProgress(0);
    setMessageText("");
    setNotification("");

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

    // response_buffer'dan kaldırılacak ilaçları belirle
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
          await deleteFromResponseBuffer(
            { pharmacy_id: pharmacyId, medicine_id },
            {
              onSuccess: () => {
                setNotification("İlaç geçici stok listesinden kaldırıldı!");
              },
              onError: (error) => {
                setNotification("İlaç kaldırılırken hata oluştu: " + error.message);
              },
            }
          );
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
      setNotification("Talep başarıyla yanıtlandı!");
      setSelectedRows([]);
      const currentIndex = visibleRequests?.findIndex(
        (item) => item.id === selectedRequest?.id
      );
      if (currentIndex < (visibleRequests?.length || 0) - 1) {
        setSelectedRequest(visibleRequests[currentIndex + 1]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Talep yanıtlanırken hata:", error);
      setNotification("Talep yanıtlanırken hata oluştu: " + error.message);
      setProgress(-1);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setProgress(-1);
      }, 2000);
    }
  };

  // Talep gizleme
  const handleHideRequest = async () => {
    if (!selectedRequest || !pharmacyId) return;

    try {
      const { error } = await supabase
        .from("hide_request")
        .insert({ request_id: selectedRequest.id, pharmacy_id: pharmacyId });
      if (error) throw error;

      setHiddenRequests((prev) => [...prev, selectedRequest.id]);
      setNotification("Talep başarıyla gizlendi!");
      const currentIndex = visibleRequests?.findIndex(
        (item) => item.id === selectedRequest?.id
      );
      if (currentIndex < (visibleRequests?.length || 0) - 1) {
        setSelectedRequest(visibleRequests[currentIndex + 1]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Talep gizlenirken hata:", error);
      setNotification("Talep gizlenirken hata oluştu: " + error.message);
    }
  };

  // Talep geri alma (unhide)
  const handleUnhideRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from("hide_request")
        .delete()
        .eq("request_id", requestId)
        .eq("pharmacy_id", pharmacyId);
      if (error) throw error;

      setHiddenRequests((prev) => prev.filter((id) => id !== requestId));
      setNotification("Talep başarıyla geri alındı!");
    } catch (error) {
      console.error("Talep geri alınırken hata:", error);
      setNotification("Talep geri alınırken hata oluştu: " + error.message);
    }
  };

  // Talep seçili değilse seçimi sıfırla
  useEffect(() => {
    if (!selectedRequest) {
      setSelectedRows([]);
    }
  }, [selectedRequest]);

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
      Cell: ({ row }) => (
        <IconButton
          onClick={() => {
            console.log("Geçici stoktan manuel silme:", {
              pharmacy_id: pharmacyId,
              medicine_id: row.medicine_id,
            });
            deleteFromResponseBuffer(
              {
                pharmacy_id: pharmacyId,
                medicine_id: row.medicine_id,
              },
              {
                onSuccess: () => {
                  setNotification("İlaç geçici stok listesinden kaldırıldı!");
                },
                onError: (error) => {
                  setNotification("İlaç kaldırılırken hata oluştu: " + error.message);
                },
              }
            );
          }}
          color="error"
        >
          <Delete />
        </IconButton>
      ),
    },
  ];

  // Gizli Talepler için sütun tanımları
  const hiddenRequestColumns = [
    {
      header: "Talep No",
      accessor: "id",
    },
    {
      header: "Geri Al",
      accessor: "action",
      Cell: ({ row }) => (
        <Button
          variant="contained"
          startIcon={<Check />}
          onClick={() => handleUnhideRequest(row.id)}
          className="req_unhide-button"
        >
          Geri Al
        </Button>
      ),
    },
  ];

  // BufferedMedicines'a benzersiz id ekleme
  const bufferedMedicinesWithIds = bufferedMedicines?.map((item, index) => ({
    ...item,
    id: item.medicine_id || index,
  })) || [];

  // Gizli talepler için veri
  const hiddenRequestsData = requests?.filter((request) =>
    hiddenRequests.includes(request.id)
  ) || [];

  return (
    <div className="req_main-content">
      {/* Bildirim */}
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
            ) : visibleRequests && visibleRequests.length > 0 ? (
              <div className="req_list-scroll-container">
                <div className="req_button-group">
                  <Button
                    variant="contained"
                    onClick={() => setIsStockModalVisible(true)}
                    className="req_stock-button"
                  >
                    Geçici Stok Listesi
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setIsHiddenRequestsModalVisible(true)}
                    className="req_hidden-requests-button"
                  >
                    Gizli Talepler
                  </Button>
                </div>
                <Modal
                  title="Geçici Stok Listesi"
                  open={isStockModalVisible}
                  onCancel={() => setIsStockModalVisible(false)}
                  footer={null}
                  className="req_stock-modal"
                >
                  <DataTableErrorBoundary>
                    <INDataTable
                      data={bufferedMedicinesWithIds}
                      columns={bufferColumns}
                      rowHoverStyle={{ border: true }}
                      emptyText={
                        <span className="req_empty-list-text">
                          Geçici stok listesinde ilaç yok.
                        </span>
                      }
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                    />
                  </DataTableErrorBoundary>
                </Modal>
                <Modal
                  title="Gizli Talepler"
                  open={isHiddenRequestsModalVisible}
                  onCancel={() => setIsHiddenRequestsModalVisible(false)}
                  footer={null}
                  className="req_hidden-requests-modal"
                >
                  <DataTableErrorBoundary>
                    <INDataTable
                      data={hiddenRequestsData}
                      columns={hiddenRequestColumns}
                      rowHoverStyle={{ border: true }}
                      emptyText={
                        <span className="req_empty-list-text">
                          Gizli talep bulunamadı.
                        </span>
                      }
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                    />
                  </DataTableErrorBoundary>
                </Modal>
                <DataTableErrorBoundary>
                  <INDataTable
                    data={visibleRequests}
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
                </DataTableErrorBoundary>
              </div>
            ) : (
              <div className="req_empty-container req_fade-in req_pulse">
                <Empty
                  description={
                    <span className="empty-list-text">Şu an bekleyen talebiniz yok.</span>
                  }
                />
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
                  <div className="req_empty-container req_fade-in req_pulse">
                    <Empty
                      description={`Hata: Talep detayları yüklenemedi. ${requestDetailError.message}`}
                    />
                  </div>
                ) : !requestDetail || requestDetail.length === 0 ? (
                  <div className="req_empty-container req_fade-in req_pulse">
                    <Empty description="Talep detayları bulunamadı." />
                  </div>
                ) : (
                  <DataTableErrorBoundary>
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
                  </DataTableErrorBoundary>
                )}
              </div>

              <div className="req_bottom-footer-req">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={openPrevRequest}
                  disabled={isPrevDisabled}
                  className="req_nav-button"
                >
                  Önceki Talep
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Check />}
                  onClick={handleConfirmRequest}
                  disabled={!selectedRequest || (progress > -1 && progress < 100)}
                  className="req_action-button"
                  aria-label="respond-request"
                >
                  Talebi Yanıtla
                </Button>
                <Button
                  variant="contained"
                  startIcon={<VisibilityOff />}
                  onClick={handleHideRequest}
                  disabled={!selectedRequest}
                  className="req_action-button"
                  aria-label="hide-request"
                >
                  Talebi Gizle
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ArrowForward />}
                  onClick={openNextRequest}
                  disabled={isNextDisabled}
                  className="req_nav-button"
                >
                  Sonraki Talep
                </Button>
                {isMobile && (
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIos />}
                    onClick={() => setSelectedRequest(null)}
                    className="req_nav-button req_mobile-back"
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
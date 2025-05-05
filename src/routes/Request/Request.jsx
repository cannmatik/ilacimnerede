import React, { useEffect, useState, useRef } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import "./rstyle.scss";
import { Spin, Progress, Empty, App } from "antd";
import {
  useGetRequest,
  useGetRequestDetails,
  useResponseRequest,
  useGetResponseBuffer,
  useDeleteFromResponseBuffer,
  useHideRequest,
  useGetHiddenRequests,
  useDeleteHiddenRequest,
} from "./queries";
import { columns_requestDetail, columns } from "./constants/requestColumns";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
} from "@mui/material";
import { ArrowBack, ArrowForward, Check, ArrowBackIos, Delete, VisibilityOff, Storage } from "@mui/icons-material";
import { formatTurkishDate } from "./constants/requestColumns";

// Gizlenen talepler için sütun tanımları
const hiddenRequestColumns = [
  {
    header: "Talep No",
    accessor: "id",
  },
  {
    header: "Oluşturulma Tarihi",
    accessor: "create_date",
    Cell: ({ value }) => formatTurkishDate(value),
  },
  {
    header: "Mesaj",
    accessor: "message_text",
  },
  {
    header: "Sil",
    accessor: "action",
    Cell: ({ row }) => (
      <Button
        variant="text"
        color="error"
        startIcon={<Delete />}
        onClick={() => {
          console.log("Gizlenmiş talep silme:", {
            pharmacy_id: row.pharmacy_id,
            request_id: row.request_id,
          });
          row.deleteHiddenRequest({
            pharmacy_id: row.pharmacy_id,
            request_id: row.request_id,
          });
        }}
        sx={{ justifyContent: "center", width: "100%" }}
      >
        Sil
      </Button>
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
  const [openBufferDialog, setOpenBufferDialog] = useState(false); // Buffer dialog için state
  const [openHiddenDialog, setOpenHiddenDialog] = useState(false); // Hidden dialog için state
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
  const { data: hiddenRequests, isLoading: isHiddenRequestsLoading } = useGetHiddenRequests();
  const { mutate: responseRequestMutation } = useResponseRequest();
  const { mutate: deleteFromResponseBuffer } = useDeleteFromResponseBuffer();
  const { mutate: hideRequest } = useHideRequest();
  const { mutate: deleteHiddenRequest } = useDeleteHiddenRequest();

  // Verileri ve hataları konsola yazdır (hata ayıklama için)
  useEffect(() => {
    console.log("Request.jsx - requests:", requests);
    console.log("Request.jsx - requestDetail:", requestDetail);
    console.log("Request.jsx - requestDetailError:", requestDetailError);
    console.log("Request.jsx - bufferedMedicines:", bufferedMedicines);
    console.log("Request.jsx - hiddenRequests:", hiddenRequests);
    console.log("Request.jsx - selectedRequest:", selectedRequest);
    console.log("Request.jsx - notification:", notification);
  }, [requests, requestDetail, requestDetailError, bufferedMedicines, hiddenRequests, selectedRequest, notification]);

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

  // Talebi gizle
  const handleHideRequest = () => {
    if (!selectedRequest) return;
    hideRequest(
      {
        request_id: selectedRequest.id,
        pharmacy_id: pharmacyId,
      },
      {
        onSuccess: () => {
          setNotification("Talep başarıyla gizlendi!");
          setSelectedRequest(null);
        },
        onError: (error) => {
          setNotification("Talep gizlenirken hata oluştu: " + error.message);
        },
      }
    );
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
        <Button
          variant="text"
          color="error"
          startIcon={<Delete />}
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
          sx={{ justifyContent: "center", width: "100%" }}
        >
          Sil
        </Button>
      ),
    },
  ];

  // BufferedMedicines'a benzersiz id ekleme (key prop uyarısını çözmek için)
  const bufferedMedicinesWithIds = bufferedMedicines?.map((item, index) => ({
    ...item,
    id: item.medicine_id || index, // medicine_id yoksa index kullan
  })) || [];

  // HiddenRequests'e benzersiz id ve pharmacy_id ekleme
  const hiddenRequestsWithIds = hiddenRequests?.map((item, index) => ({
    ...item,
    id: item.request_id || index,
    pharmacy_id: pharmacyId,
    deleteHiddenRequest,
  })) || [];

  // Dialog açma/kapama işleyicileri
  const handleOpenBufferDialog = () => {
    setOpenBufferDialog(true);
  };

  const handleCloseBufferDialog = () => {
    setOpenBufferDialog(false);
  };

  const handleOpenHiddenDialog = () => {
    setOpenHiddenDialog(true);
  };

  const handleCloseHiddenDialog = () => {
    setOpenHiddenDialog(false);
  };

  return (
    <App>
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
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleOpenBufferDialog}
                      sx={{
                        backgroundColor: "#333",
                        "&:hover": { backgroundColor: "#25b597" },
                        minWidth: { xs: "auto", md: "150px" },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      {isMobile ? <Storage /> : "Geçici Stok Listesi"}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleOpenHiddenDialog}
                      sx={{
                        backgroundColor: "#333",
                        "&:hover": { backgroundColor: "#25b597" },
                        minWidth: { xs: "auto", md: "150px" },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      {isMobile ? <VisibilityOff /> : "Gizlenen Talepler"}
                    </Button>
                  </Box>
                  <Dialog
                    open={openBufferDialog}
                    onClose={handleCloseBufferDialog}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle>Geçici Stok Listesi</DialogTitle>
                    <DialogContent>
                      {bufferedMedicinesWithIds.length > 0 ? (
                        <INDataTable
                          data={bufferedMedicinesWithIds}
                          columns={bufferColumns}
                          rowHoverStyle={{ border: true }}
                        />
                      ) : (
                        <Typography className="req_empty-list-text">
                          Geçici stok listesinde ilaç yok.
                        </Typography>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleCloseBufferDialog}>Kapat</Button>
                    </DialogActions>
                  </Dialog>
                  <Dialog
                    open={openHiddenDialog}
                    onClose={handleCloseHiddenDialog}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle>Gizlenen Talepler</DialogTitle>
                    <DialogContent>
                      {isHiddenRequestsLoading ? (
                        <Spin size="large" />
                      ) : hiddenRequestsWithIds.length > 0 ? (
                        <INDataTable
                          data={hiddenRequestsWithIds}
                          columns={hiddenRequestColumns}
                          rowHoverStyle={{ border: true }}
                        />
                      ) : (
                        <Typography className="req_empty-list-text">
                          Gizlenmiş talep bulunamadı.
                        </Typography>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleCloseHiddenDialog}>Kapat</Button>
                    </DialogActions>
                  </Dialog>
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
                    defaultSort={{ key: "id", direction: "desc" }} // Varsayılan sıralama
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
                    sx={{
                      margin: { xs: 0, md: "0 8px" },
                      minWidth: { xs: "auto", md: "120px" },
                      p: { xs: 1, md: 2 },
                    }}
                  >
                    {isMobile ? null : "Önceki Talep"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Check />}
                    onClick={handleConfirmRequest}
                    disabled={!selectedRequest || (progress > -1 && progress < 100)}
                    sx={{
                      margin: { xs: 0, md: "0 8px" },
                      minWidth: { xs: "auto", md: "120px" },
                      p: { xs: 1, md: 2 },
                    }}
                    aria-label="respond-request"
                  >
                    {isMobile ? null : "Talebi Yanıtla"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<VisibilityOff />}
                    onClick={handleHideRequest}
                    disabled={!selectedRequest}
                    sx={{
                      margin: { xs: 0, md: "0 8px" },
                      minWidth: { xs: "auto", md: "120px" },
                      p: { xs: 1, md: 2 },
                      backgroundColor: "#666",
                      "&:hover": { backgroundColor: "#25b597" },
                    }}
                    aria-label="hide-request"
                  >
                    {isMobile ? null : "Talebi Gizle"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowForward />}
                    onClick={openNextRequest}
                    disabled={isNextDisabled}
                    sx={{
                      margin: { xs: 0, md: "0 8px" },
                      minWidth: { xs: "auto", md: "120px" },
                      p: { xs: 1, md: 2 },
                    }}
                  >
                    {isMobile ? null : "Sonraki Talep"}
                  </Button>
                  {isMobile && (
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIos />}
                      onClick={() => setSelectedRequest(null)}
                      sx={{
                        margin: { xs: 0, md: "0 8px" },
                        minWidth: "100%",
                        p: { xs: 1, md: 2 },
                      }}
                      aria-label="mobile-back"
                    >
                      {isMobile ? null : "Geri"}
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
    </App>
  );
}

export default Request;
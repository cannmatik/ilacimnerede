import React, { useEffect, useState, useRef } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import "./rstyle.scss";
import { Spin, Progress, Empty, Modal } from "antd";
import {
  useGetRequest,
  useGetRequestDetails,
  useResponseRequest,
} from "./queries";
import { columns_requestDetail, columns } from "./constants/requestColumns";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";
import { LeftOutlined } from "@ant-design/icons";

function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [progress, setProgress] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [messageText, setMessageText] = useState("");
  const touchTime = useRef(0);

  // Bildirim izniyle ilgili popup ve buton state'leri
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);

  const pharmacyId = useSelector(selectUserPharmacyId);

  // Queries
  const { data: requests, isLoading } = useGetRequest();
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);
  const { mutate: responseRequestMutation } = useResponseRequest();

  // Ekran boyutu değişimi
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Seçili request değişince row selection reset
  useEffect(() => {
    setSelectedRows([]);
    setMessageText("");
  }, [selectedRequest?.id]);

  // Sadece bir kez => bildirim izni sormak
  useEffect(() => {
    const askedBefore = localStorage.getItem("notificationAsked");
    if ("Notification" in window) {
      if (!askedBefore && Notification.permission === "default") {
        // Mobil => buton göster, Masaüstü => modal göster
        if (isMobile) {
          setShowPermissionButton(true);
        } else {
          setShowPermissionModal(true);
        }
      }
    }
  }, [isMobile]);

  // Masaüstü modal: "Evet" deyince requestPermission
  const handlePermissionOk = () => {
    setShowPermissionModal(false);
    localStorage.setItem("notificationAsked", "true");
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Bildirim izni verildi (masaüstü)!");
      } else {
        console.log("Bildirim izni reddedildi (masaüstü)!");
      }
    });
  };

  // Masaüstü modal: "Hayır" deyince kapat
  const handlePermissionCancel = () => {
    setShowPermissionModal(false);
    localStorage.setItem("notificationAsked", "true");
  };

  // Mobil buton: tıklayınca requestPermission
  const handleMobilePermission = () => {
    Notification.requestPermission().then((permission) => {
      localStorage.setItem("notificationAsked", "true");
      setShowPermissionButton(false);
      if (permission === "granted") {
        console.log("Bildirim izni verildi (mobil)!");
      } else {
        console.log("Bildirim izni reddedildi (mobil)!");
      }
    });
  };

  // Mobil double-tap logic
  const handleDoubleTap = (row) => {
    const now = new Date().getTime();
    const doubleTapDelay = 300;
    if (touchTime.current + doubleTapDelay > now) {
      const isSelected = selectedRows.some(
        (item) => item.id === row.original.id
      );
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

  // Önceki talep butonu
  const openPrevRequest = () => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    if (currentIndex > 0) {
      setSelectedRequest(requests[currentIndex - 1]);
      setSelectedRows([]);
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
  };

  // Sonraki talep butonu
  const openNextRequest = () => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    if (currentIndex < requests?.length - 1) {
      setSelectedRequest(requests[currentIndex + 1]);
      setSelectedRows([]);
      setIsNextDisabled(currentIndex + 1 >= requests?.length - 1);
    } else {
      setIsNextDisabled(true);
    }
  };

  // Prev/Next disabled ayarı
  useEffect(() => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= requests?.length - 1);
  }, [selectedRequest, requests]);

  // Talebi Yanıtla
  const handleConfirmRequest = async () => {
    setProgress(0);
    setMessageText("");
    setSelectedRows([]);

    const selectedRowsIds = selectedRows.map(({ id }) => id);
    const checkedRequestDetails = selectedRows.map(({ id }) => ({
      request_item_id: id,
      status: true,
    }));
    const uncheckedRequestDetails = requestDetail
      ?.filter(({ id }) => !selectedRowsIds.includes(id))
      .map(({ id }) => ({
        request_item_id: id,
        status: false,
      }));

    const response = {
      request_id: selectedRequest?.id,
      pharmacy_id: pharmacyId,
      create_date: new Date().toISOString(),
      message_text: messageText,
    };

    const finalData = [...checkedRequestDetails, ...uncheckedRequestDetails];

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);

    try {
      await responseRequestMutation({ finalData, response });
      setProgress(100);
      setSelectedRows([]);
      const currentIndex = requests?.findIndex(
        (item) => item.id === selectedRequest?.id
      );
      if (currentIndex < requests?.length - 1) {
        setSelectedRequest(requests[currentIndex + 1]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      setProgress(-1);
    } finally {
      clearInterval(interval);
      setTimeout(() => setProgress(-1), 2000);
    }
  };

  // Seçili request yoksa row selection reset
  useEffect(() => {
    if (!selectedRequest) {
      setSelectedRows([]);
    }
  }, [selectedRequest]);

  return (
    <div className="main-content">
      {/* Masaüstü => bildirim izni modal */}
      <Modal
        open={showPermissionModal}
        onOk={handlePermissionOk}
        onCancel={handlePermissionCancel}
        okText="Evet"
        cancelText="Hayır"
        title="Önemli Taleplerden Haberdar Olmak İster Misiniz?"
      >
        <p>
          Yeni talepler geldiğinde tarayıcı bildirimi aracılığıyla anında
          haberdar olmak ister misiniz?
        </p>
      </Modal>

      <Row>
        {(!isMobile || !selectedRequest) && (
          <Col xs={12} md={6} className="table-container">
            {isLoading ? (
              <div className="spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="list-scroll-container">
                <INDataTable
                  data={requests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  setSelectedRows={setSelectedRows}
                  onRowClick={(row) => setSelectedRequest(row.original)}
                />
              </div>
            ) : (
              <div className="empty-container fade-in pulse">
                <Empty description="Şu an bekleyen talebiniz yok." />
              </div>
            )}
          </Col>
        )}

        {selectedRequest && (
          <Col xs={12} md={6} className="request-table">
            <div className="right-panel">
              <div className="right-header">
                <div className="request-info">
                  <span>Talep Numarası: {selectedRequest?.id}</span>
                  <span>Mesaj: {selectedRequest?.message_text}</span>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="message-input"
                  />
                </div>
              </div>

              <div className="table-scroll-container">
                <INDataTable
                  key={selectedRequest?.id || "request-detail-table"}
                  data={requestDetail || []}
                  columns={columns_requestDetail}
                  rowHoverStyle={{ border: true, background: !isMobile }}
                  checkboxed={[]}
                  setSelectedRows={setSelectedRows}
                  unSelectAllOnTabChange={selectedRequest}
                  rowClassName={(row) =>
                    `${
                      row.getIsSelected() ? "selected-row" : "unselected-row"
                    } ${isMobile ? "mobile-row" : ""}`
                  }
                  onRowClick={(row) => isMobile && handleDoubleTap(row)}
                />
              </div>

              <div className="bottom-footer">
                <INButton
                  onClick={openPrevRequest}
                  text="Önceki Talep"
                  disabled={isPrevDisabled}
                  className="nav-button"
                />
                <INButton
                  onClick={handleConfirmRequest}
                  text="Talebi Yanıtla"
                  disabled={!selectedRequest || (progress > -1 && progress < 100)}
                  className="nav-button"
                />
                <INButton
                  onClick={openNextRequest}
                  text="Sonraki Talep"
                  disabled={isNextDisabled}
                  className="nav-button"
                />
                {isMobile && (
                  <INButton
                    onClick={() => setSelectedRequest(null)}
                    text={
                      <>
                        <LeftOutlined style={{ marginRight: 4 }} />
                        Geri
                      </>
                    }
                    className="mobileBack"
                  />
                )}
              </div>
            </div>
          </Col>
        )}
      </Row>

      {/* Progress bar */}
      {progress > -1 && (
        <div className="progress-container">
          <Progress
            percent={progress}
            status={progress === 100 ? "success" : "active"}
            style={{ marginTop: "20px", height: "30px" }}
          />
        </div>
      )}

      {/* Mobil => "Bildirimlere İzin Ver" butonu */}
      {showPermissionButton && (
        <div className="permission-button-container">
          <INButton onClick={handleMobilePermission} text="Bildirimlere İzin Ver" />
        </div>
      )}
    </div>
  );
}

export default Request;

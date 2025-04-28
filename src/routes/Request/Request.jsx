import React, { useEffect, useState, useRef } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import "./rstyle.scss";
import { Spin, Progress, Empty, Collapse, List } from "antd";
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
import { LeftOutlined } from "@ant-design/icons";
import { Delete } from "@mui/icons-material";

function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [progress, setProgress] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
  } = useGetRequestDetails(selectedRequest?.id);
  const { data: bufferedMedicines } = useGetResponseBuffer();
  const { mutate: responseRequestMutation } = useResponseRequest();
  const { mutate: deleteFromResponseBuffer } = useDeleteFromResponseBuffer();

  // Log data for debugging
  useEffect(() => {
    console.log("requestDetail:", requestDetail);
    console.log("bufferedMedicines:", bufferedMedicines);
  }, [requestDetail, bufferedMedicines]);

  // Clear selection and message when request changes
  useEffect(() => {
    setSelectedRows([]);
    setMessageText("");
  }, [selectedRequest?.id]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle double-tap for mobile selection
  const handleDoubleTap = (row) => {
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

  // Navigate to previous request
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

  // Navigate to next request
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

  // Update navigation button states
  useEffect(() => {
    const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= (requests?.length || 0) - 1);
  }, [selectedRequest, requests]);

  // Handle request submission
  const handleConfirmRequest = async () => {
    setProgress(0);
    setMessageText("");

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
    };

    const finalData = [...checkedRequestDetails, ...uncheckedRequestDetails];

    // Identify medicines to remove from response_buffer (deselected items)
    const selectedMedicineIds = selectedRows.map((row) => row.medicine_id);
    const medicinesToRemove = bufferedMedicines
      .filter((item) => !selectedMedicineIds.includes(item.medicine_id))
      .map((item) => item.medicine_id);

    console.log("Medicines to remove from response_buffer:", medicinesToRemove);

    // Remove deselected medicines from response_buffer
    if (medicinesToRemove.length > 0 && pharmacyId) {
      for (const medicine_id of medicinesToRemove) {
        try {
          console.log("Removing from response_buffer:", { pharmacy_id, medicine_id });
          await deleteFromResponseBuffer({ pharmacy_id: pharmacyId, medicine_id });
        } catch (error) {
          console.error("Failed to remove from response_buffer:", error);
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
      setSelectedRows([]);
      const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
      if (currentIndex < (requests?.length || 0) - 1) {
        setSelectedRequest(requests[currentIndex + 1]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      setProgress(-1);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setProgress(-1);
      }, 2000);
    }
  };

  // Clear selection when no request is selected
  useEffect(() => {
    if (!selectedRequest) {
      setSelectedRows([]);
    }
  }, [selectedRequest]);

  return (
    <div className="main-content">
      <Row>
        {(!isMobile || !selectedRequest) && (
          <Col xs={12} md={6} className="table-container">
            {isRequestsLoading ? (
              <div className="spin-container center-content pulse">
                <Spin size="large" />
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="list-scroll-container">
                <Collapse
                  items={[
                    {
                      key: "1",
                      label: "Geçici Stok Listesi",
                      children: (
                        <List
                          dataSource={bufferedMedicines}
                          renderItem={(item) => (
                            <List.Item
                              actions={[
                                <Delete
                                  style={{ cursor: "pointer", color: "red" }}
                                  onClick={() => {
                                    console.log("Manual delete from buffer:", {
                                      pharmacy_id: pharmacyId,
                                      medicine_id: item.medicine_id,
                                    });
                                    deleteFromResponseBuffer({
                                      pharmacy_id: pharmacyId,
                                      medicine_id: item.medicine_id,
                                    });
                                  }}
                                />,
                              ]}
                            >
                              {item.medicine_name} (ID: {item.medicine_id})
                            </List.Item>
                          )}
                          locale={{ emptyText: "Geçici stok listesinde ilaç yok." }}
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
                      ? "blink-row"
                      : ""
                  }
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
                {isRequestDetailLoading ? (
                  <Spin size="large" />
                ) : (
                  <INDataTable
                    key={selectedRequest?.id || "request-detail-table"}
                    data={requestDetail || []}
                    columns={columns_requestDetail}
                    rowHoverStyle={{ border: true, background: !isMobile }}
                    checkboxed={true}
                    setSelectedRows={setSelectedRows}
                    unSelectAllOnTabChange={selectedRequest?.id || ""}
                    bufferedMedicines={bufferedMedicines}
                    deleteFromResponseBuffer={deleteFromResponseBuffer}
                    isLoading={isRequestDetailLoading}
                    rowClassName={(row) =>
                      `${
                        row.getIsSelected() ? "selected-row" : "unselected-row"
                      } ${isMobile ? "mobile-row" : ""}`
                    }
                    onRowClick={(row) => isMobile && handleDoubleTap(row)}
                  />
                )}
              </div>

              <div className="bottom-footer-req">
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

      {progress > -1 && (
        <div className="progress-container">
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
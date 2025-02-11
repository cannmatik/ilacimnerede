import React, { useEffect, useState, useRef } from "react";
import { Col, Row } from "react-grid-system";
import { INButton, INDataTable } from "@components";
import "./style.scss";
import { before, next } from "@assets";
import { Spin, Progress, Empty } from "antd";
import {
  useGetRequest,
  useGetRequestDetails,
  useResponseRequest,
} from "./queries";
import { columns_requestDetail, columns } from "./constants/requestColumns";
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";

function Request() {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState();
  const [selectedRows, setSelectedRows] = useState([]);
  const [progress, setProgress] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const pharmacyId = useSelector(selectUserPharmacyId);
  const touchTime = useRef(0);
  const [messageText, setMessageText] = useState("");

  const { data: requests, isLoading } = useGetRequest();
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);
  const { mutate: responseRequestMutation } = useResponseRequest();
  useEffect(() => {
    setSelectedRows([]);
    setMessageText("");
  }, [selectedRequest?.id]); // Her request değişiminde temizlik

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDoubleTap = (row) => {
    const now = new Date().getTime();
    const doubleTapDelay = 300;

    if (touchTime.current + doubleTapDelay > now) {
      const isSelected = selectedRows.some(item => item.id === row.original.id);
      setSelectedRows(prev => 
        isSelected 
          ? prev.filter(item => item.id !== row.original.id)
          : [...prev, row.original]
      );
      touchTime.current = 0;
    } else {
      touchTime.current = now;
    }
  };



  const openPrevRequest = () => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    if (currentIndex > 0) {
      setSelectedRequest(requests[currentIndex - 1]);
      setSelectedRows([]); // Clear selected rows
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
  };

  const openNextRequest = () => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    if (currentIndex < requests?.length - 1) {
      setSelectedRequest(requests[currentIndex + 1]);
      setSelectedRows([]); // Clear selected rows
      setIsNextDisabled(currentIndex + 1 >= requests?.length - 1);
    } else {
      setIsNextDisabled(true);
    }
  };

  useEffect(() => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= requests?.length - 1);
  }, [selectedRequest, requests]);

  const handleConfirmRequest = async () => {
    setProgress(0);
    setMessageText(""); // Clear message input
    setSelectedRows([]); // Clear selected rows

    const selectedRowsIds = selectedRows.map(({ id }) => id);
    const checkedRequestDetails = selectedRows.map(({ id }) => ({
      request_item_id: id,
      status: true,
    }));

    const uncheckedRequestDetails = requestDetail
      .filter(({ id }) => !selectedRowsIds.includes(id))
      .map(({ id }) => ({
        request_item_id: id,
        status: false,
      }));

    const response = {
      request_id: selectedRequest?.id,
      pharmacy_id: pharmacyId,
      create_date: new Date().toISOString(),
      message_text: messageText, // Add message to request
    };

    const finalData = [...checkedRequestDetails, ...uncheckedRequestDetails];

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
      setSelectedRows([]); // Clear selected rows after response
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
      setTimeout(() => {
        setProgress(-1);
      }, 2000);
    }
  };

  useEffect(() => {
    if (!selectedRequest) {
      setSelectedRows([]); // Clear selected rows when no request is selected
    }
  }, [selectedRequest]);

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
            ) : requests && requests.length > 0 ? (
              <div className="fade-in" style={{ width: "100%" }}>
                <INDataTable
                  data={requests}
                  columns={columns}
                  rowHoverStyle={{ border: true }}
                  setSelectedRows={setSelectedRows}
                  onRowClick={(row) => setSelectedRequest(row.original)}
                />
              </div>
            ) : (
              <div className="center-content fade-in pulse">
                <Empty description="Şu an bekleyen talep yok." />
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

            <INDataTable
              key={selectedRequest?.id || 'request-detail-table'} // Yeni key prop
              data={requestDetail || []}
              columns={columns_requestDetail}
              rowHoverStyle={{ border: true, background: !isMobile }}
              checkboxed={[]} // This hides checkbox column on mobile
              setSelectedRows={setSelectedRows}
              unSelectAllOnTabChange={selectedRequest}
              rowClassName={(row) =>
                `${row.getIsSelected() ? 'selected-row' : 'unselected-row'} ${isMobile ? 'mobile-row' : ''}`
              }
              onRowClick={(row) => isMobile && handleDoubleTap(row)}
            />

            <div className="request-accept-footer">
              <img
                src={before}
                className={`prev-or-next ${isPrevDisabled ? "disabled" : "enabled"}`}
                onClick={openPrevRequest}
                alt="Önceki Talep"
              />
              <INButton
                flex={true}
                onClick={handleConfirmRequest}
                text="Talebi Yanıtla"
                disabled={!selectedRequest || (progress > -1 && progress < 100)}
              />
              <img
                src={next}
                className={`prev-or-next ${isNextDisabled ? "disabled" : "enabled"}`}
                onClick={!isNextDisabled ? openNextRequest : undefined}
                alt="Sonraki Talep"
              />
            </div>
          </Col>
        ) : null}
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
    </>
  );
}

export default Request;
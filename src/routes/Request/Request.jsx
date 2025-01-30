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

  const { data: requests, isLoading } = useGetRequest();
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);
  const { mutate: responseRequestMutation } = useResponseRequest();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDoubleTap = (row) => {
    const now = new Date().getTime();
    const doubleTapDelay = 300; // Delay for detecting double-tap
  
    if (touchTime.current + doubleTapDelay > now) {
      row.toggleSelected(); // Toggle selection on double-tap
      touchTime.current = 0; // Reset the touch time
    } else {
      touchTime.current = now; // Update the time for single tap
    }
  };

  const openPrevRequest = () => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    if (currentIndex > 0) {
      setSelectedRequest(requests[currentIndex - 1]);
      setIsPrevDisabled(false);
    } else {
      setIsPrevDisabled(true);
    }
  };
  const openNextRequest = () => {
    const currentIndex = requests?.findIndex(
      (item) => item.id === selectedRequest?.id
    );
    console.log(currentIndex); // Burada currentIndex'i kontrol edin
    if (currentIndex < requests?.length - 1) {
      setSelectedRequest(requests[currentIndex + 1]);
      // Burada isNextDisabled'ı doğru şekilde güncelleyin
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
      setSelectedRows([]);
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
              <span>Mesaj: {selectedRequest?.prescript_no}</span>
            </div>
            <INDataTable
  data={requestDetail || []}
  columns={columns_requestDetail}
  rowHoverStyle={{ border: true, background: !isMobile }}
  checkboxed={ [] } // This hides checkbox column on mobile
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
                className={`prev-or-next ${
                  isPrevDisabled ? "disabled" : "enabled"
                }`}
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
                className={`prev-or-next ${
                  isNextDisabled ? "enabled" : "disabled"
                }`}
                onClick={openNextRequest}
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
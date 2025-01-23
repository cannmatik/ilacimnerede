import React, { useEffect, useState } from "react";
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
  const pharmacyId = useSelector(selectUserPharmacyId);

  const { data: requests, isLoading } = useGetRequest();
  const { data: requestDetail } = useGetRequestDetails(selectedRequest?.id);
  const { mutate: responseRequestMutation } = useResponseRequest();

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
    if (currentIndex < requests?.length - 1) {
      setSelectedRequest(requests[currentIndex + 1]);
      setIsNextDisabled(false);
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
        if (prevProgress >= 90) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 10;
      });
    }, 100);

    try {
      await responseRequestMutation({ finalData, response });
      setProgress(100);
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

  return (
    <>
      <br />
      <Row>
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
        {requests && requests.length > 0 && (
          <Col xs={12} md={6} className="request-table">
            <div className="request-info">
              <span>Talep Numarası: {selectedRequest?.id}</span>
              <span>Mesaj: {selectedRequest?.prescript_no}</span>
            </div>
            <INDataTable
              data={requestDetail || []}
              columns={columns_requestDetail}
              rowHoverStyle={{ border: true }}
              checkboxed={true}
              setSelectedRows={setSelectedRows}
              unSelectAllOnTabChange={selectedRequest}
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
                disabled={progress > -1 && progress < 100}
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
        )}
      </Row>

      {progress > -1 && (
        <Progress
          percent={progress}
          status={progress === 100 ? "success" : "active"}
          style={{ marginTop: "20px" }}
        />
      )}
    </>
  );
}

export default Request;
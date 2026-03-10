import React, { useState, useEffect } from "react";
import { Spin, Empty } from "antd";
import { supabase } from "@routes/Login/useCreateClient";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { INDataTable } from "@components";
import Grid from "@mui/material/Grid";
import { DataGrid } from "@mui/x-data-grid";
import { useGetFetchedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import "./arstyle.scss";
import { Button, Box, Typography, Paper, Alert } from "@mui/material";
import { ArrowBack, ArrowForward, Delete, ArrowBackIos } from "@mui/icons-material";

// Error Boundary Component
class DataTableErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="answered-empty-container fade-in pulse">
          <Empty description="Tablo yüklenirken bir hata oluştu." />
        </div>
      );
    }
    return this.props.children;
  }
}

const AnsweredResponse = () => {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedRows, setSelectedRows] = useState([]); // Added for INDataTable

  // Sorgular
  const {
    data: answeredRequests = [],
    isLoading: isRequestsLoading,
    refetch,
  } = useGetFetchedRequests(pharmacyId);

  const {
    data: answeredRequestDetails = [],
    isLoading: isDetailsLoading,
    error: detailsError,
    isFetching: isDetailsFetching,
  } = useGetRequestDetails(selectedRequest?.request_id, selectedRequest?.id);

  // Hata ayıklama logları
  useEffect(() => {
    console.log("AnsweredResponse.jsx - answeredRequests:", answeredRequests);
    console.log("AnsweredResponse.jsx - answeredRequestDetails:", answeredRequestDetails);
    console.log("AnsweredResponse.jsx - detailsError:", detailsError);
    console.log("AnsweredResponse.jsx - isDetailsLoading:", isDetailsLoading);
    console.log("AnsweredResponse.jsx - isDetailsFetching:", isDetailsFetching);
    console.log("AnsweredResponse.jsx - selectedRequest:", selectedRequest);
    console.log("AnsweredResponse.jsx - selectedRows:", selectedRows);
  }, [
    answeredRequests,
    answeredRequestDetails,
    detailsError,
    isDetailsLoading,
    isDetailsFetching,
    selectedRequest,
    selectedRows,
  ]);

  // Yeniden veri çekme
  useEffect(() => {
    if (pharmacyId) refetch();
  }, [pharmacyId, refetch]);

  // Responsive kontrol
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Önceki / Sonraki talep
  const openPrevRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex > 0) {
      setSelectedRequest(answeredRequests[currentIndex - 1]);
    }
  };

  const openNextRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex < answeredRequests.length - 1) {
      setSelectedRequest(answeredRequests[currentIndex + 1]);
    }
  };

  // Talep silme (Verilen yanıtı geri alma)
  const handleDeleteRequest = async (responseId) => {
    setLoading(true);
    setNotification("");

    try {
      const { error } = await supabase.from("response").delete().eq("id", responseId);
      if (error) throw error;

      setNotification("Yanıt başarıyla geri alındı.");
      refetch();

      // Sonrakine geç
      const currentIndex = answeredRequests.findIndex(
        (item) => item.request_id === selectedRequest?.request_id
      );
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

  // Buton aktifliklerini güncelle
  useEffect(() => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= answeredRequests.length - 1);
  }, [selectedRequest, answeredRequests]);

  return (
    <Box sx={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      pt: "100px", 
      px: { xs: 2, md: 3 }, 
      pb: { xs: 2, md: 3 },
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Bildirim sayfanın üst kısmında gösteriliyor */}
      {notification && (
        <Box sx={{ 
          position: "fixed", 
          top: 80, 
          left: "50%", 
          transform: "translateX(-50%)", 
          zIndex: 1200,
          width: "auto",
          minWidth: "300px"
        }}>
          <Alert 
            severity={notification.includes("başarı") ? "success" : "error"} 
            variant="filled"
            sx={{ borderRadius: '12px', boxShadow: 3 }}
          >
            {notification}
          </Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Grid container spacing={3} sx={{ height: "100%" }}>
          {(!isMobile || !selectedRequest) && (
            <Grid size={{ xs: 12, md: selectedRequest ? 5 : 12 }} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Paper sx={{ 
                flex: 1, 
                width: "100%", 
                overflow: "hidden", 
                p: 1, 
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
              }}>
                <DataGrid
                  rows={answeredRequests}
                  columns={columns}
                  loading={isRequestsLoading}
                  getRowId={(row) => String(row.id)}
                  rowSelectionModel={selectedRequest ? { type: 'include', ids: new Set([String(selectedRequest.id)]) } : { type: 'include', ids: new Set() }}
                  onRowClick={(params) => setSelectedRequest(params.row)}
                  density="comfortable"
                  disableRowSelectionOnClick
                  hideFooter
                  sx={{
                    border: 'none',
                    "& .MuiDataGrid-columnHeaders": { 
                      bgcolor: "rgba(244, 247, 251, 0.5)",
                      borderBottom: '1px solid rgba(0,0,0,0.05)'
                    },
                    "& .MuiDataGrid-row:hover": { 
                      bgcolor: "rgba(37, 181, 151, 0.08)", 
                      cursor: "pointer" 
                    },
                    "& .MuiDataGrid-row.Mui-selected": { 
                      bgcolor: "rgba(37, 181, 151, 0.15) !important" 
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: '1px solid rgba(0,0,0,0.03)'
                    }
                  }}
                />
              </Paper>
            </Grid>
          )}

          {selectedRequest && (
            <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Paper sx={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                p: { xs: 2, md: 3 }, 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
                overflow: "hidden" 
              }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight={700} color="primary" sx={{ fontSize: '1.1rem' }}>
                      Talep Numarası: #{selectedRequest?.request_id}
                    </Typography>
                    {!isMobile && (
                      <Button 
                        size="small" 
                        variant="text" 
                        color="inherit" 
                        onClick={() => setSelectedRequest(null)}
                        sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                      >
                        Kapat
                      </Button>
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    "{selectedRequest?.message_text || "Mesaj yok"}"
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <DataGrid
                    rows={answeredRequestDetails}
                    columns={columns_requestDetail}
                    loading={isDetailsLoading || isDetailsFetching}
                    getRowId={(row) => String(row.id)}
                    density="comfortable"
                    disableRowSelectionOnClick
                    hideFooter
                    sx={{
                      border: 'none',
                      "& .MuiDataGrid-columnHeaders": { 
                        bgcolor: "rgba(244, 247, 251, 0.5)",
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                      },
                      "& .MuiDataGrid-row:hover": { bgcolor: "rgba(37, 181, 151, 0.05)" },
                      "& .MuiDataGrid-cell": {
                        borderBottom: '1px solid rgba(0,0,0,0.03)'
                      }
                    }}
                  />
                </Box>

                <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexDirection: isMobile ? "column" : "row" }}>
                    {!isMobile && (
                      <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={openPrevRequest}
                        disabled={isPrevDisabled}
                        sx={{ textTransform: "none", minWidth: 140, borderRadius: '12px' }}
                      >
                        Önceki
                      </Button>
                    )}
                    
                    <Button
                      variant="contained"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteRequest(selectedRequest?.id)}
                      disabled={loading}
                      color="error"
                      sx={{ 
                        textTransform: "none", 
                        minWidth: 180, 
                        borderRadius: '12px',
                        py: isMobile ? 1.5 : 1
                      }}
                    >
                      Yanıtı Geri Al
                    </Button>

                    {!isMobile && (
                      <Button
                        variant="outlined"
                        endIcon={<ArrowForward />}
                        onClick={openNextRequest}
                        disabled={isNextDisabled}
                        sx={{ textTransform: "none", minWidth: 140, borderRadius: '12px' }}
                      >
                        Sonraki
                      </Button>
                    )}

                    {isMobile && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<ArrowBack />}
                          onClick={openPrevRequest}
                          disabled={isPrevDisabled}
                          sx={{ borderRadius: '10px' }}
                        />
                        <Button
                          variant="outlined"
                          fullWidth
                          endIcon={<ArrowForward />}
                          onClick={openNextRequest}
                          disabled={isNextDisabled}
                          sx={{ borderRadius: '10px' }}
                        />
                      </Box>
                    )}

                    {isMobile && (
                      <Button
                        variant="outlined"
                        startIcon={<ArrowBackIos />}
                        onClick={() => setSelectedRequest(null)}
                        fullWidth
                        sx={{ borderRadius: '10px' }}
                      >
                        Geri
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default AnsweredResponse;  
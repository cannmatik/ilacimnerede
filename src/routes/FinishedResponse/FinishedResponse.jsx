import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid";
import { useGetFinishedRequests, useGetRequestDetails } from "./queries";
import { columns, columns_requestDetail } from "./constants/responseColumns";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import { 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  useMediaQuery,
  useTheme,
  Paper
} from "@mui/material";
import { ArrowBack, ArrowForward, ArrowBackIos } from "@mui/icons-material";

function FinishedResponse() {
  const pharmacyId = useSelector(selectUserPharmacyId);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Sorgular
  const { data: answeredRequests = [], isLoading: isRequestsLoading } = useGetFinishedRequests(pharmacyId);
  const {
    data: answeredRequestDetails = [],
    isLoading: isDetailsLoading,
    error: detailsError,
    isFetching: isDetailsFetching,
  } = useGetRequestDetails(selectedRequest?.request_id, selectedRequest?.id, pharmacyId);

  // Önceki talep
  const openPrevRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex > 0) {
      setSelectedRequest(answeredRequests[currentIndex - 1]);
    }
  };

  // Sonraki talep
  const openNextRequest = () => {
    const currentIndex = answeredRequests.findIndex(
      (item) => item.request_id === selectedRequest?.request_id
    );
    if (currentIndex < answeredRequests.length - 1) {
      setSelectedRequest(answeredRequests[currentIndex + 1]);
    }
  };

  // Buton aktifliklerini güncelle
  useEffect(() => {
    if (!selectedRequest || !answeredRequests.length) return;
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
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Grid container spacing={3} sx={{ height: "100%" }}>
          {/* Sol Panel: Biten Talepler Listesi */}
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
                    display: answeredRequests.length > 0 || isRequestsLoading ? "flex" : "none",
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
                {!isRequestsLoading && answeredRequests.length === 0 && (
                  <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                    <Typography variant="body1" color="text.secondary">
                      Kapatılan talebiniz yok.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          {/* Sağ Panel: Talep Detayı */}
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
                {/* Sağ Panel Başlık */}
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

                {/* Detay Tablosu (DataGrid) */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {detailsError && (
                    <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                      <Typography color="error">
                        Hata: Detaylar yüklenemedi. {detailsError.message}
                      </Typography>
                    </Box>
                  )}
                  <DataGrid
                    rows={answeredRequestDetails}
                    columns={columns_requestDetail}
                    loading={isDetailsLoading || isDetailsFetching}
                    getRowId={(row) => String(row.id)}
                    disableRowSelectionOnClick
                    disableVirtualization
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
                  {!isDetailsLoading && !isDetailsFetching && !detailsError && (!answeredRequestDetails || answeredRequestDetails.length === 0) && (
                    <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                      <Typography variant="body1" color="text.secondary">
                        Talep detayı bulunamadı.
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Sağ Panel Footer */}
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

}

export default FinishedResponse;
import React, { useEffect, useState, useRef, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Grid,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  CircularProgress,
  LinearProgress,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";
import {
  ArrowBack,
  ArrowForward,
  Check,
  ArrowBackIos,
  Delete,
  VisibilityOff,
  Storage,
} from "@mui/icons-material";

// Queries
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

// Constants & Formatters
import {
  columns,
  columns_requestDetail,
  formatTurkishDate,
} from "./constants/requestColumns";

// Redux
import { useSelector } from "react-redux";
import { selectUserPharmacyId } from "@store/selectors";

function Request() {
  const theme = useTheme();
  // MUI useMediaQuery with down("md") matches the 768px breakpoint conventionally
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // MUI X v8: rowSelectionModel uses { type: 'include' | 'exclude', ids: Set } format
  const emptySelection = { type: 'include', ids: new Set() };
  const [rowSelectionModel, setRowSelectionModel] = useState(emptySelection);

  const [progress, setProgress] = useState(-1);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [openBufferDialog, setOpenBufferDialog] = useState(false);
  const [openHiddenDialog, setOpenHiddenDialog] = useState(false);
  const touchTime = useRef(0);
  const [messageText, setMessageText] = useState("");

  const pharmacyId = useSelector(selectUserPharmacyId);

  // Query Hooks
  const { data: requests, isLoading: isRequestsLoading, highlightedRequestIds = [] } = useGetRequest();
  const { data: requestDetail, isLoading: isRequestDetailLoading, error: requestDetailError } = useGetRequestDetails(selectedRequest?.id);
  const { data: bufferedMedicines } = useGetResponseBuffer();
  const { data: hiddenRequests, isLoading: isHiddenRequestsLoading } = useGetHiddenRequests();

  // Mutation Hooks
  const { mutate: responseRequestMutation } = useResponseRequest();
  const { mutate: deleteFromResponseBuffer } = useDeleteFromResponseBuffer();
  const { mutate: hideRequest } = useHideRequest();
  const { mutate: deleteHiddenRequest } = useDeleteHiddenRequest();

  // Selected request check & reset logic
  useEffect(() => {
    setRowSelectionModel({ type: 'include', ids: new Set() });
    setMessageText("");
  }, [selectedRequest?.id]);

  useEffect(() => {
    const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
    setIsPrevDisabled(currentIndex <= 0);
    setIsNextDisabled(currentIndex >= (requests?.length || 0) - 1);
  }, [selectedRequest, requests]);

  useEffect(() => {
    if (!selectedRequest) {
      setRowSelectionModel({ type: 'include', ids: new Set() });
    }
  }, [selectedRequest]);

  // Stablize detail rows to prevent unnecessary re-computes/re-renders
  const requestDetailRows = useMemo(() => {
    if (isRequestDetailLoading || !requestDetail) return [];
    return requestDetail.map(row => ({
      ...row,
      id: String(row.id) // Reinforced string ID
    }));
  }, [requestDetail, isRequestDetailLoading]);

  // Ensure rowSelectionModel only contains valid string IDs that exist in the current rows
  const safeRowSelectionModel = useMemo(() => {
    if (!requestDetailRows || requestDetailRows.length === 0) {
      return { type: 'include', ids: new Set() };
    }
    const currentIds = rowSelectionModel?.ids;
    if (!currentIds || !(currentIds instanceof Set)) {
      return { type: 'include', ids: new Set() };
    }
    const validIds = new Set(requestDetailRows.map((r) => String(r.id)));
    const filteredIds = new Set();
    for (const id of currentIds) {
      if (validIds.has(String(id))) {
        filteredIds.add(id);
      }
    }
    return { type: 'include', ids: filteredIds };
  }, [rowSelectionModel, requestDetailRows]);

  // Pre-select rows based on bufferedMedicines
  useEffect(() => {
    if (requestDetail && bufferedMedicines) {
      const preSelectedIds = requestDetail
        .filter((row) => bufferedMedicines.some((item) => item.medicine_id === row.medicine_id))
        .map((row) => String(row.id));
      setRowSelectionModel({ type: 'include', ids: new Set(preSelectedIds) });
    }
  }, [requestDetail, bufferedMedicines, selectedRequest?.id]);

  // Notifications helper
  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Navigations
  const openPrevRequest = () => {
    const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
    if (currentIndex > 0) {
      const prevEntry = requests[currentIndex - 1];
      setRowSelectionModel({ type: 'include', ids: new Set() }); // Clear before setting new request
      setSelectedRequest(prevEntry);
    }
  };

  const openNextRequest = () => {
    const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
    if (currentIndex < requests?.length - 1) {
      const nextEntry = requests[currentIndex + 1];
      setRowSelectionModel({ type: 'include', ids: new Set() }); // Clear before setting new request
      setSelectedRequest(nextEntry);
    }
  };

  const handleDoubleTap = (rowParams) => {
    const now = new Date().getTime();
    const doubleTapDelay = 300;
    if (touchTime.current + doubleTapDelay > now) {
      const rowId = String(rowParams.id);
      setRowSelectionModel((prev) => {
        const newIds = new Set(prev.ids);
        if (newIds.has(rowId)) {
          newIds.delete(rowId);
        } else {
          newIds.add(rowId);
        }
        return { type: 'include', ids: newIds };
      });
      touchTime.current = 0;
    } else {
      touchTime.current = now;
    }
  };

  // Actions
  const handleConfirmRequest = async () => {
    setProgress(0);
    setMessageText("");

    // Identify selected row detail objects based on selection model (ids)
    const selectedIds = safeRowSelectionModel.ids;
    const selectedRows = requestDetail?.filter((row) => selectedIds.has(String(row.id))) || [];

    const checkedRequestDetails = selectedRows.map(({ id, medicine_id }) => ({
      request_item_id: id,
      status: true,
      medicine_id,
    }));

    const uncheckedRequestDetails = (requestDetail || [])
      .filter(({ id }) => !rowSelectionModel.ids?.has(String(id)))
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
      status: 1, // Yanıtlandı
    };

    const finalData = [...checkedRequestDetails, ...uncheckedRequestDetails];

    // Determine unselected medicines to remove from buffer
    const selectedMedicineIds = selectedRows.map((row) => row.medicine_id);
    const medicinesToRemove = bufferedMedicines
      ? bufferedMedicines
          .filter((item) => !selectedMedicineIds.includes(item.medicine_id))
          .map((item) => item.medicine_id)
      : [];

    if (medicinesToRemove.length > 0 && pharmacyId) {
      for (const medicine_id of medicinesToRemove) {
        try {
          await deleteFromResponseBuffer(
            { pharmacy_id: pharmacyId, medicine_id },
            {
              onSuccess: () => showNotification("İlaç geçici stok listesinden kaldırıldı!", "success"),
              onError: (error) => showNotification("İlaç kaldırılırken hata oluştu: " + error.message, "error"),
            }
          );
        } catch (error) {
          console.error("response_buffer'dan silme başarısız:", error);
        }
      }
    }

    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(progressInterval);
          return prevProgress;
        }
        return prevProgress + 15;
      });
    }, 200);

    try {
      await responseRequestMutation({ finalData, response });
      setProgress(100);
      showNotification("Talep başarıyla yanıtlandı!", "success");
      setRowSelectionModel([]);
      
      const currentIndex = requests?.findIndex((item) => item.id === selectedRequest?.id);
      if (currentIndex < (requests?.length || 0) - 1) {
        setSelectedRequest(requests[currentIndex + 1]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Talep yanıtlanırken hata:", error);
      showNotification("Talep yanıtlanırken hata oluştu: " + error.message, "error");
      setProgress(-1);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setProgress(-1), 1000);
    }
  };

  const handleHideRequest = () => {
    if (!selectedRequest) return;
    hideRequest(
      {
        request_id: selectedRequest.id,
        pharmacy_id: pharmacyId,
      },
      {
        onSuccess: () => {
          showNotification("Talep başarıyla gizlendi!", "success");
          setSelectedRequest(null);
        },
        onError: (error) => {
          showNotification("Talep gizlenirken hata oluştu: " + error.message, "error");
        },
      }
    );
  };

  // Inline Columns for Dialog Tables
  const hiddenRequestColumns = [
    { headerName: "Talep No", field: "request_id", flex: 1 },
    {
      headerName: "Oluşturulma Tarihi",
      field: "create_date",
      flex: 2,
      renderCell: (params) => formatTurkishDate(params.value),
    },
    { headerName: "Mesaj", field: "message_text", flex: 2 },
    {
      headerName: "Sil",
      field: "action",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="text"
          color="error"
          startIcon={<Delete />}
          onClick={(e) => {
            e.stopPropagation();
            deleteHiddenRequest({
              pharmacy_id: pharmacyId,
              request_id: params.row.request_id,
            });
          }}
          sx={{ justifyContent: "center", width: "100%", textTransform: "none" }}
        >
          Sil
        </Button>
      ),
    },
  ];

  const bufferColumns = [
    { headerName: "İlaç Adı", field: "medicine_name", flex: 2 },
    { headerName: "ID", field: "medicine_id", flex: 1 },
    {
      headerName: "Sil",
      field: "action",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="text"
          color="error"
          startIcon={<Delete />}
          onClick={(e) => {
            e.stopPropagation();
            deleteFromResponseBuffer(
              {
                pharmacy_id: pharmacyId,
                medicine_id: params.row.medicine_id,
              },
              {
                onSuccess: () => showNotification("İlaç geçici stok listesinden kaldırıldı!", "success"),
                onError: (error) => showNotification("İlaç kaldırılırken hata oluştu: " + error.message, "error"),
              }
            );
          }}
          sx={{ justifyContent: "center", width: "100%", textTransform: "none" }}
        >
          Sil
        </Button>
      ),
    },
  ];

  // Identifiers for DataGrid
  const bufferedMedicinesWithIds = bufferedMedicines?.map((item, idx) => ({
    ...item,
    id: String(item.medicine_id || idx),
  })) || [];

  const hiddenRequestsWithIds = hiddenRequests?.map((item, idx) => ({
    ...item,
    id: String(item.request_id || idx),
  })) || [];

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
      {/* Global Progress */}
      {progress > -1 && (
        <Box sx={{ position: "fixed", top: 80, left: 0, right: 0, zIndex: 1200 }}>
          <LinearProgress variant="determinate" value={progress} color={progress === 100 ? "success" : "primary"} />
        </Box>
      )}

      {/* Snackbar Notification */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        sx={{ mt: "80px" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: "100%", boxShadow: 3, borderRadius: '12px' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Grid container spacing={3} sx={{ height: "100%" }}>
          {/* LEFT PANEL: Requests List */}
          {(!isMobile || !selectedRequest) && (
            <Grid size={{ xs: 12, md: selectedRequest ? 5 : 12 }} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenBufferDialog(true)}
                    startIcon={<Storage />}
                    sx={{ 
                      bgcolor: "#333", 
                      "&:hover": { bgcolor: "#25b597" }, 
                      textTransform: "none",
                      borderRadius: '12px',
                      px: 3
                    }}
                  >
                    {isMobile ? "Geçici Stok" : "Geçici Stok Listesi"}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setOpenHiddenDialog(true)}
                    startIcon={<VisibilityOff />}
                    sx={{ 
                      bgcolor: "#333", 
                      "&:hover": { bgcolor: "#25b597" }, 
                      textTransform: "none",
                      borderRadius: '12px',
                      px: 3
                    }}
                  >
                    {isMobile ? "Gizli" : "Gizlenen Talepler"}
                  </Button>
                </Box>

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
                    rows={requests || []}
                    columns={columns}
                    loading={isRequestsLoading}
                    density="comfortable"
                    disableRowSelectionOnClick
                    hideFooter
                    getRowId={(row) => String(row.id)}
                    onRowClick={(params) => {
                      setRowSelectionModel({ type: 'include', ids: new Set() }); // Clear selection correctly for v8
                      setSelectedRequest(params.row);
                    }}
                    getRowClassName={(params) =>
                      highlightedRequestIds.includes(Number(params.id)) ? "Mui-focused" : ""
                    }
                    sx={{
                      border: 0,
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
                      "& .MuiDataGrid-row.Mui-focused": { 
                        bgcolor: "rgba(37, 181, 151, 0.1)" 
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: '1px solid rgba(0,0,0,0.03)'
                      }
                    }}
                  />
                </Paper>
              </Box>
            </Grid>
          )}

          {/* RIGHT PANEL: Request Detail */}
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
                
                {/* Header Information */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="primary" sx={{ fontSize: '1.1rem' }}>
                      Talep Numarası: #{selectedRequest?.id || "Bilinmeyen"}
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
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                    "{selectedRequest?.message_text || "Mesaj yok"}"
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="Eczane mesajınızı yazın..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        bgcolor: "rgba(255,255,255,0.5)"
                      }
                    }}
                  />
                </Box>

                {/* Detail Table */}
                <Box sx={{ flex: 1, width: "100%", overflow: "hidden" }}>
                  {requestDetailError && (
                    <Typography color="error" align="center" sx={{ mb: 1 }}>Detaylar yüklenemedi: {requestDetailError.message}</Typography>
                  )}
                  <ErrorBoundary
                    fallback={<Box sx={{ p: 2, color: 'error.main' }}>Detay tablosu yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</Box>}
                    onReset={() => setRowSelectionModel({ type: 'include', ids: new Set() })}
                  >
                    <DataGrid
                      rows={requestDetailRows}
                      columns={columns_requestDetail}
                      loading={isRequestDetailLoading}
                      checkboxSelection
                      disableRowSelectionOnClick
                      disableVirtualization
                      hideFooter
                      getRowId={(row) => String(row.id)}
                      rowSelectionModel={safeRowSelectionModel}
                      onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
                      onRowClick={(params) => isMobile && handleDoubleTap(params.row)}
                      density="comfortable"
                      sx={{
                        border: 0,
                        "& .MuiDataGrid-columnHeaders": { 
                          bgcolor: "rgba(244, 247, 251, 0.5)",
                          borderBottom: '1px solid rgba(0,0,0,0.05)'
                        },
                        "& .MuiDataGrid-row:hover": { bgcolor: "rgba(37, 181, 151, 0.05)" },
                        "& .MuiDataGrid-row.Mui-selected": { bgcolor: "rgba(37, 181, 151, 0.12) !important" },
                        "& .MuiDataGrid-cell": {
                          borderBottom: '1px solid rgba(0,0,0,0.03)'
                        }
                      }}
                    />
                  </ErrorBoundary>
                </Box>

                {/* Actions Footer */}
                <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  {isMobile ? (
                    <Grid container spacing={1}>
                      <Grid size={3}><Button fullWidth variant="outlined" disabled={isPrevDisabled} onClick={openPrevRequest} sx={{ borderRadius: '10px' }}><ArrowBack /></Button></Grid>
                      <Grid size={3}><Button fullWidth variant="contained" color="primary" disabled={!selectedRequest || (progress > -1 && progress < 100)} onClick={handleConfirmRequest} sx={{ bgcolor: "#25b597", borderRadius: '10px' }}><Check /></Button></Grid>
                      <Grid size={3}><Button fullWidth variant="contained" disabled={!selectedRequest} onClick={handleHideRequest} sx={{ bgcolor: "#666", borderRadius: '10px' }}><VisibilityOff /></Button></Grid>
                      <Grid size={3}><Button fullWidth variant="outlined" disabled={isNextDisabled} onClick={openNextRequest} sx={{ borderRadius: '10px' }}><ArrowForward /></Button></Grid>
                      <Grid size={12}><Button fullWidth variant="outlined" color="inherit" onClick={() => setSelectedRequest(null)} startIcon={<ArrowBackIos />} sx={{ mt: 1, borderRadius: '10px' }}>Geri</Button></Grid>
                    </Grid>
                  ) : (
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                      <Button variant="outlined" startIcon={<ArrowBack />} disabled={isPrevDisabled} onClick={openPrevRequest} sx={{ textTransform: "none", minWidth: 140, borderRadius: '12px' }}>Önceki</Button>
                      <Button variant="contained" startIcon={<Check />} disabled={!selectedRequest || (progress > -1 && progress < 100)} onClick={handleConfirmRequest} sx={{ bgcolor: "#25b597", "&:hover": { bgcolor: "#1f9e83" }, textTransform: "none", minWidth: 140, borderRadius: '12px' }}>Talebi Yanıtla</Button>
                      <Button variant="contained" startIcon={<VisibilityOff />} disabled={!selectedRequest} onClick={handleHideRequest} sx={{ bgcolor: "#666", "&:hover": { bgcolor: "#444" }, textTransform: "none", minWidth: 140, borderRadius: '12px' }}>Gizle</Button>
                      <Button variant="outlined" endIcon={<ArrowForward />} disabled={isNextDisabled} onClick={openNextRequest} sx={{ textTransform: "none", minWidth: 140, borderRadius: '12px' }}>Sonraki</Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Dialogs */}
      <Dialog 
        open={openBufferDialog} 
        onClose={() => setOpenBufferDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid rgba(0,0,0,0.05)", pb: 2 }}>Geçici Stok Listesi</DialogTitle>
        <DialogContent sx={{ p: 0, height: "60vh" }}>
          {bufferedMedicinesWithIds.length > 0 ? (
            <DataGrid rows={bufferedMedicinesWithIds} columns={bufferColumns} disableRowSelectionOnClick hideFooter disableColumnMenu sx={{ border: 0 }} />
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}><Typography color="textSecondary">Geçici stok listesinde ilaç yok.</Typography></Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <Button onClick={() => setOpenBufferDialog(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openHiddenDialog} 
        onClose={() => setOpenHiddenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid rgba(0,0,0,0.05)", pb: 2 }}>Gizlenen Talepler</DialogTitle>
        <DialogContent sx={{ p: 0, height: "60vh" }}>
          {isHiddenRequestsLoading ? (
            <Box sx={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}><CircularProgress /></Box>
          ) : hiddenRequestsWithIds.length > 0 ? (
            <DataGrid rows={hiddenRequestsWithIds} columns={hiddenRequestColumns} disableRowSelectionOnClick hideFooter disableColumnMenu sx={{ border: 0 }} />
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}><Typography color="textSecondary">Gizlenmiş talep bulunamadı.</Typography></Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <Button onClick={() => setOpenHiddenDialog(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Request;
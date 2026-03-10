import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import { ilacimNeredeLogo } from "@assets";
import "./style.scss";

// MUI Components
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Container,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MUILink
} from "@mui/material";

// MUI Icons
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  WhatsApp,
  Info,
  LockOutlined,
  LocalPharmacyRounded
} from "@mui/icons-material";

function Login() {
  const dispatch = useDispatch();

  // Auth & UI states
  const [showPassword, setShowPassword] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [authView, setAuthView] = useState("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  
  // Initialize infoPopupOpen based on localStorage
  const [infoPopupOpen, setInfoPopupOpen] = useState(
    !localStorage.getItem("hideInfoPopup")
  );

  // Vercel Analytics conditional loading
  useEffect(() => {
    if (import.meta.env.PROD) {
      try {
        import('@vercel/analytics').then((analytics) => {
          analytics.track('pageview');
        });
        import('@vercel/speed-insights').then((speedInsights) => {
          speedInsights.track();
        });
      } catch (error) {
        console.warn('Analytics and Speed Insights could not be loaded:', error);
      }
    }
  }, []);

  // Fetch pharmacy info helper
  const getPharmacyInfo = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("pharmacy_user")
        .select("id, pharmacy (name, city_id, district_id, neighbourhood_id)")
        .eq("uuid", userId)
        .single();
      if (error) {
        throw new Error(`Eczane bilgisi alınamadı: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error(error);
      setDialogTitle("Hata");
      setDialogMessage("Eczane bilgileri alınırken hata oluştu.");
      setDialogOpen(true);
      return null;
    }
  };

  // Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === "SIGNED_IN") {
            const info = await getPharmacyInfo(session.user.id);
            if (info) {
              const updatedUser = {
                ...session.user,
                pharmacyId: info.id,
                pharmacyName: info.pharmacy.name,
                pharmacyCityId: info.pharmacy.city_id,
                pharmacyDistrictId: info.pharmacy.district_id,
                pharmacyNeighbourhoodId: info.pharmacy.neighbourhood_id,
              };
              const updatedSession = { ...session, user: updatedUser };
              dispatch(setSession(updatedSession));
              dispatch(setUser(updatedUser));
              window.location.replace("/welcome");
            } else {
              setDialogTitle("Hata");
              setDialogMessage(
                "Bu sayfa sadece eczacılara özeldir. Lütfen mobil uygulamayı kullanın."
              );
              setDialogOpen(true);
              await supabase.auth.signOut();
            }
          }
          if (event === "SIGNED_OUT") {
            localStorage.clear();
            dispatch({ type: "CLEAR_STORE" });
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          setDialogTitle("Hata");
          setDialogMessage("Oturum işlemi sırasında bir hata oluştu.");
          setDialogOpen(true);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [dispatch]);

  // Handle login
  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Login error:", error.message);
      let errorMessage = "Giriş başarısız: Bilinmeyen bir hata oluştu.";
      switch (error.message) {
        case "Invalid login credentials":
          errorMessage = "Giriş başarısız: Geçersiz e-posta veya şifre.";
          break;
        case "User not found":
          errorMessage = "Giriş başarısız: Kullanıcı bulunamadı.";
          break;
        case "Email not confirmed":
          errorMessage = "Giriş başarısız: E-posta adresiniz doğrulanmamış.";
          break;
        default:
          errorMessage = `Giriş başarısız: ${error.message}`;
      }
      setDialogTitle("Giriş Hatası");
      setDialogMessage(errorMessage);
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        throw error;
      }
      setDialogTitle("E-posta Gönderildi");
      setDialogMessage(
        "Şifre sıfırlama bağlantısı e-postanıza başarıyla gönderildi. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin."
      );
    } catch (error) {
      setDialogTitle("Şifre Sıfırlama Hatası");
      setDialogMessage(error.message);
    } finally {
      setLoading(false);
      setDialogOpen(true);
    }
  };

  // Form submission handler
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    authView === "sign_in" ? handleLogin() : handlePasswordReset();
  };

  // Handle "Don't show again" for info popup
  const handleDontShowAgain = () => {
    localStorage.setItem("hideInfoPopup", "true");
    setInfoPopupOpen(false);
  };

  return (
    <Box className="login-page-container">
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
        <Box className="auth-card fade-in">
          <Box className="auth-header">
            <Box className="logo-section">
              <Box className="logo-container">
                <img src={ilacimNeredeLogo} alt="Logo" className="header-logo" />
              </Box>
              <Typography variant="h3" className="logo-text">İlacım Nerede</Typography>
            </Box>
            <Typography variant="subtitle2" className="subtitle">Eczacı Kontrol Paneli</Typography>
          </Box>

          <form onSubmit={handleSubmit} className="auth-form">
            <Box className="form-fields">
              <TextField
                fullWidth
                label="E-posta Adresi"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eczane.com"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#25b597', opacity: 0.7, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {authView === "sign_in" && (
                <TextField
                  fullWidth
                  label="Şifre"
                  variant="outlined"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: '#25b597', opacity: 0.7, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Box>


            <Box className="auth-actions">
              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : (authView === "sign_in" ? "Giriş Yap" : "Şifremi Sıfırla")}
              </Button>

              <Box className="auth-links">
                {authView === "sign_in" ? (
                  <>
                    <Typography 
                      variant="body2" 
                      className="link-text"
                    >
                      Henüz üye değil misiniz? <span className="link-action" onClick={() => setRegisterOpen(true)}>Yeni Kayıt</span>
                    </Typography>
                    <Typography 
                      variant="body2" 
                      className="link-action"
                      onClick={() => setAuthView("forgotten_password")}
                    >
                      Şifremi Unuttum
                    </Typography>
                  </>
                ) : (
                  <Typography 
                    variant="body2" 
                    className="link-action"
                    onClick={() => setAuthView("sign_in")}
                  >
                    Giriş Ekranına Dön
                  </Typography>
                )}
              </Box>
            </Box>
          </form>

          <Box className="auth-footer">
            <Typography variant="body2" className="footer-link" onClick={() => window.open("https://www.google.com/maps?saddr=My%20Location&daddr=41.080013336027,29.009160314659", "_blank")}>
              Esentepe Mah. Talatpaşa Cad. No: 5/1 Şişli / İstanbul
            </Typography>
            <Typography variant="caption" className="copyright">
              © 2025 CuraNodus Yazılım Teknoloji. Tüm Hakları Saklıdır.
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Register Modal */}
      <Dialog 
        open={registerOpen} 
        onClose={() => setRegisterOpen(false)}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px', 
            p: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', pb: 1, color: '#1e293b' }}>Eczane Kaydı</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6, mb: 3 }}>
            Eczacı kaydı güvenliğiniz için online olarak gerçekleştirilememektedir. Platformumuza katılmak ve panelinizi aktif etmek için lütfen ekibimizle iletişime geçin:
          </Typography>
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper variant="outlined" sx={{ borderRadius: '16px', borderColor: '#e2e8f0', p: 1 }}>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 40 }}><Email sx={{ color: '#25b597' }} /></ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>E-posta</Typography>} 
                  secondary={<MUILink href="mailto:ilacimnerede@curanodus.com" sx={{ color: '#25b597', fontWeight: 500 }}>ilacimnerede@curanodus.com</MUILink>} 
                />
              </ListItem>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: '16px', borderColor: '#e2e8f0', p: 1 }}>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 40 }}><WhatsApp sx={{ color: '#25b597' }} /></ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>WhatsApp Destek</Typography>} 
                  secondary={<MUILink href="https://wa.me/908503042193" sx={{ color: '#25b597', fontWeight: 500 }}>+90 850 304 2193</MUILink>} 
                />
              </ListItem>
            </Paper>
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setRegisterOpen(false)} 
            variant="contained" 
            fullWidth 
            sx={{ borderRadius: '14px', backgroundColor: '#25b597', py: 1.5, textTransform: 'none', fontWeight: 700 }}
          >
            Anladım
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Modal */}
      <Dialog 
        open={infoPopupOpen} 
        onClose={() => setInfoPopupOpen(false)}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px', 
            p: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          } 
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800, color: '#1e293b' }}>
          <Info sx={{ color: '#25b597' }} /> Bilgilendirme
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6, mb: 2 }}>
            Bu panel <strong>sadece eczacılar</strong> ve yetkili personel içindir. İlaç arayan kullanıcılar lütfen mobil uygulamamızı kullanın.
          </Typography>
          <Typography variant="body2" sx={{ p: 2, backgroundColor: '#f0fdfa', borderRadius: '12px', color: '#134e4a', fontWeight: 500 }}>
            Mobil uygulamamıza <MUILink href="https://www.ilacimnerede.com" target="_blank" sx={{ color: '#25b597', fontWeight: 700 }}>www.ilacimnerede.com</MUILink> adresinden ulaşabilirsiniz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 1.5 }}>
          <Button 
            onClick={() => setInfoPopupOpen(false)} 
            variant="contained" 
            fullWidth 
            sx={{ borderRadius: '14px', backgroundColor: '#25b597', py: 1.5, textTransform: 'none', fontWeight: 700 }}
          >
            Panele Devam Et
          </Button>
          <Button 
            onClick={handleDontShowAgain} 
            variant="text" 
            size="small" 
            sx={{ color: '#94a3b8', textTransform: 'none', '&:hover': { color: '#64748b' } }}
          >
            Bir daha gösterme
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748b' }}>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => {
              setDialogOpen(false);
              if (dialogTitle === "E-posta Gönderildi") setAuthView("sign_in");
            }} 
            variant="contained"
            fullWidth
            sx={{ borderRadius: '12px', backgroundColor: '#25b597', fontWeight: 600, textTransform: 'none' }}
          >
            Tamam
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Login;

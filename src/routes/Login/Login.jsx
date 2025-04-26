import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";

// Ant Design ikon ve mesaj
import { Button as AntIconBtn, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

// MUI bileşenleri
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

// Logo
import curanodusLogo from "../../assets/curanoduslogo.png";

function Login() {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [authView, setAuthView] = useState("sign_in"); // "sign_in" veya "forgotten_password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 seconds (0.5s fade-in + 2.5s fade-out)
    return () => clearTimeout(timer);
  }, []);

  // Eczane bilgisini çekme
  const getPharmacyInfo = async (userId) => {
    const { data, error } = await supabase
      .from("pharmacy_user")
      .select("id, pharmacy (name, city_id, district_id, neighbourhood_id)")
      .eq("uuid", userId)
      .single();
    if (error) {
      console.error("Eczane bilgisi alınamadı:", error);
      message.error("Eczane bilgileri alınırken hata oluştu.");
      return null;
    }
    return data;
  };

  // Auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          window.location.replace("/home");
        } else {
          message.error(
            "Bu sayfa sadece eczacılara özeldir. Lütfen mobil uygulamayı kullanın."
          );
          supabase.auth.signOut();
        }
      }
      if (event === "SIGNED_OUT") {
        localStorage.clear();
        dispatch({ type: "CLEAR_STORE" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Handle login
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      message.error("Giriş başarısız: " + error.message);
    }
    setLoading(false);
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      message.error("Şifre sıfırlama başarısız: " + error.message);
    } else {
      message.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
      setAuthView("sign_in");
    }
    setLoading(false);
  };

  // MUI buton stili
  const primaryBtn = {
    backgroundColor: "#07a5c3",
    "&:hover": {
      backgroundColor: "#fff",
      color: "#07a5c3",
      border: "1px solid #07a5c3",
    },
    padding: "12px 24px",
    fontSize: "1rem",
  };

  return (
    <>
      {showSplash && (
        <div className="splash-screen">
          <img src={curanodusLogo} alt="Curanodus Logo" className="splash-logo" />
        </div>
      )}
      <div className="App-header">
        <h1 className="page-title">İlacım Nerede · Eczacı Paneli</h1>

        <div className="auth-wrapper">
          {authView === "sign_in" ? (
            <>
              <TextField
                fullWidth
                label="E-posta adresiniz"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                variant="outlined"
                sx={{
                  backgroundColor: "#fff",
                  "& .MuiInputBase-root": {
                    fontSize: "1.1rem",
                    padding: "12px",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1.1rem",
                  },
                }}
              />
              <TextField
                fullWidth
                label="Şifreniz"
                placeholder="Şifreniz"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                variant="outlined"
                sx={{
                  backgroundColor: "#fff",
                  "& .MuiInputBase-root": {
                    fontSize: "1.1rem",
                    padding: "12px",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1.1rem",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <AntIconBtn
                        icon={showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                        onClick={() => setShowPassword((v) => !v)}
                        style={{ fontSize: "1.2rem" }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                fullWidth
                sx={{ ...primaryBtn, mt: 2 }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{ ...primaryBtn, mt: 1 }}
                onClick={() => setRegisterOpen(true)}
              >
                Eczacı Kaydı
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{ ...primaryBtn, mt: 1 }}
                onClick={() => setAuthView("forgotten_password")}
              >
                Parolamı Unuttum
              </Button>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="E-posta adresiniz"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                variant="outlined"
                sx={{
                  backgroundColor: "#fff",
                  "& .MuiInputBase-root": {
                    fontSize: "1.1rem",
                    padding: "12px",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1.1rem",
                  },
                }}
              />
              <Button
                variant="contained"
                fullWidth
                sx={{ ...primaryBtn, mt: 2 }}
                onClick={handlePasswordReset}
                disabled={loading}
              >
                {loading ? "Gönderiliyor..." : "Şifre sıfırlama talimatları gönder"}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: "#07a5c3",
                  color: "#07a5c3",
                  "&:hover": { backgroundColor: "#07a5c3", color: "#fff" },
                  mt: 1,
                  padding: "12px 24px",
                  fontSize: "1rem",
                }}
                onClick={() => setAuthView("sign_in")}
              >
                Giriş Ekranına Dön
              </Button>
            </>
          )}
        </div>

        <Dialog
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Eczane Kaydı</DialogTitle>
          <DialogContent dividers>
            <Typography gutterBottom>
              Eczacı kaydı online olarak gerçekleştirilememektedir. Platformumuza
              ücret ödemeden eczacı olarak katılmak için lütfen bizimle iletişime
              geçin.
            </Typography>
            <List dense>
              <ListItem disableGutters>
                <ListItemText
                  primary={
                    <>
                      E-posta: 
                      <Link href="mailto:ilacimnerede@curanodus.com">
                        ilacimnerede@curanodus.com
                      </Link>
                    </>
                  }
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="WhatsApp: +90 545 519 11 99" />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              fullWidth
              sx={primaryBtn}
              onClick={() => setRegisterOpen(false)}
            >
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        <p className="info-text">
          Bu panel sadece eczacılar içindir. İlaç arayan kullanıcılar lütfen mobil uygulamamızı kullanın.{" "}
          <Link href="https://www.ilacimnerede.com">
            www.ilacimnerede.com
          </Link>{" "}
          Web sitesi üzerinden uygulamamız ile ilgili bilgi alıp uygulamamızı indirebilirsiniz.
        </p>

        <footer className="footer">
          <p>
            ©2025, CuraNodus Yazılım Teknolojileri Limited Şirketi. Tüm Hakları
            Saklıdır.
          </p>
          <p>
            Esentepe Mahallesi Talatpaşa Caddesi No: 5 / 1 Levent,
            İstanbul, Esentepe, Talatpaşa Cd. No: 5/1, 34394 Şişli/İstanbul
          </p>
        </footer>
      </div>
    </>
  );
}

export default Login;
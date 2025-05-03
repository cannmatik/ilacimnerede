import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";

// Ant Design for main buttons & messages
import { Button as AntButton, Modal as AntModal, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

// MUI for password-reset dialog
import { Button as MUIButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

function Login() {
  const dispatch = useDispatch();

  // Auth & UI states
  const [showPassword, setShowPassword] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [authView, setAuthView] = useState("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Dialog for password-reset feedback
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch pharmacy info helper
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

  // Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      }
    );
    return () => subscription.unsubscribe();
  }, [dispatch]);

  // Handle login
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
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
      message.error(errorMessage);
    }
    setLoading(false);
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);

    if (error) {
      setDialogTitle("Şifre Sıfırlama Hatası");
      setDialogMessage(error.message);
    } else {
      setDialogTitle("E-posta Gönderildi");
      setDialogMessage(
        "Şifre sıfırlama bağlantısı e-postanıza başarıyla gönderildi."
      );
    }
    setDialogOpen(true);
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    authView === "sign_in" ? handleLogin() : handlePasswordReset();
  };

  // Render
  return (
    <>
      {showSplash && <div className="splash">Loading...</div>}
      <div className="app-header">
        <div className="page-title-wrapper">
          <h1 className="page-title">İlacım Nerede</h1>
          <h1 className="page-title">Eczacı Paneli</h1>
        </div>
        <form onSubmit={handleSubmit} className="auth-wrapper">
          {authView === "sign_in" ? (
            <>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifreniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  required
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                </span>
              </div>
              <AntButton
                type="primary"
                htmlType="submit"
                className="auth-button"
                loading={loading}
                block
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </AntButton>
              <AntButton
                type="primary"
                className="auth-button"
                onClick={() => setRegisterOpen(true)}
                block
              >
                Eczacı Kaydı
              </AntButton>
              <AntButton
                type="primary"
                className="auth-button"
                onClick={() => setAuthView("forgotten_password")}
                block
              >
                Parolamı Unuttum
              </AntButton>
            </>
          ) : (
            <>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
              <AntButton
                type="primary"
                htmlType="submit"
                className="auth-button"
                loading={loading}
                block
              >
                {loading ? "Gönderiliyor..." : "Şifre sıfırlama talimatları gönder"}
              </AntButton>
              <AntButton
                type="default"
                className="auth-button secondary-button"
                onClick={() => setAuthView("sign_in")}
                block
              >
                Giriş Ekranına Dön
              </AntButton>
            </>
          )}
        </form>

        {/* Eczacı kaydı modal */}
        <AntModal
          title="Eczane Kaydı"
          open={registerOpen}
          onCancel={() => setRegisterOpen(false)}
          footer={[
            <AntButton
              key="close"
              type="primary"
              className="auth-button"
              onClick={() => setRegisterOpen(false)}
              block
            >
              Kapat
            </AntButton>
          ]}
          width={400}
        >
          <p>
            Eczacı kaydı online olarak gerçekleştirilememektedir. Platformumuza
            ücret ödemeden eczacı olarak katılmak için lütfen bizimle iletişime
            geçin.
          </p>
          <ul className="contact-list">
            <li>
              E-posta:{" "}
              <a href="mailto:ilacimnerede@curanodus.com">
                ilacimnerede@curanodus.com
              </a>
            </li>
            <li>WhatsApp: +90 545 519 11 99</li>
          </ul>
        </AntModal>

        {/* Password-reset feedback dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          aria-labelledby="reset-dialog-title"
        >
          <DialogTitle id="reset-dialog-title">{dialogTitle}</DialogTitle>
          <DialogContent>{dialogMessage}</DialogContent>
          <DialogActions>
            <MUIButton
              onClick={() => {
                setDialogOpen(false);
                if (dialogTitle === "E-posta Gönderildi") {
                  setAuthView("sign_in");
                }
              }}
            >
              Tamam
            </MUIButton>
          </DialogActions>
        </Dialog>

        <p className="info-text">
          Bu panel sadece eczacılar içindir. İlaç arayan kullanıcılar lütfen
          mobil uygulamamızı kullanın. <a href="https://www.ilacimnerede.com">
          www.ilacimnerede.com</a> Web sitesi üzerinden uygulamamız ile ilgili bilgi alıp
          uygulamamızı indirebilirsiniz.
        </p>

        <footer className="footer">
          <p>
            <a href="https://www.google.com/maps?saddr=My%20Location&daddr=41.080013336027,29.009160314659">
              Esentepe Mah. Talatpaşa Cad. No: 5/1 (Harman Sok. Girişi) Şişli / İstanbul
            </a>
          </p>
          <p>©2025, CuraNodus Yazılım Teknolojileri Limited Şirketi. Tüm Hakları Saklıdır.</p>
        </footer>
      </div>
    </>
  );
}

export default Login;

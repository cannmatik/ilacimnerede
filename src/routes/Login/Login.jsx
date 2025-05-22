import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";

// Ant Design for buttons and modal
import { Button as AntButton, Modal as AntModal } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

// MUI for dialogs
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  // Initialize infoPopupOpen based on localStorage
  const [infoPopupOpen, setInfoPopupOpen] = useState(
    !localStorage.getItem("hideInfoPopup")
  );

  // Vercel Analytics koşullu yükleme
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
        console.warn('Analytics veya Speed Insights yüklenemedi:', error);
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
          console.error("Auth state change hatası:", error);
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }
      console.log("Login successful:", data);
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
    e.preventDefault();
    authView === "sign_in" ? handleLogin() : handlePasswordReset();
  };

  // Handle "Don't show again" for info popup
  const handleDontShowAgain = () => {
    localStorage.setItem("hideInfoPopup", "true");
    setInfoPopupOpen(false);
  };

  // Render
  return (
    <>
      <div className="app-header">
        <div className="page-title-wrapper" style={{ marginBottom: '24px' }}>
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
                  onBlur={(e) => {
                    if (!e.target.value.includes("@")) {
                      setDialogTitle("Hata");
                      setDialogMessage("Geçerli bir e-posta adresi girin.");
                      setDialogOpen(true);
                    }
                  }}
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
                onClick={handleSubmit}
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
            </AntButton>,
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
            <li>
              WhatsApp:{" "}
                <a href="https://api.whatsapp.com/send/?phone=908503042193&text&type=phone_number&app_absent=0">
                 +90 850 304 2193
            </a>
          </li>
          </ul>
        </AntModal>

        {/* Info popup */}
        <AntModal
          title="Bilgilendirme"
          open={infoPopupOpen}
          onCancel={() => setInfoPopupOpen(false)}
          footer={[
            <AntButton
              key="dont-show"
              type="default"
              className="auth-button secondary-button"
              onClick={handleDontShowAgain}
              block
            >
              Bir Daha Gösterme
            </AntButton>,
            <AntButton
              key="ok"
              type="primary"
              className="auth-button"
              onClick={() => setInfoPopupOpen(false)}
              block
            >
              Tamam
            </AntButton>,
          ]}
          width={400}
        >
          <p>
            Bu panel sadece eczacılar içindir. İlaç arayan kullanıcılar lütfen
            mobil uygulamamızı kullanın.{" "}
            <a href="https://www.ilacimnerede.com">www.ilacimnerede.com</a> Web
            sitesi üzerinden uygulamamız ile ilgili bilgi alıp uygulamamızı
            indirebilirsiniz.
          </p>
        </AntModal>

        {/* Error and password-reset feedback dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            if (dialogTitle === "E-posta Gönderildi") {
              setAuthView("sign_in");
            }
          }}
          aria-labelledby="dialog-title"
        >
          <DialogTitle id="dialog-title">{dialogTitle}</DialogTitle>
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

        <footer className="footer">
          <p>
            <a href="https://www.google.com/maps?saddr=My%20Location&daddr=41.080013336027,29.009160314659">
              Esentepe Mah. Talatpaşa Cad. No: 5/1 (Harman Sok. Girişi) Şişli /
              İstanbul
            </a>
          </p>
          <p>
            ©2025, CuraNodus Yazılım Teknolojileri Limited Şirketi. Tüm Hakları
            Saklıdır.
          </p>
        </footer>
      </div>
    </>
  );
}

export default Login;
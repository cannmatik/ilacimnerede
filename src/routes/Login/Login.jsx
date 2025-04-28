import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";

// Ant Design components
import { Button, Modal, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

// Logo (placeholder path, replace with actual path)
import curanodusLogo from "../../assets/curanoduslogo.png";

function Login() {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [authView, setAuthView] = useState("sign_in"); // "sign_in" or "forgotten_password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 seconds (0.5s fade-in + 2s visible + 0.5s fade-out)
    return () => clearTimeout(timer);
  }, []);

  // Fetch pharmacy info
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

  // Handle login with error message translation
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
          errorMessage = `Giriş başarısız: ${error.message}`; // Fallback for untranslated errors
      }
      message.error(errorMessage);
    }
    setLoading(false);
  };

  // Handle password reset with error message translation
  const handlePasswordReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      let errorMessage = "Şifre sıfırlama başarısız: Bilinmeyen bir hata oluştu.";
      switch (error.message) {
        case "User not found":
          errorMessage = "Şifre sıfırlama başarısız: Kullanıcı bulunamadı.";
          break;
        case "Invalid email":
          errorMessage = "Şifre sıfırlama başarısız: Geçersiz e-posta adresi.";
          break;
        default:
          errorMessage = `Şifre sıfırlama başarısız: ${error.message}`; // Fallback for untranslated errors
      }
      message.error(errorMessage);
    } else {
      message.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
      setAuthView("sign_in");
    }
    setLoading(false);
  };

  // Handle form submission on Enter key press
  const handleSubmit = (e) => {
    e.preventDefault();
    if (authView === "sign_in") {
      handleLogin();
    } else {
      handlePasswordReset();
    }
  };

  return (
    <>
      {showSplash && (
        <div className="splash-screen">
          <img src={curanodusLogo} alt="Curanodus Logo" className="splash-logo" />
        </div>
      )}
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
              <Button
                type="primary"
                htmlType="submit"
                className="auth-button"
                loading={loading}
                block
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </Button>
              <Button
                type="primary"
                className="auth-button"
                onClick={() => setRegisterOpen(true)}
                block
              >
                Eczacı Kaydı
              </Button>
              <Button
                type="primary"
                className="auth-button"
                onClick={() => setAuthView("forgotten_password")}
                block
              >
                Parolamı Unuttum
              </Button>
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
              <Button
                type="primary"
                htmlType="submit"
                className="auth-button"
                loading={loading}
                block
              >
                {loading ? "Gönderiliyor..." : "Şifre sıfırlama talimatları gönder"}
              </Button>
              <Button
                type="default"
                className="auth-button secondary-button"
                onClick={() => setAuthView("sign_in")}
                block
              >
                Giriş Ekranına Dön
              </Button>
            </>
          )}
        </form>

        <Modal
          title="Eczane Kaydı"
          open={registerOpen}
          onCancel={() => setRegisterOpen(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              className="auth-button"
              onClick={() => setRegisterOpen(false)}
              block
            >
              Kapat
            </Button>,
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
        </Modal>

        <p className="info-text">
          Bu panel sadece eczacılar içindir. İlaç arayan kullanıcılar lütfen mobil uygulamamızı kullanın.{" "}
          <a href="https://www.ilacimnerede.com">www.ilacimnerede.com</a>{" "}
          Web sitesi üzerinden uygulamamız ile ilgili bilgi alıp uygulamamızı
          indirebilirsiniz.
        </p>

        <footer className="footer">
          <p>
            <a href="https://www.google.com/maps?saddr=My%20Location&daddr=41.080013336027,29.009160314659">
              Esentepe Mah. Talatpaşa Cad. No: 5/1 (Harman Sok. Girişi) Şişli / İstanbul
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
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";
import { message, Button } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useState } from "react";

function Login() {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);

  /* --------- Yardımcı: eczane kaydını çek --------- */
  const getPharmacyId = async (uuid) => {
    const { data, error } = await supabase
      .from("pharmacy_user")
      .select(
        "uuid,id, pharmacy (name,city_id,district_id,neighbourhood_id)"
      )
      .eq("uuid", uuid);

    if (error) {
      console.error("error getting pharmacy id", error);
      message.error("Eczane bilgileri alınırken bir hata oluştu.");
    }
    return data;
  };

  /* --------- Auth dinleyicisi --------- */
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      const pharmacyInfo = await getPharmacyId(session.user.id);

      if (pharmacyInfo?.length) {
        const updatedSession = {
          ...session,
          user: {
            ...session.user,
            pharmacyId: pharmacyInfo[0].id,
            pharmacyName: pharmacyInfo[0].pharmacy.name,
            pharmacyCityId: pharmacyInfo[0].pharmacy.city_id,
            pharmacyDistrictId: pharmacyInfo[0].pharmacy.district_id,
            pharmacyNeighbourhoodId: pharmacyInfo[0].pharmacy.neighbourhood_id,
          },
        };
        dispatch(setSession(updatedSession));
        dispatch(setUser(updatedSession.user));
        location.replace("/home");
      } else {
        message.error(
          "Bu sayfa sadece eczane girişi içindir. Kullanıcı girişi için mobil uygulamayı kullanınız."
        );
        await supabase.auth.signOut();
      }
    } else if (event === "SIGNED_OUT") {
      localStorage.clear();
      dispatch({ type: "CLEAR_STORE" });
    }
  });

  /* --------- UI --------- */
  return (
    <div className="App-header">
      <h1 className="page-title">İlacım Nerede · Eczacı Paneli</h1>

      <Auth
        supabaseClient={supabase}
        view="sign_in"
        providers={[]}
        /* Renkler burada ayarlanıyor */
        appearance={{
          theme: ThemeSupa,
          extend: true,
          variables: {
            default: {
              colors: {
                brand: "#07a5c3",
                brandAccent: "#058aa3",
                brandButtonText: "#ffffff",
                anchorTextColor: "#07a5c3",
                anchorTextHoverColor: "#058aa3",
              },
            },
          },
        }}
        localization={{
          variables: {
            sign_in: {
              email_label: "E-posta adresinizi girin",
              password_label: "Şifrenizi girin",
              email_input_placeholder: "E-posta adresiniz",
              password_input_placeholder: "Şifreniz",
              button_label: "Giriş Yap",
              loading_button_label: "Giriş Yapılıyor...",
              link_text: "Hesabınız zaten varsa giriş yapın",
              confirmation_text:
                "Şifrenizi sıfırlamak için e-postanızı kontrol edin",
            },
            forgotten_password: {
              email_label: "E-posta adresiniz",
              email_input_placeholder: "E-posta adresiniz",
              button_label: "Şifre sıfırlama talimatlarını gönder",
              link_text: "Parolamı Unuttum",
              confirmation_text:
                "Şifre sıfırlama bağlantısı için e-postanızı kontrol edin",
            },
            errors: {
              default: "Bir hata oluştu. Lütfen tekrar deneyin.",
              "Invalid login credentials":
                "Geçersiz giriş bilgileri. Lütfen bilgilerinizi kontrol edin.",
              "Missing email or phone":
                "E-posta veya telefon numarası eksik. Lütfen bilgilerinizi girin.",
            },
          },
        }}
        passwordInputProps={{
          suffix: (
            <Button
              type="text"
              icon={showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              onClick={() => setShowPassword(!showPassword)}
            />
          ),
          type: showPassword ? "text" : "password",
        }}
      />

      <p className="info-text">
        Bu panel yalnızca İlacım Nerede eczaneleri içindir. Eğer ilacını arayan bir kullanıcıysanız 
        lütfen işlemlerinize Appstore & Playstore üzerinden indirdiğiniz uygulamadan devam edin.
      </p>
    </div>
  );
}

export default Login;

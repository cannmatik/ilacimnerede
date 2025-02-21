import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";
import { message, Input, Space, Button } from "antd"; // Ant Design bileşenlerini import ediyoruz
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons"; // Göster/Gizle ikonları
import { useState } from "react"; // useState hook'unu ekliyoruz

function Login() {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false); // Parola göster/gizle state'i

  const getPharmacyId = async (id) => {
    const { data, error } = await supabase
      .from("pharmacy_user")
      .select("uuid,id, pharmacy (name,city_id,district_id,neighbourhood_id)")
      .eq("uuid", id);
    if (error) {
      console.log("error getting pharmacy id", error);
      message.error("Eczane bilgileri alınırken bir hata oluştu.");
    }
    return data;
  };

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      const pharmacyInfo = await getPharmacyId(session.user.id);

      if (pharmacyInfo && pharmacyInfo.length > 0) {
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

        const updatedUser = {
          ...updatedSession.user,
        };
        dispatch(setUser(updatedUser));

        // Başarılı giriş sonrası yönlendirme
        location.replace("/home");
      } else {
        // Kullanıcı pharmacy_user tablosunda kayıtlı değilse
        message.error(
          "Bu sayfa sadece eczane girişi içindir. Kullanıcı girişi için mobil uygulamayı kullanınız."
        );
        // Kullanıcıyı oturumdan çıkar
        await supabase.auth.signOut();
      }
    } else if (event === "SIGNED_OUT") {
      localStorage.clear();
      dispatch({ type: "CLEAR_STORE" });
    }
  });

  return (
    <div>
      <div className="App-header">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          view="sign_in"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: "E-posta adresinizi girin",
                password_label: "Şifrenizi girin",
                email_input_placeholder: "E-posta adresiniz",
                password_input_placeholder: "Şifreniz",
                button_label: "Giriş Yap",
                loading_button_label: "Giriş Yapılıyor...",
                link_text: "Hesabınız Zaten Varsa Giriş Yapın",
                confirmation_text: "Şifrenizi sıfırlamak için e-postanızı kontrol edin",
              },
              sign_up: {
                link_text: "", // Kayıt ol linkini etkisiz hale getirmek için boş bırakılır
              },
              forgotten_password: {
                email_label: "E-posta adresiniz",
                email_input_placeholder: "E-posta adresiniz",
                button_label: "Şifre Sıfırlama Talimatlarını Gönder",
                link_text: "Parolamı Unuttum",
                confirmation_text: "Şifre sıfırlama bağlantısı için e-postanızı kontrol edin",
              },
              magic_link: {
                email_input_label: "E-posta adresiniz",
                email_input_placeholder: "E-posta adresiniz",
                button_label: "Giriş Bağlantısı Gönder",
                confirmation_text: "Giriş bağlantısı için e-postanızı kontrol edin",
              },
              errors: {
                default: "Bir hata oluştu. Lütfen tekrar deneyin.",
                "Invalid login credentials": "Geçersiz giriş bilgileri. Lütfen bilgilerinizi kontrol edin.",
                "Missing email or phone": "E-posta veya telefon numarası eksik. Lütfen bilgilerinizi girin.",
              },
            },
          }}
          // Özel parola alanı
          passwordInputProps={{
            suffix: (
              <Button
                type="text"
                icon={showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                onClick={() => setShowPassword(!showPassword)}
              />
            ),
            type: showPassword ? "text" : "password", // Parola göster/gizle
          }}
        />
      </div>
    </div>
  );
}

export default Login;
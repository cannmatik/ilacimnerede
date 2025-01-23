import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useDispatch } from "react-redux";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";

function Login() {
  const dispatch = useDispatch();

  const getPharmacyId = async (id) => {
    const { data, error } = await supabase
      .from("pharmacy_user")
      .select("uuid,id, pharmacy (name,city_id,district_id,neighbourhood_id)")
      .eq("uuid", id);
    if (error) {
      console.log("error getting pharmacy id", error);
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
          ...updatedSession.user
        };
        dispatch(setUser(updatedUser));
      }
      location.replace("/home");
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
                confirmation_text: "Şifrenizi sıfırlamak için e-postanızı kontrol edin"
              },
              sign_up: {
                email_label: "E-posta adresinizi girin",
                password_label: "Şifrenizi girin",
                email_input_placeholder: "E-posta adresiniz",
                password_input_placeholder: "Şifreniz",
                button_label: "Kayıt Ol",
                loading_button_label: "Kaydolunuyor...",
                link_text: "Hesabınız yok mu? Kayıt Olun",
                confirmation_text: "Hesabınızı aktif hale getirmek için e-postanızı kontrol edin"
              },
              forgotten_password: {
                email_label: "E-posta adresinizi girin",
                password_label: "Şifrenizi girin",
                email_input_placeholder: "E-posta adresiniz",
                button_label: "Şifremi Sıfırla",
                loading_button_label: "Sıfırlama Bağlantısı Gönderiliyor...",
                link_text: "Şifrenizi mi unuttunuz?",
                confirmation_text: "Şifrenizi sıfırlamak için e-postanızı kontrol edin"
              },
              update_password: {
                password_label: "Yeni şifrenizi girin",
                password_input_placeholder: "Yeni şifreniz",
                button_label: "Şifreyi Güncelle",
                loading_button_label: "Güncelleniyor...",
                confirmation_text: "Şifreniz güncellendi"
              }
            },
          }}
        />
      </div>
    </div>
  );
}

export default Login;
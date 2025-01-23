import { supabase } from "@routes/Login/useCreateClient";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./style.scss";
import dayjs from 'dayjs'; // dayjs'i import et
import 'dayjs/locale/tr'; // Türkçe yerelleştirme

const Home = () => {
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  // Gün ve saat bilgisini tutmak için state
  const [currentDateTime, setCurrentDateTime] = useState(dayjs().locale('tr')); // Türkçe yerelleştirme

  useEffect(() => {
    // Konsola user bilgilerini yazdırarak doğrulama yapıyoruz
    console.log('User Data:', user);

    // Eğer user verisi eksikse, login sayfasına yönlendirme yapılabilir
    if (!user) {
      navigate('/login');  // Giriş yapılmamışsa, login sayfasına yönlendir
    }

    getCountries();

    // Her saniye gün ve saat bilgisini güncelle
    const interval = setInterval(() => {
      setCurrentDateTime(dayjs().locale('tr')); // Türkçe yerelleştirme her saniyede uygulanır
    }, 1000);

    // Component unmount olduğunda interval'i temizle
    return () => clearInterval(interval);
  }, [user, navigate]);

  async function getCountries() {
    try {
      const { data, error } = await supabase.from("city").select();
      if (error) {
        throw new Error("Veri alınırken hata oluştu");
      }
      console.log("Countries Data:", data); // Data'yı kontrol etmek için konsola yazdır
      setCountries(data);
    } catch (error) {
      console.error("Hata:", error.message); // Hata durumunda konsola yazdır
    }
  }

  return (
    <div className="home-container">
      <h1>Hoş Geldiniz, {user?.pharmacyName || 'Kullanıcı Adı Bulunamadı'}</h1>
      <h2>Bugün {currentDateTime.format('dddd, D MMMM YYYY')}</h2> {/* Türkçe formatlama */}
      <h2>Saat: {currentDateTime.format('HH:mm:ss')}</h2>
    </div>
  );
};

export default Home;

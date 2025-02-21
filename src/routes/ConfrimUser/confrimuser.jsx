import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";

const ConfirmUser = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Doğrulama bekleniyor...');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    let token, type, email;
    const confirmationUrl = searchParams.get('confirmation_url');

    if (confirmationUrl) {
      try {
        const parsedUrl = new URL(confirmationUrl);
        token = parsedUrl.searchParams.get('token');
        type = parsedUrl.searchParams.get('type');
        email = parsedUrl.searchParams.get('email');
      } catch (error) {
        console.error("Geçersiz confirmation_url:", error);
      }
    }
    
    // confirmation_url içerisindeki email bulunamazsa, dışarıdaki query parametresinden alırız.
    if (!email) {
      email = searchParams.get('email');
    }

    if (token && type && email) {
      supabase.auth.verifyOtp({ token, type, email })
        .then(({ error }) => {
          if (error) {
            setMessage(`Doğrulama sırasında hata: ${error.message}`);
            setStatus('error');
          } else {
            setMessage('E‑posta doğrulaması başarılı. Artık giriş yapabilirsiniz.');
            setStatus('success');
          }
        });
    } else {
      setMessage('Gerekli doğrulama parametreleri eksik.');
      setStatus('error');
    }
  }, [searchParams]);

  return (
    <div className="confirm-user-container">
      <h1>Kullanıcı Doğrulama</h1>
      <p className={`message ${status}`}>{message}</p>
    </div>
  );
};

export default ConfirmUser;

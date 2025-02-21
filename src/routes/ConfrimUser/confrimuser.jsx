import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";

const ConfirmUser = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Doğrulama bekleniyor...');
  const [status, setStatus] = useState('pending');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') || 'email';

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type })
        .then(({ data, error }) => {
          if (error) {
            setMessage(`Doğrulama sırasında hata: ${error.message}`);
            setStatus('error');
          } else {
            setMessage('E‑posta doğrulaması başarılı.');
            setStatus('success');
            
            // Geri sayımı başlat
            const intervalId = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(intervalId);
                  window.close();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
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
      {status === 'success' && (
        <p>Sayfa {countdown} saniye içerisinde kapatılacaktır.</p>
      )}
    </div>
  );
};

export default ConfirmUser;

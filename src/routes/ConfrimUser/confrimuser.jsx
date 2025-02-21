import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";

const ConfirmUser = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Doğrulama bekleniyor...');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    // Eğer type parametresi gönderilmezse, varsayılan olarak 'email' kullanılır.
    const type = searchParams.get('type') || 'email';
    const redirect_to = searchParams.get('redirect_to');

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type })
        .then(({ data, error }) => {
          if (error) {
            setMessage(`Doğrulama sırasında hata: ${error.message}`);
            setStatus('error');
          } else {
            setMessage('E‑posta doğrulaması başarılı. Artık giriş yapabilirsiniz.');
            setStatus('success');
            if (redirect_to) {
              setTimeout(() => {
                window.location.href = redirect_to;
              }, 2000);
            }
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

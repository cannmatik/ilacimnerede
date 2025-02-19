import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@routes/Login/useCreateClient"; // Doğru client importu
import "./style.scss";

const ConfirmUser = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Doğrulama bekleniyor...');
  const [status, setStatus] = useState('pending'); // pending, success veya error durumlarını izler

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type'); // Örneğin: 'signup'
    const email = searchParams.get('email');

    if (token && type && email) {
      supabase.auth.verifyOtp({ token, type, email })
        .then(({ error }) => {
          if (error) {
            setMessage(`Doğrulama sırasında hata: ${error.message}`);
            setStatus('error');
          } else {
            setMessage('E-posta doğrulaması başarılı. Artık giriş yapabilirsiniz.');
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

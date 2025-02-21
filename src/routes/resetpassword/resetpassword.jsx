import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@routes/Login/useCreateClient'; // Bu dosyada createBrowserClient çağrısında flowType:'implicit' eklenmiş olmalı.
import './style.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('code');
  const type = searchParams.get('type');
  const [session, setSession] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    if (token && type === 'recovery') {
      supabase.auth
        .verifyOtp({ token, type: 'recovery' })
        .then(({ data, error }) => {
          if (error) {
            console.error('verifyOtp error:', error);
            setMessage('Şifre sıfırlama bağlantınız geçersiz veya süresi dolmuş.');
          } else if (data.session) {
            setSession(data.session);
          }
        });
    }
  }, [token, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Girilen şifreler eşleşmiyor!');
      setStatus('error');
      return;
    }
    setStatus('loading');
    if (!session) {
      setMessage('Geçerli oturum bulunamadı. Lütfen e-postadaki bağlantıyı kullanın.');
      setStatus('error');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(`Şifre güncelleme hatası: ${error.message}`);
      setStatus('error');
    } else {
      setMessage('Şifreniz başarıyla güncellendi.');
      setStatus('success');
    }
  };

  if (!session) {
    return (
      <div className="reset-password-container">
        <h1>Yeni Şifre Belirleme</h1>
        <p>{message || 'Lütfen şifre sıfırlama e-postasındaki bağlantıya tıklayarak bu sayfaya erişiniz.'}</p>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h1>Yeni Şifre Belirleme</h1>
      <form onSubmit={handleSubmit} className="reset-password-form">
        <div className="form-group">
          <label htmlFor="newPassword">Yeni Şifre:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Yeni Şifre (Tekrar):</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="reset-button" disabled={status === 'loading'}>
          {status === 'loading' ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
      {message && <p className={`message ${status}`}>{message}</p>}
    </div>
  );
};

export default ResetPassword;

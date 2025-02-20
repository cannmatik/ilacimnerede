import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const emailFromLink = searchParams.get('email');

  // Durumlar
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  // E-posta ile reset link gönderme işlemi
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    // redirectTo parametresi: linke tıklandığında yönlendirilecek URL (bu sayfa)
    const redirectTo = window.location.origin + '/resetpassword';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    
    if (error) {
      setMessage(`Hata: ${error.message}`);
      setStatus('error');
    } else {
      setMessage('Şifre sıfırlama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.');
      setStatus('success');
    }
  };

  // Yeni şifre güncelleme işlemi
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Girilen şifreler eşleşmiyor!');
      setStatus('error');
      return;
    }
    setStatus('loading');
    const { error } = await supabase.auth.verifyOtp({
      token,
      type,
      email: emailFromLink,
      password: newPassword,
    });
    if (error) {
      setMessage(`Şifre güncelleme sırasında hata: ${error.message}`);
      setStatus('error');
    } else {
      setMessage('Şifreniz başarıyla güncellendi.');
      setStatus('success');
    }
  };

  // URL parametreleri varsa yeni şifre formunu, yoksa e-posta formunu gösteriyoruz.
  if (token && type && emailFromLink) {
    return (
      <div className="reset-password-container">
        <h1>Yeni Şifre Belirleme</h1>
        <form onSubmit={handlePasswordUpdate} className="reset-password-form">
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
  }

  return (
    <div className="reset-password-container">
      <h1>Şifre Sıfırlama</h1>
      <form onSubmit={handleEmailSubmit} className="reset-password-form">
        <div className="form-group">
          <label htmlFor="email">E-posta Adresiniz:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="reset-button" disabled={status === 'loading'}>
          {status === 'loading' ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
        </button>
      </form>
      {message && <p className={`message ${status}`}>{message}</p>}
    </div>
  );
};

export default ResetPassword;

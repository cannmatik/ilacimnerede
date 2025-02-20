import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@routes/Login/useCreateClient";
import "./style.scss";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  // URL'de "code" parametresi varsa, kullanıcı reset linkine tıklamış demektir.
  const code = searchParams.get('code');

  // Reset link gönderme formu için state'ler
  const [email, setEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, loading, success, error

  // Yeni şifre güncelleme formu için state'ler
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, loading, success, error

  // Eğer "code" parametresi varsa, kullanıcı reset linkine tıklamış demektir.
  if (code) {
    const handlePasswordUpdate = async (e) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
        setUpdateMessage('Girilen şifreler eşleşmiyor!');
        setUpdateStatus('error');
        return;
      }
      setUpdateStatus('loading');
      // Şifre güncelleme için verifyOtp çağrısı; email parametresini göndermiyoruz.
      const { error } = await supabase.auth.verifyOtp({
        token: code,
        type: 'recovery',
        password: newPassword,
      });
      if (error) {
        setUpdateMessage(`Şifre güncelleme sırasında hata: ${error.message}`);
        setUpdateStatus('error');
      } else {
        setUpdateMessage('Şifreniz başarıyla güncellendi.');
        setUpdateStatus('success');
      }
    };

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
          <button type="submit" className="reset-button" disabled={updateStatus === 'loading'}>
            {updateStatus === 'loading' ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
        {updateMessage && <p className={`message ${updateStatus}`}>{updateMessage}</p>}
      </div>
    );
  }

  // "code" parametresi yoksa, reset linki gönderme formunu gösteriyoruz.
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setRequestStatus('loading');
    const redirectTo = window.location.origin + '/resetpassword';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      setRequestMessage(`Hata: ${error.message}`);
      setRequestStatus('error');
    } else {
      setRequestMessage('Şifre sıfırlama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.');
      setRequestStatus('success');
    }
  };

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
        <button type="submit" className="reset-button" disabled={requestStatus === 'loading'}>
          {requestStatus === 'loading' ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
        </button>
      </form>
      {requestMessage && <p className={`message ${requestStatus}`}>{requestMessage}</p>}
    </div>
  );
};

export default ResetPassword;

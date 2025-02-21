import React, { useState, useEffect } from 'react';
import { supabase } from '@routes/Login/useCreateClient';
import './style.scss';

const ResetPassword = () => {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [session, setSession] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    // URL hash'den access_token ve refresh_token değerlerini alıyoruz.
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const at = hashParams.get('access_token');
    const rt = hashParams.get('refresh_token');
    if (!at || !rt) {
      console.error('Token bilgileri URL hash içerisinde bulunamadı.');
      return;
    }
    setAccessToken(at);
    setRefreshToken(rt);

    // Elde edilen tokenlarla oturumu oluşturuyoruz.
    supabase.auth
      .setSession({
        access_token: at,
        refresh_token: rt,
      })
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('setSession hatası:', error.message);
          return;
        }
        setSession(session);
      });
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setUpdateMessage('Girilen şifreler eşleşmiyor!');
      setUpdateStatus('error');
      return;
    }
    setUpdateStatus('loading');

    if (!session) {
      setUpdateMessage('Geçerli oturum bulunamadı.');
      setUpdateStatus('error');
      return;
    }

    const { error } = await supabase.auth.updateUser({
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

  if (!session) {
    return (
      <div className="reset-password-container">
        <h1>Yeni Şifre Belirleme</h1>
        <p>Lütfen şifre sıfırlama e-postasındaki linke tıklayarak bu sayfaya erişiniz.</p>
      </div>
    );
  }

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
};

export default ResetPassword;

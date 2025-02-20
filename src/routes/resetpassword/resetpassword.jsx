import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@routes/Login/useCreateClient';
import './style.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  // Reset e-postası gönderilirken redirect URL olarak bu sayfa ayarlandıysa,
  // Supabase, linke tıklanınca otomatik olarak kullanıcıyı recovery flow ile oturum açar.
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Oturum durumunu kontrol ediyoruz.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  // Yeni şifre güncelleme formu için state'ler
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, loading, success, error

  // Reset link isteği formu için state'ler
  const [email, setEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, loading, success, error

  // Eğer oturum (session) mevcutsa, yani reset linke tıklanıp recovery flow tamamlanmışsa,
  // kullanıcıya yeni şifre güncelleme formunu gösteriyoruz.
  if (session) {
    const handlePasswordUpdate = async (e) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
        setUpdateMessage('Girilen şifreler eşleşmiyor!');
        setUpdateStatus('error');
        return;
      }
      setUpdateStatus('loading');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
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

  // Eğer oturum mevcut değilse, reset linki gönderme formunu gösteriyoruz.
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setRequestStatus('loading');
    // redirectTo parametresi, reset e-postasındaki linke tıklandığında kullanıcıyı bu sayfaya yönlendirecek.
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

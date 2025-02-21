import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@routes/Login/useCreateClient';
import './style.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  
  // Reset e-posta gönderme için state’ler
  const [email, setEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, loading, success, error
  
  // Şifre güncelleme için state’ler
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, loading, success, error
  
  // Kullanıcının reset linkine tıklayıp PASSWORD_RECOVERY akışına girdiğini kontrol etmek için
  const [passwordResetMode, setPasswordResetMode] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordResetMode(true);
      }
    });
    return () => authListener.unsubscribe();
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setUpdateMessage('Girilen şifreler eşleşmiyor!');
      setUpdateStatus('error');
      return;
    }
    setUpdateStatus('loading');

    // İlk olarak updateUser ile şifre güncellemesi deneniyor.
    let res = await supabase.auth.updateUser({ password: newPassword });
    
    // Eğer updateUser hata vermezse fakat şifre güncellenmediyse,
    // URL'de reset token varsa verifyOtp çağrısıyla şifre güncelleme deneniyor.
    if (res.error) {
      const token = searchParams.get('code');
      if (token) {
        res = await supabase.auth.verifyOtp({
          token,
          type: 'recovery',
          password: newPassword,
        });
      }
    }
    
    if (res.error) {
      setUpdateMessage(`Şifre güncelleme sırasında hata: ${res.error.message}`);
      setUpdateStatus('error');
    } else {
      setUpdateMessage('Şifreniz başarıyla güncellendi.');
      setUpdateStatus('success');
    }
  };

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

  if (passwordResetMode) {
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

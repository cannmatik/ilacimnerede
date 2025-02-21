import React, { useState, useEffect } from 'react';
import { supabase } from '@routes/Login/useCreateClient';
import { useSearchParams } from 'react-router-dom';
import './style.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const recoveryType = searchParams.get('type'); // "recovery" olmalı
  const [session, setSession] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    // PASSWORD_RECOVERY oturumu dinleniyor
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session);
      }
    });
    // Sayfa yüklendiğinde oturum bilgisini kontrol ediyoruz
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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

    if (!session) {
      setUpdateMessage('Geçerli oturum bulunamadı. Lütfen reset e-postasındaki linki kullanın.');
      setUpdateStatus('error');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
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
  
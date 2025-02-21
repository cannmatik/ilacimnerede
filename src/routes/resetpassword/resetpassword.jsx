import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@routes/Login/useCreateClient';
import './style.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  // URL'den gelen reset token'ı alıyoruz (gerekli olmayabilir, ancak dokümantasyon açısından referans için bırakıldı).
  const token = searchParams.get('code');

  // Yeni şifre belirleme formu için state'ler
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, loading, success, error

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setUpdateMessage('Girilen şifreler eşleşmiyor!');
      setUpdateStatus('error');
      return;
    }
    setUpdateStatus('loading');

    // Sadece updateUser() metodu ile şifre güncellemesi yapıyoruz.
    const { data, error } = await supabase.auth.updateUser({
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

import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, AlertCircle, WifiOff, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login, register, isOnline } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isOnline) {
      setErrorMsg('Sem conexão com a internet. Conecte-se para autenticar com a nuvem.');
      return;
    }

    if (authModalTab === 'register') {
      if (!name.trim()) {
        setErrorMsg('Informe seu nome ou nome da sua Oficina 3D.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
        return;
      }

      setLoading(true);
      try {
        await register(name, email, password);
        setSuccessMsg('Conta criada com sucesso! Sincronizando dados...');
      } catch (err) {
        setErrorMsg(err.message || 'Erro ao criar conta.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setErrorMsg('Preencha seu e-mail e senha.');
        return;
      }

      setLoading(true);
      try {
        await login(email, password);
        setSuccessMsg('Login realizado com sucesso!');
      } catch (err) {
        setErrorMsg(err.message || 'Erro ao realizar login.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-dialog auth-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header do Modal */}
        <div className="auth-modal-header">
          <div className="auth-modal-tabs">
            <button 
              type="button"
              className={`auth-tab-btn ${authModalTab === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthModalTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              <LogIn size={16} />
              Entrar
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${authModalTab === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthModalTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              <UserPlus size={16} />
              Criar Conta
            </button>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={closeAuthModal} 
            title="Fechar e continuar no modo offline"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alerta de Modo Offline */}
        {!isOnline && (
          <div className="auth-offline-alert">
            <WifiOff size={18} />
            <div>
              <strong>Você está desconectado</strong>
              <p>O app continuará salvando tudo localmente no seu computador. Para vincular sua conta à nuvem (PostgreSQL), reconecte-se à internet.</p>
            </div>
          </div>
        )}

        {/* Mensagens de Sucesso e Erro */}
        {errorMsg && (
          <div className="auth-msg-box error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="auth-msg-box success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="auth-form">
          {authModalTab === 'register' && (
            <div className="input-group">
              <label className="input-label">Nome ou Oficina 3D</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input 
                  type="text" 
                  className="input-field auth-input"
                  placeholder="Ex: Maker Space / Carlos Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">E-mail</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input 
                type="email" 
                className="input-field auth-input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Senha</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'}
                className="input-field auth-input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {authModalTab === 'register' && (
            <div className="input-group">
              <label className="input-label">Confirmar Senha</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="input-field auth-input"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn"
            disabled={loading || !isOnline}
          >
            {loading ? (
              <span className="btn-spinner">Aguarde...</span>
            ) : authModalTab === 'register' ? (
              <>
                <UserPlus size={16} />
                Cadastrar e Sincronizar
              </>
            ) : (
              <>
                <LogIn size={16} />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        {/* Rodapé informativo */}
        <div className="auth-modal-footer">
          <p className="auth-footer-text">
            🛡️ <strong>Arquitetura Offline-First:</strong> Seus cálculos e dados continuam salvos no seu computador mesmo se a internet cair. Ao fazer login, eles são sincronizados automaticamente com seu banco PostgreSQL.
          </p>
          <button 
            type="button"
            className="auth-guest-btn"
            onClick={closeAuthModal}
          >
            Continuar usando sem conta (Apenas Local)
          </button>
        </div>
      </div>
    </div>
  );
};

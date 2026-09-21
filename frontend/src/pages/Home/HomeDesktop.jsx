import { Link, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import './HomeDesktop.css';
import logoHome from '../../assets/images/ServiçosExtras-1.png';
import { startLogin } from '../../features/auth/services/authService';
import { REMEMBERED_EMAIL_KEY } from '../../constants/constants';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';

function HomeDesktop() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleCheckboxChange = (event) => {
    setRemember(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await startLogin({ email, password });

      if (remember === true) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      navigate('/verify-code');
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message);
      }
    }
  };

  useEffect(() => {
    const storage = localStorage.getItem(REMEMBERED_EMAIL_KEY);

    if (storage !== null) {
      setEmail(storage);
    }
  }, []);

  return (
    <div className="home-desktop">
      <main>
        <div className="home-intro">
          <img src={logoHome} alt="Serviços Extras" />
          <p>
            Uma plataforma que conecta candidatos e recrutadores a oportunidades
            de serviços extras.
            <br />
            <Link to="/about" className="about-link">
              Saiba mais
            </Link>
          </p>
        </div>
        <div className="home-login">
          <div className="login-card">
            <form onSubmit={handleSubmit}>
              <label>
                <input
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  required
                  value={email}
                  onChange={handleEmailChange}
                />
              </label>
              <label>
                <div className="password-field">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    name="password"
                    placeholder="Senha"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeIcon /> : <EyeSlashIcon />}
                  </button>
                </div>
              </label>
              <div className="form-options">
                <label>
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={handleCheckboxChange}
                  />
                  Lembra de mim
                </label>
                <Link to="/forgot-password"> Esqueci minha senha</Link>
              </div>
              <button type="submit" className="login-button">
                Entrar
              </button>
              <Link to="/register" className="register-button">
                Criar conta
              </Link>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomeDesktop;

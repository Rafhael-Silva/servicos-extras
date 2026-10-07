import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { register as registerUser } from '../../features/auth/services/authService';
import registerSchema from '../../features/auth/schemas/registerSchema';
import MaskedCpfInput from '../../components/form/MaskedCpfInput';
import MaskedCnpjInput from '../../components/form/MaskedCnpjInput';
import logoHome from '../../assets/images/ServiçosExtras-1.png';
import './RegisterMobile.css';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

function RegisterMobile() {
  const navigate = useNavigate();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const {
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { accountType: '' },
  });

  const accountType = watch('accountType');

  useEffect(() => {
    if (accountType === 'PERSON') {
      resetField('cnpj');
    }
    if (accountType === 'COMPANY') {
      resetField('cpf');
    }
  }, [accountType, resetField]);

  const onSubmit = async (data) => {
    try {
      await registerUser(data);

      navigate('/verify-code');
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="register-mobile">
      <header>
        <img src={logoHome} alt="Serviços Extras" />
      </header>
      <main>
        <h1 className="register-title">Criar sua conta</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="name">
            Nome Completo
            <input
              type="text"
              id="name"
              placeholder="Nome"
              required
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </label>

          <label htmlFor="accountType">
            Tipo de Conta
            <select id="accountType" required {...register('accountType')}>
              <option value="" disabled>
                Selecione o tipo de conta
              </option>
              <option value="PERSON">Pessoa Física</option>
              <option value="COMPANY">Pessoa Jurídica</option>
            </select>
            {errors.accountType && (
              <span className="field-error">{errors.accountType.message}</span>
            )}
          </label>

          {accountType === 'PERSON' && (
            <label htmlFor="cpf">
              CPF
              <MaskedCpfInput {...register('cpf')} />
              {errors.cpf && (
                <span className="field-error">{errors.cpf.message}</span>
              )}
            </label>
          )}

          {accountType === 'COMPANY' && (
            <label htmlFor="cnpj">
              CNPJ
              <MaskedCnpjInput {...register('cnpj')} />
              {errors.cnpj && (
                <span className="field-error">{errors.cnpj.message}</span>
              )}
            </label>
          )}

          <label htmlFor="email">
            E-mail
            <input
              type="email"
              id="email"
              placeholder="E-mail"
              required
              {...register('email')}
            />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
          </label>

          <label htmlFor="birthDate">
            Data de Nascimento
            <input
              type="date"
              id="birthDate"
              required
              {...register('birthDate')}
            />
            {errors.birthDate && (
              <span className="field-error">{errors.birthDate.message}</span>
            )}
          </label>

          <label htmlFor="password">
            Senha
            <div className="password-field">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                id="password"
                placeholder="Senha"
                required
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? <EyeIcon /> : <EyeSlashIcon />}
              </button>
            </div>
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
          </label>

          <label htmlFor="confirmPassword">
            Confirmação da Senha
            <div className="password-field">
              <input
                type={isConfirmPasswordVisible ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirmação da Senha"
                required
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() =>
                  setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                }
              >
                {isConfirmPasswordVisible ? <EyeIcon /> : <EyeSlashIcon />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error">
                {errors.confirmPassword.message}
              </span>
            )}
          </label>

          <div className="checkbox">
            <label>
              <input
                type="checkbox"
                id="termsAccepted"
                required
                {...register('termsAccepted')}
              />
              <span>
                Li e aceito os <Link to="/terms">Termos de Uso</Link> e a
                <Link to="/privacy"> Política de Privacidade</Link>.
              </span>
            </label>
            {errors.termsAccepted && (
              <span className="field-error">
                {errors.termsAccepted.message}
              </span>
            )}
          </div>

          <div className="buttons">
            <Link to="/home">Voltar</Link>
            <button type="submit">Criar Conta</button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default RegisterMobile;

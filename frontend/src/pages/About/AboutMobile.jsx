import { Link } from 'react-router';
import logoHome from '../../assets/images/ServiçosExtras-1.png';
import './AboutMobile.css';
import {
  BriefcaseIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  SignInIcon,
  UserCheckIcon,
} from '@phosphor-icons/react';

function AboutMobile() {
  return (
    <div className="about-mobile">
      <header>
        <img src={logoHome} alt="Sobre a plataforma" />
      </header>
      <main>
        <div className="main-box">
          <div className="title">
            <div className="icon">
              <InfoIcon weight="fill" size={20} />
            </div>
            <h2>O que é o Serviços Extras?</h2>
          </div>
          <p>
            Uma plataforma feita para conectar pessoas que querem trabalhar a
            empresas que precisam de soluções rápidas. Facilitamos o encontro de
            mão de obra qualificada para demandas pontuais, sem burocracia e com
            total segurança.
          </p>

          <div className="title">
            <div className="icon">
              <UserCheckIcon weight="fill" size={20} />
            </div>
            <h2>Para quem quer Trabalhar</h2>
          </div>
          <p>
            Encontre diárias e serviços temporários que se encaixam na sua
            rotina. Escolha oportunidades de acordo com suas habilidades, defina
            sua disponibilidade e garanta uma renda extra trabalhando com
            flexibilidade.
          </p>

          <div className="title">
            <div className="icon">
              <BriefcaseIcon weight="fill" size={20} />
            </div>
            <h2>Para quem quer Contratar</h2>
          </div>
          <p>
            Encontre profissionais qualificados para demandas específicas e
            urgentes. Publique sua necessidade pontual, analise perfis avaliados
            e contrate mão de obra confiável com rapidez e segurança.
          </p>

          <div className="title">
            <div className="icon">
              <MagnifyingGlassIcon weight="fill" size={20} />
            </div>
            <h2>Por que usar a nossa plataforma?</h2>
          </div>
          <p>
            <strong>• Busca Inteligente:</strong> Encontre oportunidades e
            profissionais de forma simples.
            <br />
            <br />
            <strong>• Praticidade e Segurança:</strong> Oferecemos facilidade
            para candidatos se candidatarem e, para recrutadores, praticidade
            para escolherem o perfil ideal. Além disso, os pagamentos são feitos
            de forma direta e protegidos pela plataforma.
            <br />
            <br />
            <strong>• Tudo Organizado:</strong> Controle total em um só lugar.
            Candidatos acompanham todas as suas candidaturas ativas, enquanto
            recrutadores gerenciam facilmente os perfis e currículos inscritos
            em suas vagas de forma simples e intuitiva.
          </p>

          <div className="title">
            <div className="icon">
              <SignInIcon weight="fill" size={20} />
            </div>
            <h2>Faça parte do Serviços Extras</h2>
          </div>
          <p>
            Seja você um profissional em busca de renda extra ou uma empresa
            precisando de apoio imediato, crie sua conta e comece agora.
          </p>
        </div>

        <div className="buttons">
          <Link to="/home" className="button-back">
            Voltar
          </Link>
          <Link to="/register" className="button-create">
            Criar conta
          </Link>
        </div>
      </main>
    </div>
  );
}

export default AboutMobile;

import { Link } from 'react-router';
import logoHome from '../../assets/images/ServiçosExtras-1.png';
import './AboutDesktop.css';
import {
  BriefcaseIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  SignInIcon,
  UserCheckIcon,
} from '@phosphor-icons/react';

function AboutDesktop() {
  return (
    <div className="about-desktop">
      <header>
        <img src={logoHome} alt="Sobre a plataforma" />
      </header>
      <main>
        <div className="introduction-box">
          <div className="title-main">
            <div className="icon">
              <InfoIcon weight="fill" size={24} />
            </div>
            <h2>O que é o Serviços Extras?</h2>
          </div>
          <p>
            O Serviços Extras é uma plataforma desenvolvida para transformar a
            maneira como pessoas e empresas encontram oportunidades e
            estabelecem conexões profissionais. Nosso objetivo é aproximar quem
            possui habilidades e disponibilidade para trabalhar de quem precisa
            de profissionais para atender demandas específicas, criando um
            ambiente digital que facilita esse encontro. Mais do que conectar
            pessoas, a plataforma busca oferecer uma experiência integrada, na
            qual diferentes etapas da contratação de serviços pontuais possam
            acontecer de maneira organizada e acessível. Dessa forma, a
            plataforma contribui para ampliar as possibilidades de renda extra e
            facilitar o acesso das empresas à mão de obra necessária para suas
            atividades.
          </p>
        </div>

        <div className="users-container">
          <div className="users-box">
            <div className="title-users">
              <div className="icon">
                <UserCheckIcon weight="fill" size={20} />
              </div>
              <h2>Para quem quer Trabalhar</h2>
            </div>
            <p>
              Encontre diárias e serviços temporários que se encaixam na sua
              rotina. Escolha oportunidades de acordo com suas habilidades,
              defina sua disponibilidade e garanta uma renda extra trabalhando
              com flexibilidade.
            </p>
          </div>
          <div className="users-box">
            <div className="title-users">
              <div className="icon">
                <BriefcaseIcon weight="fill" size={20} />
              </div>
              <h2>Para quem quer Contratar</h2>
            </div>
            <p>
              Encontre profissionais qualificados para demandas específicas e
              urgentes. Publique sua necessidade pontual, analise perfis
              avaliados e contrate mão de obra confiável com rapidez e
              segurança.
            </p>
          </div>
        </div>

        <div className="benefit-container">
          <div className="benefit-box">
            <div className="title-benefit">
              <div className="icon">
                <MagnifyingGlassIcon weight="fill" size={20} />
              </div>
              <h2>Por que usar a nossa plataforma?</h2>
            </div>

            <div className="text-benefit">
              <p>
                <strong>• Busca Inteligente e Candidatura:</strong> Encontre
                oportunidades e profissionais de forma simples. Se você é
                candidato, tem total liberdade para explorar, buscar e se
                candidatar às vagas que melhor se encaixam na sua rotina. Se
                você é recrutador, basta criar a vaga na plataforma e escolher o
                profissional ideal analisando o perfil e o currículo dos
                interessados diretamente pela plataforma.
              </p>
              <p>
                <strong>• Praticidade e Segurança Digital:</strong> Resolva tudo
                em um só lugar, sem riscos. A plataforma une a facilidade de se
                candidatar e analisar perfis com uma carteira digital protegida.
                Após o recrutador avaliar o currículo e escolher o candidato
                ideal para a vaga, o pagamento é feito pelo sistema e o valor
                fica guardado em segurança. O dinheiro só é liberado para o
                profissional quando o serviço pontual é concluído com sucesso,
                garantindo que a empresa receba o combinado e o trabalhador
                tenha a certeza do recebimento.
              </p>
              <p>
                <strong>• Tudo Organizado e Centralizado:</strong> Tenha uma
                visão clara de todas as suas atividades em um único painel. Os
                candidatos podem acompanhar o andamento de suas candidaturas,
                consultar as oportunidades disponíveis e verificar quais
                processos seletivos estão avançando. Já os recrutadores podem
                gerenciar suas vagas publicadas, analisar os candidatos
                inscritos e acompanhar o processo de seleção de cada
                oportunidade. Dessa forma, a plataforma facilita a organização e
                o gerenciamento de serviços pontuais, tornando cada etapa mais
                prática, intuitiva e eficiente.
              </p>
            </div>
          </div>
        </div>

        <div className="call-box">
          <div className="title-call">
            <div className="icon-call">
              <SignInIcon weight="fill" size={20} />
            </div>
            <h2>Faça parte do Serviços Extras</h2>
          </div>
          <p>
            Seja você um profissional em busca de uma renda extra ou uma empresa
            que precisa de mão de obra para serviços pontuais, a plataforma foi
            criada para facilitar essa conexão. Encontre oportunidades,
            conecte-se com profissionais e conte com uma plataforma que reúne
            contratação e pagamentos em um só lugar. Crie sua conta e faça parte
            do Serviços Extras, tornando suas experiências profissionais mais
            práticas, organizadas e acessíveis.
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

export default AboutDesktop;

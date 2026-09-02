import { Link } from 'react-router';

function AboutPage() {
  return (
    <main>
      <h1>Estamos dentro da página SOBRE!</h1>
      <p>Funcionando corretamente.</p>
      <Link to={'/'}>Ir para início</Link>
    </main>
  );
}

export default AboutPage;

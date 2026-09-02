import { Link } from 'react-router';

function HomePage() {
  return (
    <main>
      <h1>Serviços Extras</h1>
      <p>Bem-vindos aos serviços Extras</p>
      <Link to={'/about'}>Ir para sobre</Link>
    </main>
  );
}

export default HomePage;

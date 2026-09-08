import SessionProvider from './SessionProvider';

function AppProviders({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default AppProviders;

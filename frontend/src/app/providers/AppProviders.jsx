import SessionProvider from './SessionProvider';
import { Toaster } from 'react-hot-toast';

function AppProviders({ children }) {
  return (
    <>
      <SessionProvider>{children}</SessionProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default AppProviders;

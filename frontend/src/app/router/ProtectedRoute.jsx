import { Navigate } from 'react-router';
import useSession from '../../hooks/useSession';
import {
  INITIALIZING,
  AUTHENTICATED,
  UNAUTHENTICATED,
} from '../../constants/constants';

function ProtectedRoute({ children }) {
  const sessionStatus = useSession();

  if (sessionStatus === INITIALIZING) {
    return null;
  }

  if (sessionStatus === AUTHENTICATED) {
    return children;
  }

  if (sessionStatus === UNAUTHENTICATED) {
    return <Navigate to="/start-login" replace />;
  }
}

export default ProtectedRoute;

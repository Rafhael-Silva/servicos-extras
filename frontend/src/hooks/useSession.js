import { useContext } from 'react';
import SessionContext from '../app/providers/SessionContext';

function useSession() {
  return useContext(SessionContext);
}

export default useSession;

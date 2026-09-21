import { useState, useEffect } from 'react';
import {
  INITIALIZING,
  AUTHENTICATED,
  UNAUTHENTICATED,
  SESSION_ERROR,
} from '../../constants/constants';
import { initialize } from '../../features/auth/lifecycle/sessionLifecycle';
import SessionContext from './SessionContext';
import startSessionWatcher from '../../features/auth/lifecycle/sessionWatcher';

function SessionProvider({ children }) {
  const [sessionStatus, setSessionStatus] = useState(INITIALIZING);

  useEffect(() => {
    let cleanUpSessionWatcher;

    (async () => {
      try {
        const accessToken = await initialize();

        if (accessToken) {
          setSessionStatus(AUTHENTICATED);
        } else {
          setSessionStatus(UNAUTHENTICATED);
        }

        cleanUpSessionWatcher = startSessionWatcher();
      } catch (error) {
        if (error.response?.status === 401) {
          setSessionStatus(UNAUTHENTICATED);
        } else {
          setSessionStatus(SESSION_ERROR);
        }
      }
    })();
    return () => {
      if (cleanUpSessionWatcher) {
        cleanUpSessionWatcher();
      }
    };
  }, []);

  return (
    <SessionContext.Provider value={sessionStatus}>
      {children}
    </SessionContext.Provider>
  );
}

export default SessionProvider;

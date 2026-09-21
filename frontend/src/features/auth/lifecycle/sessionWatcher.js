import { checkAndRefreshSession } from './sessionLifecycle';

function startSessionWatcher() {
  let timer = null;

  const startWatching = async () => {
    await checkAndRefreshSession();

    if (!timer) {
      timer = setInterval(async () => {
        await checkAndRefreshSession();
      }, 60000);
    }
  };

  const stopWatching = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  if (!document.hidden) {
    if (!timer) {
      startWatching();
    }
  }

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      startWatching();
    } else {
      stopWatching();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  const cleanup = () => {
    stopWatching();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  return cleanup;
}

export default startSessionWatcher;

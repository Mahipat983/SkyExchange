import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';

const SessionWatchdog = () => {
  const { isLoggedIn, loginToken, logout, updateBalance } = useAuthStore();
  const showSnackbar = useSnackbarStore(state => state.show);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !loginToken) return;

    let isMounted = true;
    let timeoutId;

    const checkSession = async () => {
      try {
        const response = await userController.getBalance(loginToken);
        
        if (!isMounted) return;

        // Update balance in global store if fetch is successful
        if (response && response.error === '0') {
          updateBalance(response.balance, response.exposure);
        }

        // The user specified '3' as the token expiry / invalid session indicator
        if (response && response.error === '3') {
          console.warn('Session expired (error 3). Logging out...');
          logout();
          showSnackbar('Session expired. Please login again.', 'error');
          navigate('/login');
          return;
        }

        // If it's another error that indicates session invalidation (like '2' in betting-pwa)
        // we can handle it here too if needed, but the user specifically mentioned '3'.
        if (response && response.error === '2') {
             console.warn('Session invalidated (error 2). Logging out...');
             logout();
             showSnackbar('Session invalidated. Please login again.', 'error');
             navigate('/login');
             return;
        }

      } catch (error) {
        // Network errors are ignored to prevent accidental logouts
        console.error('Watchdog check failed:', error);
      }

      if (isMounted) {
        timeoutId = setTimeout(checkSession, 5000); // 5 seconds polling
      }
    };

    // Start polling after a short delay
    timeoutId = setTimeout(checkSession, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isLoggedIn, loginToken, logout, navigate, showSnackbar]);

  return null;
};

export default SessionWatchdog;

/**
 * Authentication Management
 */
const Auth = (() => {
  const TOKEN_KEY = 'college_socket_jwt';
  const USER_KEY = 'college_socket_user';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getUser = () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  };

  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const isAuthenticated = () => !!getToken();

  const hasRole = (...roles) => {
    const user = getUser();
    if (!user || !user.role) return false;
    const roleName = typeof user.role === 'string' ? user.role : user.role.name;
    return roles.includes(roleName);
  };

  const login = async (email, password) => {
    const res = await Api.login(email, password);
    if (res.success && res.data) {
      setSession(res.data.token, res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    try {
      Api.logout();
    } catch (e) {
      // Ignore
    }
    SocketClient.disconnect();
    clearSession();
  };

  return {
    getToken,
    getUser,
    setSession,
    clearSession,
    isAuthenticated,
    hasRole,
    login,
    logout
  };
})();

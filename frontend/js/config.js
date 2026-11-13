/**
 * Frontend Configuration
 */
const Config = (() => {
  // If hosted on port 80/3000 via Nginx or served directly from Node port 5000:
  const host = window.location.hostname || 'localhost';
  const port = window.location.port;

  // If frontend is served by backend on port 5000, use origin; else point to backend 5000
  let backendUrl = window.location.origin;
  if (port === '8080' || port === '3000' || port === '80' || port === '5500') {
    backendUrl = `http://${host}:5000`;
  } else if (!port) {
    backendUrl = `http://${host}:5000`;
  }

  return {
    API_BASE: `${backendUrl}/api/v1`,
    SOCKET_URL: backendUrl,
    APP_NAME: 'College Real-Time Socket System',
    VERSION: '1.0.0'
  };
})();

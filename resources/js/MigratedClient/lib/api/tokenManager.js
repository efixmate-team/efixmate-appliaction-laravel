/**
 * Token management is now handled via httpOnly cookies set by the server.
 * This module is kept as a no-op shim so existing import sites don't break.
 * Do NOT store auth tokens in localStorage — they are inaccessible to JS by design.
 */

export const tokenManager = {
  getAccessToken: () => null,
  setAccessToken: () => {},
  getRefreshToken: () => null,
  setRefreshToken: () => {},
  clear: () => {},
};

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

/*
 * Tracks whether the signed-in account has been flagged for fraud.
 *
 * Flagged accounts can still sign in and browse — they just can't create
 * anything (aid requests, volunteer signup, donations, collaboration
 * posts). This context drives the warning banner and the blocked-feature
 * screens. The server enforces the actual restriction; this is only the
 * user-facing half.
 */
const AccountContext = createContext({
  isBanned: false,
  setBanned: () => {},
  refreshStatus: () => {},
});

export const useAccount = () => useContext(AccountContext);

const readStoredFlag = () => {
  if (sessionStorage.getItem("isBanned") === "true") return true;
  try {
    const stored = sessionStorage.getItem("user") || localStorage.getItem("user");
    return Boolean(stored && JSON.parse(stored)?.isBanned);
  } catch {
    return false;
  }
};

export const AccountProvider = ({ children }) => {
  const [isBanned, setIsBanned] = useState(readStoredFlag);

  const setBanned = useCallback((value) => {
    setIsBanned(value);
    sessionStorage.setItem("isBanned", String(value));
  }, []);

  /** Re-checks with the server, so a ban applied while offline still shows. */
  const refreshStatus = useCallback(async () => {
    try {
      const email =
        sessionStorage.getItem("email") ||
        JSON.parse(sessionStorage.getItem("user") || "null")?.email;
      if (!email) return;

      const res = await axios.get(
        `https://resqrelief-fj7z.onrender.com/api/account-status/${email}`,
      );
      setBanned(Boolean(res.data?.isBanned));
    } catch {
      /* Keep whatever we already knew. */
    }
  }, [setBanned]);

  /*
   * Re-check on every navigation, not just on mount.
   *
   * The provider mounts once when the app loads — which is BEFORE the user
   * signs in. Logging in navigates within the same SPA session, so without
   * this the flag would stay at whatever it was on the login screen (false)
   * and the banner would never appear. Mirrors the AuthWatcher pattern in
   * App.jsx.
   */
  const { pathname } = useLocation();

  useEffect(() => {
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
      setIsBanned(false);
      return;
    }
    // Show what we already know immediately, then confirm with the server.
    setIsBanned(readStoredFlag());
    refreshStatus();
  }, [pathname, refreshStatus]);

  return (
    <AccountContext.Provider value={{ isBanned, setBanned, refreshStatus }}>
      {children}
    </AccountContext.Provider>
  );
};

export default AccountContext;

import React from "react";
import { TriangleAlert, Ban } from "lucide-react";
import { useAccount } from "./AccountContext";
import "./AccountFlag.css";

/*
 * The yellow warning strip shown at the top of every page for a flagged
 * account. Renders nothing for accounts in good standing.
 */
export const FlaggedBanner = () => {
  const { isBanned } = useAccount();
  if (!isBanned) return null;

  return (
    <div className="af-banner" role="status">
      <TriangleAlert size={17} strokeWidth={2} />
      <div className="af-banner-text">
        <strong>Your account is flagged for review.</strong> An administrator
        marked one of your submissions as fraudulent. You can still sign in and
        browse, but you cannot submit aid requests, register as a volunteer,
        donate, or post to the collaboration portal. Contact an administrator if
        you believe this is a mistake.
      </div>
    </div>
  );
};

/*
 * Full-page replacement shown where a flagged user would otherwise see a
 * form. `feature` names the thing they tried to do.
 */
export const RestrictedNotice = ({ feature = "this feature" }) => (
  <div className="af-restricted">
    <div className="af-restricted-card">
      <span className="af-restricted-icon">
        <Ban size={34} strokeWidth={1.75} />
      </span>
      <h2>Account restricted</h2>
      <p>
        You cannot use {feature} because your account has been flagged for a
        fraudulent request.
      </p>
      <p className="af-restricted-hint">
        Your existing information stays visible, and you can continue to browse
        the site. If you believe this was a mistake, please contact an
        administrator to have your account reviewed.
      </p>
    </div>
  </div>
);

export default FlaggedBanner;

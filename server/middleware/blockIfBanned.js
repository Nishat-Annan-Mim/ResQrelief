// middleware/blockIfBanned.js
//
// Flagged (fraud) accounts stay able to log in and browse, but may not
// create anything new. The client hides these actions, but that is only
// cosmetic — this guard is what actually enforces it, since anyone can
// POST straight to the API.
//
// The identifying email is looked up in the usual places because the
// existing routes are inconsistent about where they put it.

const UserModel = require("../model/User");
const BannedModel = require("../model/Banned");

/** Pull the acting user's email out of a request, wherever it lives. */
const emailFrom = (req) =>
  req.body?.email ||
  req.body?.donorEmail ||
  req.body?.submittedBy ||
  req.body?.userEmail ||
  req.body?.postedBy?.email ||
  req.headers?.["x-user-email"] ||
  req.query?.email ||
  null;

/** Pull a phone number out of a request, for phone-level bans. */
const phoneFrom = (req) =>
  req.body?.phoneNumber || req.body?.phone || null;

/**
 * Returns true when the given email or phone belongs to a flagged account.
 * Checks both the User flag and the Banned collection so a ban applied to
 * a phone number still blocks the matching account.
 */
async function isFlagged(email, phone) {
  if (email) {
    const user = await UserModel.findOne({ email });
    if (user?.isBanned) return true;
  }

  const or = [];
  if (email) or.push({ email });
  if (phone) or.push({ phone });
  if (or.length) {
    const banned = await BannedModel.findOne({ $or: or });
    if (banned) return true;
  }

  return false;
}

/** Express middleware — rejects flagged accounts with 403. */
async function blockIfBanned(req, res, next) {
  try {
    const email = emailFrom(req);
    const phone = phoneFrom(req);

    // Nothing to identify the caller by — let the route handle it.
    if (!email && !phone) return next();

    if (await isFlagged(email, phone)) {
      return res.status(403).json({
        banned: true,
        message:
          "Your account has been flagged for a fraudulent request. " +
          "You can still sign in and view the site, but you cannot submit " +
          "requests, register as a volunteer, donate, or post to the " +
          "collaboration portal. Please contact an administrator.",
      });
    }

    next();
  } catch (error) {
    console.error("blockIfBanned error:", error);
    next(); // never take the API down over a guard failure
  }
}

module.exports = blockIfBanned;
module.exports.isFlagged = isFlagged;

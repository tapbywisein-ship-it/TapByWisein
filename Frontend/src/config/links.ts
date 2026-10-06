/* =====================================================================
 * Destinations. Nothing here is invented: every URL is null until the
 * real route exists. Components render a non-navigating element while
 * a value is null, so filling one in is the only change needed later.
 * ===================================================================== */
export const LINKS: {
  signIn: string | null;
  wisein: string | null;
  bywisein: string | null;
  tapbywisein: string | null;
} = {
  signIn: "/login",
  wisein: null, 
  bywisein: null,
  tapbywisein: "/",
};

interface ProfileLike {
  avatar?: string | null;
  bio?: string | null;
  position?: string | null;
  company?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  lookingFor?: string[] | null;
  linkedin?: string | null;
  twitter?: string | null;
  website?: string | null;
}

/** Minimum bio length (exclusive) for profile completion - must be more than this many characters */
export const BIO_MIN_LENGTH_EXCLUSIVE = 20;

/**
 * True only when the user actually set their own profile photo — i.e. an avatar
 * uploaded to our Supabase storage. OAuth sign-in auto-imports a provider avatar
 * (e.g. Google's default silhouette), which must NOT count as "added a photo".
 */
export function hasUploadedAvatar(avatar: string | null | undefined): boolean {
  return !!avatar && avatar.includes('/storage/v1/object/public/');
}

/**
 * Score a profile 0–100 based on what fields are filled. Weights skewed toward
 * the fields that drive matchmaking (skills/interests/lookingFor).
 */
export function profileCompletion(p: ProfileLike | null | undefined): number {
  if (!p) return 0;
  let score = 0;
  if (hasUploadedAvatar(p.avatar)) score += 15;
  if (p.bio && p.bio.trim().length > BIO_MIN_LENGTH_EXCLUSIVE) score += 10;
  if (p.position || p.company) score += 15;
  if ((p.skills?.length ?? 0) >= 3) score += 20;
  else if ((p.skills?.length ?? 0) > 0) score += 10;
  if ((p.interests?.length ?? 0) >= 2) score += 15;
  else if ((p.interests?.length ?? 0) > 0) score += 8;
  if ((p.lookingFor?.length ?? 0) >= 1) score += 15;
  if (p.linkedin || p.twitter || p.website) score += 10;
  return Math.min(100, score);
}

/** True when the profile is so empty matchmaking won't return anything useful. */
export function profileNeedsOnboarding(p: ProfileLike | null | undefined): boolean {
  if (!p) return true;
  return (p.skills?.length ?? 0) === 0 && (p.interests?.length ?? 0) === 0;
}

/**
 * The "Profile Setup" tasks, shared by the attendee and organizer Dashboards
 * so both show the same 4 steps with the same rules (each check matches its
 * label: e.g. "at least 3 skills" really needs 3).
 */
export function profileSetupChecklist(p: ProfileLike | null | undefined) {
  return [
    { done: hasUploadedAvatar(p?.avatar), label: 'Add a profile photo', action: 'Upload', to: '/profile' },
    { done: !!(p?.bio && p.bio.trim().length > BIO_MIN_LENGTH_EXCLUSIVE), label: 'Write a short bio', action: 'Add bio', to: '/profile' },
    { done: !!(p?.position || p?.company), label: 'Add your role & company', action: 'Add', to: '/profile' },
    { done: (p?.skills?.length ?? 0) >= 3, label: 'Add at least 3 skills', action: 'Add skills', to: '/profile' },
  ];
}

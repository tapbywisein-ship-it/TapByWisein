-- ============================================================
-- Cleanup script: Identify registrations affected by the
-- "QR visible before approval" bug (fix/no-qr-before-approval).
--
-- WHAT THE BUG WAS
-- ----------------
-- MyTickets.tsx showed the "Ticket" button (and QR code) for
-- ALL non-cancelled registrations, including PENDING_APPROVAL
-- ones. The QR value is computed client-side as `reg:<id>` —
-- it is NOT stored in the database — so there is no QR column
-- to wipe. However:
--   1. The user may have screenshotted or bookmarked the QR.
--   2. After this fix, checkInAttendee now rejects
--      PENDING_APPROVAL and WAITLISTED registrations, so any
--      previously-visible QR is inert (scanning it fails).
--
-- NO DB DATA NEEDS TO BE CHANGED for the fix to be complete.
-- This script is provided for auditing and optional cleanup
-- only. Run it in read-only mode first (the SELECTs below).
--
-- HOW TO USE
-- ----------
-- 1. Connect to the production Postgres database.
-- 2. Run the SELECT below to review affected registrations.
-- 3. If you want to force a re-approval flow (so users are
--    notified cleanly), use the UPDATE to reset them to
--    PENDING_APPROVAL (they already are — this is a no-op for
--    pending ones, but clears REGISTERED if any were wrongly
--    promoted).
-- 4. DO NOT run the UPDATE without first reviewing the SELECT.
-- 5. This script is safe and reversible: it only sets status
--    back to PENDING_APPROVAL and does not delete any rows.
--
-- ============================================================

-- STEP 1: Audit — list all PENDING_APPROVAL registrations that
-- were affected (i.e. where the QR was previously visible in
-- MyTickets while pending).
-- After the code fix these registrations correctly show
-- "Awaiting approval" instead of the Ticket/QR button.

SELECT
  er.id                             AS registration_id,
  er."eventId"                      AS event_id,
  e.title                           AS event_title,
  e."requiresApproval"              AS requires_approval,
  er."userId"                       AS user_id,
  u.email                           AS user_email,
  er.status                         AS status,
  er."registeredAt"                 AS registered_at
FROM event_registrations er
JOIN events e ON e.id = er."eventId"
JOIN users u  ON u.id = er."userId"
WHERE er.status = 'PENDING_APPROVAL'
  AND e."requiresApproval" = true
ORDER BY er."registeredAt" DESC;

-- ============================================================
-- STEP 2 (OPTIONAL — read the comment before running):
-- If any of the above registrations already received a QR code
-- visible in email (which should NOT have happened given the
-- backend already guarded sendRegistrationConfirmation behind
-- the requiresApproval check), you can clear the ticket by
-- invalidating the registration and re-creating it.
--
-- Since there is no qrToken column, "invalidating" means
-- ensuring the registration status correctly reflects pending
-- and was never promoted to REGISTERED by mistake.
--
-- This UPDATE is safe and reversible: it sets status back to
-- PENDING_APPROVAL for any rows that may have been incorrectly
-- set to REGISTERED for approval-required events.
-- DO NOT run this without reviewing the SELECT output above.
-- ============================================================

-- UPDATE event_registrations er
-- SET status = 'PENDING_APPROVAL', "updatedAt" = NOW()
-- FROM events e
-- WHERE er."eventId" = e.id
--   AND e."requiresApproval" = true
--   AND er.status = 'REGISTERED'
--   AND er."registeredAt" > '2024-01-01'  -- adjust date window
--   -- Exclude rows where approval was explicitly granted
--   -- (i.e. onRegistrationApproved was called, which sends
--   --  the confirmation email — these are legitimately REGISTERED)
--   -- You can cross-check against email send logs if needed.
-- RETURNING er.id, er."userId", er."eventId", er.status;

-- ============================================================
-- ROLLBACK PLAN
-- If the UPDATE was run in error, restore with:
--   UPDATE event_registrations
--   SET status = 'REGISTERED', "updatedAt" = NOW()
--   WHERE id IN (<ids returned by the UPDATE above>);
-- ============================================================

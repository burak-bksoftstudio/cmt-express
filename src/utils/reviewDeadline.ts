export function enforceReviewDeadline(deadline: Date | null, isAdmin: boolean) {
  if (!deadline) return;

  const now = new Date();

  if (now > deadline && !isAdmin) {
    throw new Error("Review deadline has passed");
  }
}


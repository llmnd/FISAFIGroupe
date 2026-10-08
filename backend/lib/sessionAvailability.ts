export type SessionLifecycleStatus =
  | 'ouverte'
  | 'fermée'
  | 'complète'
  | 'terminée'
  | 'annulée';

export function isSessionRegistrationOpen(
  session: {
    startDate: Date | string;
    endDate: Date | string;
    registrationDeadline: Date | string;
    status: string;
    available: number;
  },
  now = new Date(),
): boolean {
  const nowTime = now.getTime();
  const startTime = new Date(session.startDate).getTime();
  const endTime = new Date(session.endDate).getTime();
  const deadlineTime = new Date(session.registrationDeadline).getTime();
  return (
    session.status === 'ouverte' &&
    session.available > 0 &&
    Number.isFinite(startTime) &&
    Number.isFinite(endTime) &&
    Number.isFinite(deadlineTime) &&
    nowTime < startTime &&
    nowTime <= endTime &&
    nowTime < deadlineTime
  );
}

export function getSessionLifecycleStatus(
  session: {
    startDate: Date | string;
    endDate: Date | string;
    registrationDeadline: Date | string;
    status: string;
    available: number;
  },
  now = new Date(),
): SessionLifecycleStatus {
  if (session.status === 'annulée') return 'annulée';
  if (session.status === 'terminée') return 'terminée';

  const endTime = new Date(session.endDate).getTime();
  if (Number.isFinite(endTime) && endTime < now.getTime()) return 'terminée';
  if (session.status === 'complète' || session.available <= 0) return 'complète';
  if (isSessionRegistrationOpen(session, now)) return 'ouverte';
  return 'fermée';
}

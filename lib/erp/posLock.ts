import { prisma } from "@/backend/lib/db";

export async function withPOSConfigLock<T>(
  configId: number,
  operation: () => Promise<T>,
): Promise<T> {
  if (!Number.isSafeInteger(configId) || configId < 1) {
    throw new Error("Invalid POS configuration ID.");
  }

  const advisoryKey = (0x46495341n << 32n) | BigInt(configId);
  return prisma.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(${advisoryKey})`;
      return operation();
    },
    { maxWait: 10_000, timeout: 90_000 },
  );
}

import { prisma } from '../prisma/client'

export const cleanupUnverifiedUsers = async () => {
  try {
    const result = await prisma.user.deleteMany({
      where: {
        emailVerified: false,
        verificationExpiresAt: {
          lt: new Date()
        }
      }
    })

    if (result.count > 0) {
      console.log(`[CLEANUP CRON] ${result.count} usuarios no verificados eliminados`)
    }
  } catch (err) {
    console.error('[CLEANUP CRON ERROR]', err)
  }
}

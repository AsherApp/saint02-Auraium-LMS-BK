import AgoraTokenPkg from 'agora-token'
import dotenv from 'dotenv'

dotenv.config() // Load environment variables

const AgoraToken = (AgoraTokenPkg as any)?.default ?? AgoraTokenPkg
const RtcTokenBuilder = (AgoraToken as any)?.RtcTokenBuilder
const RtmTokenBuilder = (AgoraToken as any)?.RtmTokenBuilder
const AgoraRtcRole = (AgoraToken as any)?.RtcRole

if (!RtcTokenBuilder || !RtmTokenBuilder || !AgoraRtcRole) {
  throw new Error('agora-token package is missing expected exports (RtcTokenBuilder, RtmTokenBuilder, RtcRole). Please ensure the dependency is installed correctly.')
}

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export enum AgoraRole {
  PUBLISHER = AgoraRtcRole.PUBLISHER,
  AUDIENCE = AgoraRtcRole.SUBSCRIBER // Agora uses SUBSCRIBER for audience
}

// --- AgoraService ---
export class AgoraService {
  /**
   * Generates an Agora RTC token.
   * @param channelName - The name of the Agora channel.
   * @param uid - The user ID (can be 0 for a random UID).
   * @param role - The role of the user (PUBLISHER or AUDIENCE).
   * @param expireTime - The token expiration time in seconds (defaults to 3600 seconds = 1 hour).
   * @returns The generated Agora RTC token.
   */
  static generateRtcToken(
    channelName: string,
    uid: number | string,
    role: AgoraRole,
    expireTime: number = 3600
  ): string {
    const appID = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appID || !appCertificate) {
      console.error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is not set in environment variables.')
      throw createHttpError(500, 'Agora App ID or Certificate not configured.')
    }

    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expireTime

    const isNumericUid =
      typeof uid === 'number' || (typeof uid === 'string' && /^[0-9]+$/.test(uid))

    if (isNumericUid) {
      const numericUid = typeof uid === 'number' ? uid : Number(uid)
      return RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        numericUid,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs
      )
    }

    // Use account-based tokens for non-numeric UIDs (e.g. UUIDs)
    return RtcTokenBuilder.buildTokenWithUserAccount(
       appID,
       appCertificate,
       channelName,
       String(uid),
       role,
       privilegeExpiredTs,
       privilegeExpiredTs
     )
  }

  /**
   * Generates an Agora RTM token.
   * @param uid - The user ID (can be 0 for a random UID).
   * @param expireTime - The token expiration time in seconds (defaults to 3600 seconds = 1 hour).
   * @returns The generated Agora RTM token.
   */
  static generateRtmToken(
    uid: number | string,
    expireTime: number = 3600
  ): string {
    const appID = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appID || !appCertificate) {
      console.error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is not set in environment variables.')
      throw createHttpError(500, 'Agora App ID or Certificate not configured.')
    }

    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expireTime

    const token = RtmTokenBuilder.buildToken(appID, appCertificate, uid.toString(), privilegeExpiredTs)

    return token
  }
}

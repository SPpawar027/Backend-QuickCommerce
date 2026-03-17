import admin from 'firebase-admin';
import { env } from './env';
import { AppError } from '../common/errors';

let isInitialized = false;

const buildPrivateKey = (): string | undefined => {
  if (!env.FIREBASE_PRIVATE_KEY) return undefined;
  return env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
};

const initializeFirebase = (): void => {
  if (isInitialized) return;

  const privateKey = buildPrivateKey();
  const hasServiceAccountCredentials =
    Boolean(env.FIREBASE_PROJECT_ID) &&
    Boolean(env.FIREBASE_CLIENT_EMAIL) &&
    Boolean(privateKey);

  if (hasServiceAccountCredentials) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    isInitialized = true;
    return;
  }

  if (env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
    });
    isInitialized = true;
  }
};

export const verifyFirebaseIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  initializeFirebase();

  if (!isInitialized) {
    throw AppError.internal(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID and service account credentials.',
      'FIREBASE_NOT_CONFIGURED'
    );
  }

  try {
    return await admin.auth().verifyIdToken(idToken, true);
  } catch {
    throw AppError.unauthorized('Invalid Firebase ID token', 'INVALID_FIREBASE_TOKEN');
  }
};

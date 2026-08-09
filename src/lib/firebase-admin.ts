import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | null | undefined;
let auth: Auth | null | undefined;

function getFirebaseAdminApp(): App | null {
  if (app !== undefined) {
    return app;
  }

  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    app = null;
    return app;
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return app;
}

export function getFirebaseAdminAuth(): Auth | null {
  if (auth !== undefined) {
    return auth;
  }

  const adminApp = getFirebaseAdminApp();
  if (!adminApp) {
    auth = null;
    return auth;
  }

  auth = getAuth(adminApp);
  return auth;
}

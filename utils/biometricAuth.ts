/**
 * Utilidades para autenticación biométrica usando WebAuthn (Passkeys)
 * Compatible con Face ID (iOS/macOS) y huella dactilar (Android/Windows Hello)
 */

const BIOMETRIC_CRED_KEY = 'kineflow_biometric_credId';
const BIOMETRIC_EMAIL_KEY = 'kineflow_biometric_email';
const BIOMETRIC_NAME_KEY  = 'kineflow_biometric_name';
const RP_ID = window.location.hostname; // e.g. "kineflow-pro-3-0.vercel.app"
const RP_NAME = 'KineFlow Pro';

/** Verifica si el navegador soporta WebAuthn */
export function isBiometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/** Verifica si hay una credencial biométrica registrada en este dispositivo */
export function hasBiometricRegistered(): boolean {
  return !!localStorage.getItem(BIOMETRIC_CRED_KEY);
}

/** Devuelve el email guardado para autenticación biométrica */
export function getBiometricEmail(): string | null {
  return localStorage.getItem(BIOMETRIC_EMAIL_KEY);
}

/** Devuelve el nombre guardado del usuario biométrico */
export function getBiometricName(): string | null {
  return localStorage.getItem(BIOMETRIC_NAME_KEY);
}

/** Elimina la credencial biométrica registrada */
export function clearBiometricCredential(): void {
  localStorage.removeItem(BIOMETRIC_CRED_KEY);
  localStorage.removeItem(BIOMETRIC_EMAIL_KEY);
  localStorage.removeItem(BIOMETRIC_NAME_KEY);
}

/**
 * Registra una nueva credencial biométrica (Face ID / huella)
 * Llamar luego de un login exitoso con usuario+contraseña
 */
export async function registerBiometric(email: string, displayName: string): Promise<boolean> {
  if (!isBiometricSupported()) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { id: RP_ID, name: RP_NAME },
        user: {
          id: userId,
          name: email,
          displayName,
        },
        pubKeyCredParams: [
          { alg: -7,  type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Usa el sensor del dispositivo (Face ID / huella)
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    // Guardamos el ID de la credencial en base64
    const credIdB64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    localStorage.setItem(BIOMETRIC_CRED_KEY, credIdB64);
    localStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
    localStorage.setItem(BIOMETRIC_NAME_KEY, displayName);

    return true;
  } catch (err) {
    console.error('[Biometric] Registration failed:', err);
    return false;
  }
}

/**
 * Autentica al usuario con biometría (Face ID / huella)
 * Retorna true si la verificación fue exitosa
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  if (!isBiometricSupported() || !hasBiometricRegistered()) return false;

  try {
    const credIdB64 = localStorage.getItem(BIOMETRIC_CRED_KEY)!;
    const credIdBytes = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          { id: credIdBytes, type: 'public-key' },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    return !!assertion;
  } catch (err) {
    console.error('[Biometric] Authentication failed:', err);
    return false;
  }
}

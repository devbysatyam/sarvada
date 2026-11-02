/**
 * Firestore HTTP REST API Client (Resilient Serverless & Node Adapter)
 * Eliminates Webpack/gRPC socket stream connection issues in Next.js Server Components,
 * Route Handlers, and Vercel Serverless Functions.
 */

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2cakCcL_jpyy2u5eG_fLXeW95zJ2PkpA";
const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "saravda-website";

let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Retrieves a valid Anonymous Firebase ID Token (cached for 55 minutes)
 */
export async function getAnonymousIdToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });

  const data = await res.json();
  if (!data.idToken) {
    throw new Error(data.error?.message || "Failed to obtain anonymous Firebase Auth token");
  }

  cachedToken = data.idToken;
  tokenExpiry = now + (parseInt(data.expiresIn || "3600", 10) - 300) * 1000;
  return data.idToken;
}

export function parseFirestoreField(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue, 10);
  if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.nullValue !== undefined) return null;
  if (field.mapValue !== undefined) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(field.mapValue.fields || {})) {
      obj[k] = parseFirestoreField(v);
    }
    return obj;
  }
  if (field.arrayValue !== undefined) {
    return (field.arrayValue.values || []).map(parseFirestoreField);
  }
  return field;
}

export function formatFirestoreField(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(formatFirestoreField) } };
  }
  if (typeof val === "object") {
    // If Firestore server timestamp placeholder or already formatted
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = formatFirestoreField(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Fetches all documents from a Firestore collection via HTTPS REST API
 */
export async function fetchFirestoreCollection(collectionName: string): Promise<any[]> {
  try {
    const token = await getAnonymousIdToken();
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=200`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Firestore REST API returned status ${res.status} for "${collectionName}"`);
      return [];
    }

    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) return [];

    return data.documents.map((d: any) => {
      const id = d.name.split("/").pop();
      const result: Record<string, any> = { id };
      for (const [k, v] of Object.entries(d.fields || {})) {
        result[k] = parseFirestoreField(v);
      }
      return result;
    });
  } catch (err: any) {
    console.warn(`fetchFirestoreCollection("${collectionName}") error:`, err.message);
    return [];
  }
}

/**
 * Creates a new document in a Firestore collection via HTTPS REST API
 */
export async function createFirestoreDocument(
  collectionName: string,
  data: Record<string, any>
): Promise<{ id: string; success: boolean }> {
  try {
    const token = await getAnonymousIdToken();
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}`;

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      fields[k] = formatFirestoreField(v);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to create doc in ${collectionName}`);
    }

    const resData = await res.json();
    const id = resData.name ? resData.name.split("/").pop() : "";
    return { id, success: true };
  } catch (err: any) {
    console.warn(`createFirestoreDocument("${collectionName}") note:`, err.message);
    return { id: "", success: false };
  }
}

/**
 * Updates specific fields on an existing Firestore document via HTTPS REST API
 */
export async function updateFirestoreDocument(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const token = await getAnonymousIdToken();
    const updateMask = Object.keys(data)
      .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
      .join("&");
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}/${docId}?${updateMask}`;

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      fields[k] = formatFirestoreField(v);
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    return res.ok;
  } catch (err: any) {
    console.warn(`updateFirestoreDocument("${collectionName}", "${docId}") note:`, err.message);
    return false;
  }
}

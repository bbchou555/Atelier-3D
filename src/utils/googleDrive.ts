import { Client } from "../types";

const FILE_NAME = "atelier-clients.json";

/**
 * Initialize the Google Identity Services Token Client
 */
export function initGoogleTokenClient(
  clientId: string,
  onTokenReceived: (token: string) => void,
  onError: (error: any) => void
) {
  if (typeof window === "undefined" || !(window as any).google) {
    onError("Le SDK Google API n'est pas encore disponible dans cette session.");
    return null;
  }

  try {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response: any) => {
        if (response.error) {
          onError(response.error);
        } else if (response.access_token) {
          onTokenReceived(response.access_token);
        }
      },
    });
    return tokenClient;
  } catch (err) {
    onError(err);
    return null;
  }
}

/**
 * Searches Google Drive for any existing file named 'atelier-clients.json'
 */
export async function findAtelierFileInDrive(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur lors de la recherche dans Drive : ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Reads the content of an existing 'atelier-clients.json' file using alt=media
 */
export async function downloadAtelierFileFromDrive(
  accessToken: string,
  fileId: string
): Promise<Client[]> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur lors du téléchargement : ${response.statusText}`);
  }

  const rawData = await response.json();
  if (Array.isArray(rawData)) {
    return rawData;
  }
  return [];
}

/**
 * Saves and uploads atelier-clients.json to Google Drive.
 * Works both as a NEW creation (POST) or OVERWRITE edit (PATCH).
 */
export async function uploadAtelierFileToDrive(
  accessToken: string,
  clients: Client[],
  fileId: string | null
): Promise<{ fileId: string }> {
  const metadata = {
    name: FILE_NAME,
    mimeType: "application/json",
  };

  const bodyContent = JSON.stringify(clients, null, 2);

  if (fileId) {
    // Overwrite existing file via PATCH
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: bodyContent,
    });

    if (!response.ok) {
      throw new Error(`Échec de la mise à jour du fichier : ${response.statusText}`);
    }

    return { fileId };
  } else {
    // Create new file via Multipart HTTP Post request (metadata + payload)
    const boundary = "atelier_boundary_delim";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--\r\n`;

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      bodyContent +
      closeDelimiter;

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      throw new Error(`Échec de l'enregistrement initial : ${response.statusText}`);
    }

    const data = await response.json();
    return { fileId: data.id };
  }
}

import { Injectable } from '@angular/core';

export interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  viewUrl: string; // final usable url for <img>
}

@Injectable({ providedIn: 'root' })
export class DriveGalleryService {
  constructor() {}

  // helper: test if a URL can be loaded by an <img>
  private testImageUrlLoads(url: string, timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      let finished = false;
      const finish = (ok: boolean) => {
        if (finished) return;
        finished = true;
        img.onload = img.onerror = null;
        resolve(ok);
      };
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = url;
      setTimeout(() => finish(false), timeout);
    });
  }

  // optional fallback: fetch the URL as a blob and create an object URL
  // Note: this may fail due to CORS restrictions on Drive-hosted files.
  private async fetchAsBlobUrl(url: string): Promise<string> {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * List image files inside a public Google Drive folder and resolve a usable image URL for each.
   * - folderId: Drive folder id
   * - apiKey: your Google API key
   */
  async listImagesInFolder(
    folderId: string,
    apiKey: string,
    pageSize = 100
  ): Promise<DriveImage[]> {
    if (!folderId) throw new Error('folderId required');
    if (!apiKey) throw new Error('apiKey required');

    const images: DriveImage[] = [];
    let pageToken: string | undefined = undefined;

    const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;

    do {
      const params = new URLSearchParams({
        q,
        fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
        pageSize: String(pageSize),
        key: apiKey,
      });
      if (pageToken) params.set('pageToken', pageToken);

      const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Drive API error ${res.status}: ${txt}`);
      }

      const json = await res.json();
      const files = json.files || [];

      for (const f of files) {
        const id = f.id;
        const directView = `https://drive.google.com/uc?export=view&id=${id}`;
        const directDownload = `https://drive.google.com/uc?export=download&id=${id}`;
        const thumb = f.thumbnailLink || null;

        // Try a few options in order and pick the first that the browser can render in an <img>
        let finalUrl = directView;

        try {
          const okView = await this.testImageUrlLoads(directView);
          if (okView) {
            finalUrl = directView;
          } else {
            const okDownload = await this.testImageUrlLoads(directDownload);
            if (okDownload) {
              finalUrl = directDownload;
            } else if (thumb) {
              // thumbnail links are often served as images and are reliable for thumbnails
              finalUrl = thumb;
            } else {
              // last resort: try fetching as blob (may fail due to CORS)
              try {
                finalUrl = await this.fetchAsBlobUrl(directView);
              } catch (e) {
                // keep directView as fallback (will show broken image)
                finalUrl = directView;
              }
            }
          }
        } catch (e) {
          // On any error, fallback gracefully
          finalUrl = thumb || directDownload || directView;
        }

        images.push({
          id,
          name: f.name,
          mimeType: f.mimeType,
          thumbnailLink: thumb,
          viewUrl: finalUrl,
        });
      }

      pageToken = json.nextPageToken;
    } while (pageToken);

    return images;
  }
}

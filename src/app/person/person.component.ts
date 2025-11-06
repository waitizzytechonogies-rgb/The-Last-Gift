// src/app/person.component.ts
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { PeopleService } from '../people.service';

@Component({
  standalone: true,
  selector: 'app-person',
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="person; else loading">
      <div class="flex items-start gap-6">
        <img
          *ngIf="person.photoUrl"
          [src]="person.photoUrl"
          class="w-36 h-36 object-cover rounded"
        />
        <div class="flex-1">
          <h2 class="text-2xl font-semibold">{{ person.name }}</h2>
          <p class="text-sm text-slate-600">
            DOB: {{ person.dob ? (person.dob | date : 'longDate') : '—' }}
          </p>
          <p class="mt-4">{{ person.description }}</p>

          <p class="mt-6 text-xs text-slate-500">
            Added by: {{ person.createdBy ?? 'unknown' }} •
            <span *ngIf="person.createdAt">
              on
              {{
                person.createdAt.toDate
                  ? (person.createdAt.toDate() | date : 'medium')
                  : (person.createdAt | date : 'medium')
              }}
            </span>
          </p>

          <!-- QR area -->
          <div class="mt-6 border rounded p-4 inline-block bg-white flex flex-col items-center justify-center">
            <div class="mb-2 font-medium">Share / Download QR</div>

            <!-- QR image -->
            <img
              [src]="qrUrl"
              alt="QR code"
              class="w-40 h-40 object-contain border rounded"
            />

            <div class="mt-3 flex gap-2 flex">
              <button
                (click)="downloadQr()"
                class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Download QR
              </button>

            </div>
            <div *ngIf="downloading" class="mt-2 text-sm text-slate-500">
              Preparing download...
            </div>
            <div *ngIf="copied" class="mt-2 text-sm text-green-600">
              Link copied to clipboard
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div>Loading...</div>
    </ng-template>
  `,
})
export class PersonComponent {
  person: any = null;
  qrUrl = '';
  downloading = false;
  copied = false;

  constructor(
    private route: ActivatedRoute,
    private ps: PeopleService,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ps.get(id).then((p) => {
      this.person = p;
      this.buildQr();
    });
  }

  private buildQr() {
    // Build the absolute URL to this person page
    // Use router.url if you want to preserve query params, or assemble manually
    const relative = this.router.url+'?qr=true'; // e.g. /person/abc123
    // console.log(relative);
    const absolute = `${window.location.origin}${relative}`;

    // Use api.qrserver.com to generate a PNG image of the QR.
    // You can tune size (e.g., 300x300) or error correction with &ecc=L|M|Q|H
    const size = 400; // px
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      absolute
    )}&format=png`;
  }

  /** Download the QR image as a PNG file */
  async downloadQr() {
    try {
      this.downloading = true;
      // Fetch the image as a blob
      const resp = await fetch(this.qrUrl, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Failed to fetch QR image');
      const blob = await resp.blob();

      // Create a temporary anchor to trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filenameSafe = (this.person?.name || 'person')
        .replace(/\s+/g, '_')
        .replace(/[^\w.-]/g, '');
      a.href = url;
      a.download = `${filenameSafe}_${this.route.snapshot.paramMap.get(
        'id'
      )}_qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download QR failed', err);
    //   alert('Failed to download QR: ' + (err as any).message ?? err);
    } finally {
      this.downloading = false;
    }
  }

  /** Copy the absolute person link to clipboard */
  async copyLink() {
    try {
      const relative = this.router.url;
      const absolute = `${window.location.origin}${relative}`;
      await navigator.clipboard.writeText(absolute);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch (e) {
      console.error('copy failed', e);
      alert('Failed to copy link');
    }
  }
}

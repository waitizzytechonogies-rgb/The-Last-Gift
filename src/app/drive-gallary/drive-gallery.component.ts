// drive-gallery.component.ts
import { Component, HostListener, Input, OnInit } from '@angular/core';
import {
  DriveGalleryService,
  DriveImage,
} from '../services/Google/driveGallery.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { gallary } from '../shared/constants';

@Component({
  selector: 'app-drive-gallery',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: 'drive-gallery.component.html',
})
export class DriveGalleryComponent implements OnInit {
  folderId = '1KGAj67TeMI7ImYD1bVDqDyZ5ZILYJs5l'; // '1YU7M9_ZV-CRq1ifaaSnVzvDLHK00HLJu';
  apiKey = 'AIzaSyA1Za7TVURNAthBzmgSVxXGKTXsDkxSmB4';

  images: DriveImage[] = gallary;
  loading = false;
  error: string | null = null;

  // slideshow state
  slideshowOpen = false;
  currentIndex = 0;
  playing = false;
  intervalMs = 3000;
  private intervalId: any = null;

  constructor(private driveSvc: DriveGalleryService) {}

  async ngOnInit() {
    // if (!this.folderId || !this.apiKey) {
    //   this.error = 'folderId and apiKey are required';
    //   return;
    // }
    // this.loading = true;
    // try {
    //   this.images = await this.driveSvc.listImagesInFolder(
    //     this.folderId,
    //     this.apiKey
    //   );
    //   console.log(this.images);
    // } catch (e: any) {
    //   console.error(e);
    //   this.error = e.message || 'Failed to load images';
    // } finally {
    //   this.loading = false;
    // }
  }

  ngOnDestroy() {
    this.clearInterval();
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (!this.slideshowOpen) return;
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
    if (event.key === 'Escape') this.closeSlideshow();
  }

  get currentImage(): DriveImage | null {
    return this.images[this.currentIndex] || null;
  }

  openSlideshow(startIndex = 0) {
    if (!this.images.length) return;
    this.slideshowOpen = true;
    this.currentIndex = startIndex;
    this.playing = true;
    this.startInterval();
    // lock scrolling on body
    document.body.style.overflow = 'hidden';
    // preload first & next
    this.preload(this.currentImage);
    this.preload(this.images[(this.currentIndex + 1) % this.images.length]);
  }

  closeSlideshow() {
    this.slideshowOpen = false;
    this.playing = false;
    this.clearInterval();
    document.body.style.overflow = '';
  }

  togglePlay() {
    this.playing = !this.playing;
    if (this.playing) this.startInterval();
    else this.clearInterval();
  }

  startInterval() {
    this.clearInterval();
    this.intervalId = setInterval(() => this.next(), this.intervalMs);
  }

  clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  next() {
    if (!this.images.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prev() {
    if (!this.images.length) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  // preload helper
  preload(img?: DriveImage | null) {
    if (!img || !img.viewUrl) return;
    const i = new Image();
    i.src = img.viewUrl;
  }

  // called after current image loads — preload next image
  preloadNext() {
    const next = this.images[(this.currentIndex + 1) % this.images.length];
    this.preload(next);
  }
}

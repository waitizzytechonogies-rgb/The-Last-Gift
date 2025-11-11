import { CommonModule } from '@angular/common';
import { Component, Input, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  selector: 'app-gallery-slideshow',
  templateUrl: './gallery-slideshow.component.html',
})
export class GallerySlideshowComponent {
  @Input() images: string[] = [];
  @Input() basePath: string = ''; // 👈 new input to define folder path

  isOpen = false;
  current = 0;

  autoRotate = true;
  intervalMs = 5000;
  private intervalId: any;

  open(startIndex = 0) {
    if (!this.images?.length) return;
    this.current = startIndex;
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    if (this.autoRotate) this.startAutoRotate();
  }

  close() {
    this.isOpen = false;
    document.body.style.overflow = '';
    this.stopAutoRotate();
  }

  prev() {
    this.stopAutoRotate();
    this.current = (this.current - 1 + this.images.length) % this.images.length;
    if (this.autoRotate) this.startAutoRotate();
  }

  next() {
    this.stopAutoRotate();
    this.current = (this.current + 1) % this.images.length;
    if (this.autoRotate) this.startAutoRotate();
  }

  startAutoRotate() {
    this.stopAutoRotate();
    this.intervalId = setInterval(() => {
      if (this.isOpen) this.next();
    }, this.intervalMs);
  }

  stopAutoRotate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(e: KeyboardEvent) {
    if (!this.isOpen) return;
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'Escape') this.close();
  }

  getSrc(img: string): string {
    return this.basePath + img;
  }
}

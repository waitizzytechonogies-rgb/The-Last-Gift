// src/app/person.component.ts
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PeopleService } from '../people.service';
import { AuthService } from '../auth/auth.service';
import { ActionDrawerComponent } from '../action-drawer/action-drawer.component';
import { GallerySlideshowComponent } from '../gallery-slideshow/gallery-slideshow.component';
import { GALLERY, GALLERY_SOLO } from '../shared/constants';

type Testimonial = {
  author?: string;
  message?: string;
  relationShip?: string;
};

@Component({
  standalone: true,
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ActionDrawerComponent,
    GallerySlideshowComponent,
  ],
})
export class PersonComponent implements OnInit, OnDestroy {
  // data
  person: any = null;
  testimonials: Testimonial[] = [];

  // hero / UI
  name = 'Muriel Pushparaj';
  caption = 'Love came down at Christmas: so did she!';
  aboutText = `Born on a Christmas day in 1937 as the eldest of the nine children of Francis Odilon and Jeyarathi Isabella, she married Mr. V K Pushparaj on 10th June 1959, and blessed with eight children and ten grandchildren. She lived a legacy that bore the fruits of the Spirit -love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.`;
  imageSrc: string | null = null;
  drawerOpen = false;

  // misc
  qrUrl = '';
  downloading = false;
  copied = false;

  // galleries
  gallery: string[] = GALLERY;
  gallerySolo: string[] = GALLERY_SOLO;

  // testimonial carousel state
  currentIndex = 0;
  isFullscreenOpen = false;

  // autoplay
  autoPlay = true;
  autoPlayDelay = 5000; // ms
  private autoplayTimer: any = null;
  private isInteracting = false; // set while user touches / hovers

  // touch/swipe
  private touchStartX: number | null = null;
  private touchDeltaX = 0;
  private swipeThreshold = 50; // px required to fire swipe

  // auth
  isLoggedIn = false;

  constructor(
    private route: ActivatedRoute,
    private ps: PeopleService,
    private authService: AuthService
  ) {
    this.isLoggedIn = !!this.authService.currentUser;
  }

  // -----------------------
  // Lifecycle
  // -----------------------
  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const p = await this.ps.get(id);
        this.person = p;
        this.testimonials = Array.isArray(this.person?.testimonials)
          ? this.person.testimonials
          : [];
      } catch (err) {
        console.error('Failed to load person', err);
        this.person = null;
        this.testimonials = [];
      }
    }

    // load hero overrides from localStorage (if present)
    try {
      const hero = localStorage.getItem('memorial_hero');
      // if (hero) {
      //   const parsed = JSON.parse(hero);
      //   this.name = parsed.name ?? this.name;
      //   this.caption = parsed.caption ?? this.caption;
      //   this.imageSrc = parsed.imageSrc ?? this.imageSrc;
      // }
    } catch (e) {
      // ignore invalid localStorage data
    }

    if (this.autoPlay) this.startAuto();
  }

  ngOnDestroy(): void {
    this.stopAuto();
  }

  // -----------------------
  // Carousel navigation
  // -----------------------
  next(): void {
    if (!this.testimonials?.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  prev(): void {
    if (!this.testimonials?.length) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.testimonials.length) %
      this.testimonials.length;
  }

  goTo(index: number): void {
    if (!this.testimonials?.length) return;
    if (index < 0 || index >= this.testimonials.length) return;
    this.currentIndex = index;
  }

  // -----------------------
  // Auto-rotate
  // -----------------------
  startAuto(): void {
    // this.stopAuto();
    // if (!this.autoPlay || !this.testimonials?.length) return;
    // if (this.isInteracting || this.isFullscreenOpen) return;
    // this.autoplayTimer = setInterval(() => {
    //   // guard again inside timer
    //   if (
    //     !this.isFullscreenOpen &&
    //     !this.isInteracting &&
    //     this.testimonials?.length
    //   ) {
    //     this.next();
    //   }
    // }, this.autoPlayDelay);
  }

  stopAuto(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  resetAutoAfterInteraction(delay = 300): void {
    // called after manual interaction to restart auto rotation
    this.stopAuto();
    setTimeout(() => {
      if (this.autoPlay && !this.isFullscreenOpen) {
        this.startAuto();
      }
    }, delay);
  }

  // handlers bound to template
  onMouseEnter(): void {
    this.isInteracting = true;
    this.stopAuto();
  }
  onMouseLeave(): void {
    this.isInteracting = false;
    this.startAuto();
  }

  // -----------------------
  // Touch / swipe support
  // -----------------------
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches?.[0]?.clientX ?? null;
    this.touchDeltaX = 0;
    this.isInteracting = true;
    this.stopAuto();
  }

  onTouchMove(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const currentX = event.touches?.[0]?.clientX ?? this.touchStartX;
    this.touchDeltaX = currentX - this.touchStartX;
    // NOTE: you could update a transform here for drag UX
  }

  onTouchEnd(): void {
    if (this.touchStartX === null) {
      this.isInteracting = false;
      this.startAuto();
      return;
    }

    if (Math.abs(this.touchDeltaX) > this.swipeThreshold) {
      if (this.touchDeltaX < 0) {
        this.next(); // swipe left -> next
      } else {
        this.prev(); // swipe right -> prev
      }
    }

    this.touchStartX = null;
    this.touchDeltaX = 0;
    this.isInteracting = false;
    this.resetAutoAfterInteraction();
  }

  // -----------------------
  // Fullscreen view
  // -----------------------
  openFullscreen(index = 0): void {
    if (!this.testimonials?.length) return;
    this.currentIndex = Math.max(
      0,
      Math.min(index, this.testimonials.length - 1)
    );
    this.isFullscreenOpen = true;
    this.stopAuto();
    document.body.style.overflow = 'hidden';
  }

  closeFullscreen(): void {
    this.isFullscreenOpen = false;
    document.body.style.overflow = '';
    this.startAuto();
  }

  // keyboard navigation while fullscreen open
  @HostListener('window:keydown', ['$event'])
  onKeydownFullscreen(event: KeyboardEvent): void {
    if (!this.isFullscreenOpen) return;

    if (event.key === 'Escape') this.closeFullscreen();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'ArrowRight') this.next();
  }

  // pause when tab/window hidden
  @HostListener('window:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.stopAuto();
    } else {
      this.startAuto();
    }
  }

  // -----------------------
  // Drawer / Edit
  // -----------------------
  edit(): void {
    this.openDrawer();
  }

  openDrawer(): void {
    this.drawerOpen = true;
  }

  onClose(): void {
    this.drawerOpen = false;
  }

  onSave(payload: {
    name?: string;
    caption?: string;
    imageSrc?: string | null;
  }): void {
    if (payload.name) this.name = payload.name;
    if (payload.caption) this.caption = payload.caption;
    if (payload.imageSrc !== undefined)
      this.imageSrc = payload.imageSrc ?? this.imageSrc;

    localStorage.setItem(
      'memorial_hero',
      JSON.stringify({
        name: this.name,
        caption: this.caption,
        imageSrc: this.imageSrc,
      })
    );

    this.drawerOpen = false;
  }
}

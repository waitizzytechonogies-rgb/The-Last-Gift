// src/app/person.component.ts
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { PeopleService } from '../people.service';
import { AuthService } from '../auth/auth.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-person',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent {
  person: any = null;
  qrUrl = '';
  downloading = false;
  copied = false;

  editMode: boolean = false;
  editName: string = '';
  editCaption: string = '';
  previewImage: string | null = null; // Data URL for live preview
  imageSrc: string = '../../assets/meeka-latest.png';
  isLoggedIn = this.authService.isLoggedIn;

  currentIndex: number = 0;
  autoPlay: boolean = true; // set to false to disable autoplay
  autoPlayDelay: number = 5000; // ms between slides
  private autoplayTimer: any = null;

  // touch/swipe tracking
  private touchStartX: number | null = null;
  private touchDeltaX: number = 0;
  private swipeThreshold: number = 50; // px required to consider a swipe

  name: string = 'Muriel Pushparaj';
  caption: string = 'Love came down at Chrismas: so did she!';

  // Navigation / sections preview (editable)
  sections = [
    { title: 'About Her Life', excerpt: 'A brief life story and highlights.' },
    {
      title: 'Early Life',
      excerpt: 'Childhood, education and early memories.',
    },
    {
      title: "Children's Testimonials",
      excerpt:
        'Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.',
    },
    { title: 'Friends & Family Wishes', excerpt: 'Messages from loved ones.' },
    {
      title: 'Gallery of Memories',
      excerpt: 'Photos from different seasons of life.',
    },
  ];

  aboutText: string = `Murial's life was devoted to family, technology and bringing joy to everyone she met. She loved the holidays and cherished the time spent with Meeka and family.`;

  testimonials = [
    {
      author: 'Asha (daughter)',
      message:
        'You taught me everything—kindness first. Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.Short notes and photos from her children.',
    },
    { author: 'Ravi (son)', message: 'My first mentor and forever guide.' },
    {
      author: 'Priya (friend)',
      message: 'We laughed and cooked together—memories I treasure.',
    },
    {
      author: 'Priya (friend)',
      message: 'We laughed and cooked together—memories I treasure.',
    },
    {
      author: 'Priya (friend)',
      message: 'We laughed and cooked together—memories I treasure.',
    },
    {
      author: 'Priya (friend)',
      message: 'We laughed and cooked together—memories I treasure.',
    },
  ];

  gallery: string[] = [
    'https://images.unsplash.com/photo-1507120410856-1f35574c3b45?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1507120410856-1f35574c3b45?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=400&q=60',
  ];

  constructor(
    private route: ActivatedRoute,
    private ps: PeopleService,
    private authService: AuthService
  ) {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ps.get(id).then((p) => {
      this.person = p;
    });
  }

  ngOnInit(): void {
    if (this.autoPlay) this.startAuto();
  }

  ngOnDestroy(): void {
    this.stopAuto();
  }

  // navigate
  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  prev(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.testimonials.length) %
      this.testimonials.length;
  }

  goTo(index: number): void {
    if (index < 0 || index >= this.testimonials.length) return;
    this.currentIndex = index;
  }

  // autoplay
  startAuto(): void {
    this.stopAuto();
    if (!this.autoPlay) return;
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, this.autoPlayDelay);
  }

  stopAuto(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  // touch handlers for mobile swipe
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchDeltaX = 0;
    this.stopAuto(); // pause while interacting
  }

  onTouchMove(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const currentX = event.touches[0].clientX;
    this.touchDeltaX = currentX - this.touchStartX;
    // optionally: you could apply a temporary transform for drag UX
  }

  onTouchEnd(): void {
    if (this.touchStartX === null) return;
    if (Math.abs(this.touchDeltaX) > this.swipeThreshold) {
      // swipe left -> next, swipe right -> prev
      if (this.touchDeltaX < 0) {
        this.next();
      } else {
        this.prev();
      }
    }
    this.touchStartX = null;
    this.touchDeltaX = 0;
    if (this.autoPlay) this.startAuto(); // resume autoplay after interaction
  }

  startEdit() {
    this.editMode = true;
    this.editName = this.name;
    this.editCaption = this.caption;
    this.previewImage = null; // keep current preview blank unless user selects new file
  }

  cancelEdit() {
    this.editMode = false;
    this.editName = '';
    this.editCaption = '';
    this.previewImage = null;
  }

  /**
   * onFileChange
   * reads the chosen file as Data URL and sets previewImage so your template shows it immediately.
   * Note: for production do an upload and save the returned URL instead of storing data URLs.
   */
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Optional: small validation example (unobtrusive, adjust as needed)
      const maxSizeMb = 5;
      if (file.size > maxSizeMb * 1024 * 1024) {
        // You can show a toast / validation message in your app
        console.warn(`Selected file is larger than ${maxSizeMb}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewImage = (e.target as FileReader).result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * saveEdit
   * Applies the edits to the visible hero and persists to localStorage as an example.
   * Replace the localStorage block with an API call to persist on server.
   */
  saveEdit() {
    if (this.editName) this.name = this.editName;
    if (this.editCaption) this.caption = this.editCaption;
    if (this.previewImage) this.imageSrc = this.previewImage;

    const payload = {
      name: this.name,
      caption: this.caption,
      imageSrc: this.imageSrc,
    };
    try {
      localStorage.setItem('memorial_hero', JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not save hero to localStorage', e);
    }

    this.editMode = false;
  }
}

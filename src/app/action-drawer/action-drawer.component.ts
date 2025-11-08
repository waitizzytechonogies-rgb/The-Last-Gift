import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TestimonialModalComponent } from '../testimonial/testimonial.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TestimonialModalComponent],
  selector: 'app-action-drawer',
  templateUrl: './action-drawer.component.html',
})
export class ActionDrawerComponent implements OnInit, OnChanges {
  @Input() open = false;
  @Input() name = '';
  @Input() caption = '';
  @Input() imageSrc: string | null = null;
  @Input() primary = '#e6dccf';
  @Input() secondary = '#1f4d47';
  @Input() gender: 'female' | 'male' | 'other' = 'female';
  @Input() about: string = '';
  @Input() testimonials: any[] = [];
  @Input() gallery: string[] = [];

  // @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  // local editable copies
  localName: string = '';
  localCaption: string = '';
  localImageSrc: string | null = null; // initial image
  localPreview: string | null = null; // new selected image preview
  localPrimary: string = '#e6dccf';
  localSecondary: string = '#1f4d47';
  localGender: string = 'female';
  localAbout: string = '';

  // testimonials manager
  localTestimonials: any[] = [];
  testimonialModalOpen = false;
  editingTestimonialIndex: number | null = null;
  tm: any = {
    name: '',
    relationship: '',
    message: '',
    file: null,
    preview: null,
  };

  // gallery
  localGallery: string[] = [];

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (this.testimonialModalOpen) {
        this.closeTestimonialModal();
      } else if (this.open) {
        this.onClose();
      }
    }
  };

  ngOnInit() {
    this.initLocal();
    window.addEventListener('keydown', this._onKeyDown);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && this.open) {
      this.initLocal();
      // focus first input when opening drawer
      setTimeout(() => {
        const el = document.querySelector('#drawer input');
        (el as HTMLElement | null)?.focus?.();
      }, 0);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this._onKeyDown);
  }

  initLocal() {
    this.localName = this.name || '';
    this.localCaption = this.caption || '';
    this.localImageSrc = this.imageSrc || null;
    this.localPreview = null;
    this.localPrimary = this.primary || '#e6dccf';
    this.localSecondary = this.secondary || '#1f4d47';
    this.localGender = this.gender || 'female';
    this.localAbout = this.about || '';

    // deep copy testimonials and normalize shape
    this.localTestimonials = (this.testimonials || []).map((t: any) => ({
      name: t.name ?? t.author ?? '',
      relationship: t.relationship ?? t.relation ?? '',
      message: t.message ?? t.text ?? '',
      photo: t.photo ?? t.image ?? null,
    }));

    this.localGallery = (this.gallery || []).slice();
  }

  // ---------- Portrait handling ----------
  async onPortraitFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // quick validation
    const maxSizeMB = 8;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Please choose an image smaller than ${maxSizeMB} MB.`);
      return;
    }

    try {
      // compress to width 1200px with 0.85 quality
      const dataUrl = await this.compressImage(file, 1200, 0.85);
      this.localPreview = dataUrl;
      this.localImageSrc = null;
    } catch (err) {
      console.error('Error compressing portrait', err);
      alert('Failed to process the image. Please try a different file.');
    }
  }

  // ---------- Testimonials CRUD + modal handling ----------
  openTestimonialModal() {
    this.editingTestimonialIndex = null;
    this.tm = {
      name: '',
      relationship: '',
      message: '',
      file: null,
      preview: null,
    };
    this.testimonialModalOpen = true;
    setTimeout(() => {
      const firstInput = document.querySelector('app-testimonial-modal input');
      (firstInput as HTMLElement | null)?.focus?.();
    }, 0);
  }

  editTestimonial(i: number) {
    const t = this.localTestimonials[i];
    this.editingTestimonialIndex = i;
    this.tm = {
      name: t.name,
      relationship: t.relationship,
      message: t.message,
      file: null,
      preview: t.photo || null,
    };
    this.testimonialModalOpen = true;
  }

  deleteTestimonial(i: number) {
    // temporary confirm; replace with nicer UI if desired
    if (!confirm('Delete this testimonial?')) return;
    this.localTestimonials.splice(i, 1);
  }

  onTestimonialModalSave(payload: {
    name: string;
    relationship?: string;
    message: string;
    photo?: string | null;
  }) {
    if (!payload?.name || !payload?.message) {
      alert('Testimonial must have a name and a message.');
      return;
    }

    const entry = {
      name: payload.name,
      relationship: payload.relationship || '',
      message: payload.message,
      photo: payload.photo || null,
    };

    console.log(entry);

    this.closeTestimonialModal();

    setTimeout(() => {
      const btn = document.querySelector(
        'button[aria-label="Add testimonial"]'
      );
      (btn as HTMLElement | null)?.focus?.();
    }, 0);
  }

  closeTestimonialModal() {
    this.testimonialModalOpen = false;
    this.tm = {
      name: '',
      relationship: '',
      message: '',
      file: null,
      preview: null,
    };
    this.editingTestimonialIndex = null;
  }

  // ---------- Album handling ----------
  onAlbumFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    Promise.all(files.map((f) => this.compressImage(f, 1200, 0.85))).then(
      (dataUrls) => {
        this.localGallery.push(...dataUrls);
      }
    );
  }

  removeGallery(i: number) {
    this.localGallery.splice(i, 1);
  }

  // ---------- Save / Close ----------
  onSave() {
    // apply palettes
    this.applyPalette(this.localPrimary, this.localSecondary);

    const payload = {
      name: this.localName,
      caption: this.localCaption,
      imageSrc: this.localPreview || this.localImageSrc,
      primary: this.localPrimary,
      secondary: this.localSecondary,
      gender: this.localGender,
      about: this.localAbout,
      testimonials: this.localTestimonials,
      gallery: this.localGallery,
    };
    // this.save.emit(payload);

    console.log(payload);
  }

  onClose() {
    this.close.emit();
  }

  applyPalette(primary: string, secondary: string) {
    try {
      const root = document.documentElement;
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--secondary', secondary);
    } catch (e) {
      // ignore
    }
  }

  // ---------- Utility: compress image using canvas (client-side) ----------
  compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (ev) => {
        img.onload = () => {
          const ratio = img.width / img.height;
          const w = Math.min(maxWidth, img.width);
          const h = Math.round(w / ratio);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          // pick webp when supported for smaller sizes
          const supportsWebP =
            canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
          const type = supportsWebP
            ? 'image/webp'
            : file.type === 'image/png'
            ? 'image/png'
            : 'image/jpeg';
          const dataUrl = canvas.toDataURL(type, quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

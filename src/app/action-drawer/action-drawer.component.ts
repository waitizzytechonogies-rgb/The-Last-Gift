import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TestimonialModalComponent } from '../testimonial/testimonial.component';
import { People } from '../interfaces/people';
import { PeopleService } from '../services/people/people.services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TestimonialModalComponent],
  selector: 'app-action-drawer',
  templateUrl: './action-drawer.component.html',
})
export class ActionDrawerComponent implements OnInit {
  @Input() open = false;
  profile: People | null = null;
  @Input() set person(value: People | null) {
    this.profile = value;
    this.initializeAttributes();
  }

  // @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  name: string = '';
  caption: string = '';
  primary: string = '#e6dccf';
  secondary: string = '#1f4d47';
  gender: string = '';
  about: string = '';
  imageSrc: string | null = '';
  imageSrcPreview: File | null = null;

  testimonialModalOpen: any;
  editingTestimonialIndex: any;

  // gallery
  localGallery: string[] = [];

  constructor(private peopleService: PeopleService) {}

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
    window.addEventListener('keydown', this._onKeyDown);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this._onKeyDown);
  }

  initializeAttributes() {
    this.name = this.profile?.name || '';
    this.caption = this.profile?.caption || '';
    this.primary = this.profile?.primary || '#e6dccf';
    this.secondary = this.profile?.secondary || '#1f4d47';
    this.gender = this.profile?.gender || '';
    this.about = this.profile?.about || '';
    this.imageSrc = this.profile?.imageSrc || '';
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
      this.imageSrcPreview = file;
      this.imageSrc = null;
    } catch (err) {
      console.error('Error compressing portrait', err);
      alert('Failed to process the image. Please try a different file.');
    }
  }

  // ---------- Testimonials CRUD + modal handling ----------
  openTestimonialModal() {
    this.editingTestimonialIndex = null;
    const tm = {
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
    const t = this.profile?.testimonials?.[i];
    this.editingTestimonialIndex = i;
    const tm = {
      name: t?.name,
      relationship: t?.relationShip,
      message: t?.message,
      file: null,
      preview: t?.photoUrl || null,
    };
    this.testimonialModalOpen = true;
  }

  deleteTestimonial(i: number) {
    // temporary confirm; replace with nicer UI if desired
    if (!confirm('Delete this testimonial?')) return;
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
    const tm = {
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
    // Promise.all(files.map((f) => this.compressImage(f, 1200, 0.85))).then(
    //   (dataUrls) => {
    //     this.localGallery.push(...dataUrls);
    //   }
    // );
  }

  removeGallery(i: number) {
    this.profile?.gallery?.splice(i, 1);
  }

  // ---------- Save / Close ----------
  async onSave() {
    // apply palettes
    this.applyPalette(this.primary, this.secondary);

    let bannerImageStorageId = null;
    try {
      bannerImageStorageId = await this.peopleService.uploadPhoto(
        this.imageSrcPreview!
      );
    } catch (error) {
      console.log('ERROR uploading file : ', error);
    }

    const payload = {
      name: this.name,
      caption: this.caption,
      imageSrc: bannerImageStorageId || this.imageSrc,
      primary: this.primary,
      secondary: this.secondary,
      gender: this.gender,
      about: this.about,
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
}

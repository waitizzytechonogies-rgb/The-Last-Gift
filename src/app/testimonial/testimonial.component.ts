import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * TestimonialModalComponent
 * - Standalone component (template inlined in testimonial.component.html file).
 * - Emits `save` with payload { name, relationship, message, photo } where photo is a DataURL.
 * - Emits `cancel` when user closes without saving.
 * - Uses client-side compression via canvas.
 *
 * Notes:
 * - Import FormsModule (already included via `imports`) for ngModel.
 * - For production replace DataURL flows with server uploads (recommended).
 */

@Component({
  selector: 'app-testimonial-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './testimonial.component.html',
  styles: [],
})
export class TestimonialModalComponent implements OnChanges {
  @Input() open = false;
  @Input() testimonial: any | null = null; // optional existing testimonial to edit
  @Output() save = new EventEmitter<{
    name: string;
    relationship?: string;
    message: string;
    photo?: string | null;
  }>();
  @Output() cancel = new EventEmitter<void>();

  // local editable copy used by the form
  local: {
    name: string;
    relationship: string;
    message: string;
    photoPreview: string | null;
  } = {
    name: '',
    relationship: '',
    message: '',
    photoPreview: null,
  };

  ngOnChanges(changes: SimpleChanges) {
    // when testimonial or open changes, sync local form state
    if (changes['testimonial'] && this.testimonial) {
      this.local = {
        name: this.testimonial.name ?? '',
        relationship: this.testimonial.relationship ?? '',
        message: this.testimonial.message ?? '',
        photoPreview: this.testimonial.photo ?? null,
      };

      // autofocus first input when editing
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>('#tm-name');
        el?.focus();
      }, 0);
    } else if (changes['open'] && this.open && !this.testimonial) {
      // new testimonial flow
      this.local = {
        name: '',
        relationship: '',
        message: '',
        photoPreview: null,
      };
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>('#tm-name');
        el?.focus();
      }, 0);
    }
  }

  get isEditing() {
    return !!this.testimonial;
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // basic validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxMB = 5;
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPEG or WEBP image.');
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Please choose an image smaller than ${maxMB} MB.`);
      return;
    }

    this.compressImage(file, 800, 0.8)
      .then((dataUrl) => {
        this.local.photoPreview = dataUrl;
      })
      .catch((err) => {
        console.error('compress error', err);
        alert('Failed to process image. Try a different file.');
      });
  }

  handleSave() {
    if (!this.local.name?.trim() || !this.local.message?.trim()) {
      alert('Please provide at least a name and a message.');
      return;
    }

    this.save.emit({
      name: this.local.name.trim(),
      relationship: this.local.relationship?.trim(),
      message: this.local.message.trim(),
      photo: this.local.photoPreview || null,
    });
  }

  handleCancel() {
    this.cancel.emit();
  }

  /**
   * Compress image using canvas and return a Data URL.
   * - Uses WebP if supported by the browser for smaller output.
   */
  compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (ev) => {
        img.onload = () => {
          try {
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

            // prefer webp if supported
            let type = 'image/jpeg';
            try {
              const test = canvas.toDataURL('image/webp');
              if (test.indexOf('data:image/webp') === 0) type = 'image/webp';
            } catch (e) {
              // ignore; fallback to jpeg/png below
            }

            if (file.type === 'image/png') type = 'image/png';
            const dataUrl = canvas.toDataURL(type, quality);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err);
        img.src = ev.target?.result as string;
      };

      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

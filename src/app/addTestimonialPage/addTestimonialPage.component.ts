import { Component, HostListener } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TestimonialService } from '../services/testimonial.service';

interface Testimonial {
  author: string;
  relationShip: string;
  message: string;
  createdAt: string;
}

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  selector: 'app-add-testimonial-page',
  templateUrl: './addTestimonialPage.component.html',
})
export class AddTestimonialPageComponent {
  form: FormGroup;
  pid = 'TOcyA5EAHzLWR0ri2G1v'; // Meeka (keep or make dynamic)
  saving = false;
  message = '';
  testimonialAddedSuccess: boolean | null = null; // null = untouched

  // confirmation dialog state
  isConfirmOpen = false;
  pendingTestimonial: Testimonial | null = null;

  constructor(
    private fb: FormBuilder,
    private testimonialService: TestimonialService
  ) {
    this.form = this.fb.group({
      author: ['', [Validators.required, Validators.maxLength(80)]],
      relationShip: ['', [Validators.required, Validators.maxLength(60)]],
      message: ['', [Validators.required, Validators.maxLength(2000)]],
    });
  }

  // typed access to controls
  get controls() {
    return this.form.controls as {
      author: any;
      relationShip: any;
      message: any;
    };
  }

  // open confirmation dialog after validating the form
  openConfirm() {
    this.message = '';
    this.testimonialAddedSuccess = null;

    if (this.form.invalid) {
      this.message = 'Please fill all required fields correctly.';
      this.form.markAllAsTouched();
      return;
    }

    this.pendingTestimonial = {
      author: (this.controls.author.value || '').trim(),
      relationShip: (this.controls.relationShip.value || '').trim(),
      message: (this.controls.message.value || '').trim(),
      createdAt: new Date().toISOString(),
    };

    this.isConfirmOpen = true;
  }

  // user cancels confirmation dialog
  cancelConfirm() {
    this.isConfirmOpen = false;
    this.pendingTestimonial = null;
  }

  // user confirms: perform save
  async confirmSave() {
    if (!this.pendingTestimonial) return;

    this.saving = true;
    this.isConfirmOpen = false;
    this.message = '';

    try {
      const ok = await this.testimonialService.createTestimonial(
        this.pid,
        this.pendingTestimonial
      );

      if (ok) {
        this.testimonialAddedSuccess = true;
        this.message = 'Thank you — your testimonial has been posted.';
        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
      } else {
        this.testimonialAddedSuccess = false;
        this.message = 'Unable to save testimonial. Please try again.';
      }
    } catch (err) {
      console.error('createTestimonial error', err);
      this.testimonialAddedSuccess = false;
      this.message = 'An unexpected error occurred. Please try again later.';
    } finally {
      this.saving = false;
      this.pendingTestimonial = null;
    }
  }

  //   // close dialog on Escape
  //   @HostListener('window:keydown.escape', ['$event'])
  //   onEscape(_: KeyboardEvent) {
  //     if (this.isConfirmOpen) this.cancelConfirm();
  //   }
}

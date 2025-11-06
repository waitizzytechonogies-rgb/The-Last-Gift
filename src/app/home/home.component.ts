import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeopleService } from '../people.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <div>
      <h1 class="text-2xl font-semibold mb-4">People</h1>

      <ul>
        <li
          *ngFor="let p of people"
          class="p-3 bg-white rounded mb-2 shadow-sm"
        >
          <a [routerLink]="['/person', p.id]" class="block">
            <div class="flex items-center gap-4">
              <img
                *ngIf="p.photoUrl"
                [src]="p.photoUrl"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div class="font-medium">{{ p.name }}</div>
                <div class="text-sm text-slate-500">
                  {{ p.dob ? (p.dob | date : 'mediumDate') : '' }}
                </div>
              </div>
            </div>
          </a>
        </li>
      </ul>

      <!-- Floating add button -->
      <div class="fixed right-6 bottom-6">
        <button
          class="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white bg-indigo-600"
          (click)="showAdd = true"
        >
          +
        </button>
      </div>

      <!-- add overlay -->
      <div
        *ngIf="showAdd"
        class="fixed inset-0 flex items-center justify-center bg-black/40 p-4"
      >
        <div class="bg-white p-6 rounded shadow max-w-lg w-full">
          <h3 class="font-semibold mb-2">Add person</h3>

          <label class="block mb-2">
            <div class="text-sm">Name</div>
            <input [(ngModel)]="form.name" class="w-full p-2 border rounded" />
          </label>

          <label class="block mb-2">
            <div class="text-sm">DOB</div>
            <input
              type="date"
              [(ngModel)]="form.dob"
              class="w-full p-2 border rounded"
            />
          </label>

          <label class="block mb-2">
            <div class="text-sm">Description</div>
            <textarea
              [(ngModel)]="form.description"
              class="w-full p-2 border rounded"
            ></textarea>
          </label>



          <div class="flex justify-end gap-2">
            <button (click)="showAdd = false" class="px-3 py-1">Cancel</button>
            <button
              (click)="add()"
              class="px-3 py-1 bg-indigo-600 text-white rounded"
            >
              Save
            </button>
          </div>

          <div *ngIf="adding" class="mt-3 text-sm text-slate-600">
            Saving...
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {
  people: any[] = [];
  showAdd = false;
  adding = false;
  form = { name: '', dob: '', description: '' };
  private photoFile: File | null = null;

  constructor(private ps: PeopleService, public auth: AuthService) {
    this.load();
  }

  async load() {
    this.people = await this.ps.list();
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.photoFile = input.files[0];
    } else {
      this.photoFile = null;
    }
  }

  async add() {
    if (!this.form.name.trim()) {
      alert('Name is required');
      return;
    }

    if (!this.auth.isLoggedInSync()) {
      alert('You must be signed in to add a person');
      this.showAdd = false;
      return;
    }

    try {
      this.adding = true;
      await this.ps.add(
        {
          name: this.form.name.trim(),
          dob: this.form.dob
            ? new Date(this.form.dob).toISOString()
            : undefined,
          description: this.form.description?.trim(),
        },
        this.photoFile
      );

      // reset & reload
      this.form = { name: '', dob: '', description: '' };
      this.photoFile = null;
      this.showAdd = false;
      await this.load();
    } catch (err) {
      console.error(err);
      alert('Failed to add person: ' + (err as any).message || err);
    } finally {
      this.adding = false;
    }
  }
}

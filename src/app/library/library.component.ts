import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../settings/settings.service';

interface TuningPreset {
  id: string;
  name: string;
  description: string;
  strings: { note: string; altered?: boolean }[];
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library.component.html'
})
export class LibraryComponent {
  settingsService = inject(SettingsService);

  showCustomModal = signal(false);
  customName = '';
  customStrings: string[] = [];
  availableNotes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  pickingNoteForIndex: number | null = null;
  stringCounts = [4, 5, 6, 7, 8];

  presets: TuningPreset[] = [
    {
      id: 'standard',
      name: 'Estándar',
      description: 'E Standard',
      strings: [
        { note: 'E' }, { note: 'A' }, { note: 'D' }, { note: 'G' }, { note: 'B' }, { note: 'E' }
      ]
    },
    {
      id: 'drop_d',
      name: 'Drop D',
      description: 'Heavy Rock / Metal',
      strings: [
        { note: 'D', altered: true }, { note: 'A' }, { note: 'D' }, { note: 'G' }, { note: 'B' }, { note: 'E' }
      ]
    },
    {
      id: 'open_g',
      name: 'Open G',
      description: 'Blues / Slide',
      strings: [
        { note: 'D', altered: true }, { note: 'G' }, { note: 'D' }, { note: 'G' }, { note: 'B' }, { note: 'D', altered: true }
      ]
    },
    {
      id: 'dadgad',
      name: 'DADGAD',
      description: 'Celtic / Folk',
      strings: [
        { note: 'D', altered: true }, { note: 'A' }, { note: 'D' }, { note: 'G' }, { note: 'A', altered: true }, { note: 'D', altered: true }
      ]
    },
    {
      id: 'half_step',
      name: 'Half-step down',
      description: 'Blues Rock / Grunge',
      strings: [
        { note: 'Eb', altered: true }, { note: 'Ab', altered: true }, { note: 'Db', altered: true }, { note: 'Gb', altered: true }, { note: 'Bb', altered: true }, { note: 'Eb', altered: true }
      ]
    }
  ];

  get activePresetId() {
    return this.settingsService.state().activePresetId;
  }

  selectPreset(preset: TuningPreset) {
    if (preset.id === 'standard') {
      this.settingsService.applyPreset(preset.id, null);
    } else {
      this.settingsService.applyPreset(preset.id, preset.strings.map(s => s.note));
    }
  }

  openCustomModal() {
    this.customName = 'Personalizada';
    const count = this.settingsService.state().stringCount;
    this.setCustomStringCount(count);
    this.showCustomModal.set(true);
  }

  setCustomStringCount(count: number) {
    if (count === 4) this.customStrings = ['E', 'A', 'D', 'G'];
    else if (count === 5) this.customStrings = ['B', 'E', 'A', 'D', 'G'];
    else if (count === 6) this.customStrings = ['E', 'A', 'D', 'G', 'B', 'E'];
    else if (count === 7) this.customStrings = ['B', 'E', 'A', 'D', 'G', 'B', 'E'];
    else if (count === 8) this.customStrings = ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'];
    else {
      this.customStrings = Array(count).fill('E');
    }
  }

  openNotePicker(index: number) {
    this.pickingNoteForIndex = index;
  }

  selectNote(note: string) {
    if (this.pickingNoteForIndex !== null) {
      this.customStrings[this.pickingNoteForIndex] = note;
      this.pickingNoteForIndex = null;
    }
  }

  closeNotePicker() {
    this.pickingNoteForIndex = null;
  }

  closeModal() {
    this.showCustomModal.set(false);
    this.pickingNoteForIndex = null;
  }

  saveCustomPreset() {
    if (!this.customName.trim()) this.customName = 'Afinación Custom';
    
    const std = ['E', 'A', 'D', 'G', 'B', 'E'];
    const newPreset: TuningPreset = {
      id: 'custom_' + Date.now(),
      name: this.customName,
      description: 'Personalizada',
      strings: this.customStrings.map((note, i) => ({ 
        note, 
        altered: note !== std[i % std.length] 
      }))
    };

    this.presets.push(newPreset);
    this.selectPreset(newPreset);
    this.closeModal();
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}

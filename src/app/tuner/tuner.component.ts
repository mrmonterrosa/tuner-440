import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TunerService } from '../tuner.service';
import { SettingsService } from '../settings/settings.service';

@Component({
  selector: 'app-tuner',
  imports: [CommonModule],
  templateUrl: './tuner.component.html'
})
export class TunerComponent {
  tunerService = inject(TunerService);
  settingsService = inject(SettingsService);
  tunerState = this.tunerService.state;

  currentStrings = computed(() => {
    const preset = this.settingsService.state().presetStrings;
    if (preset) {
      return preset; // Override with the library preset tuning
    }

    const type = this.settingsService.state().instrumentType;
    const count = this.settingsService.state().stringCount;
    
    if (type === 'Bajo') {
       if (count === 6) return ['B', 'E', 'A', 'D', 'G', 'C'];
       if (count === 7) return ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
       if (count === 8) return ['F#', 'B', 'E', 'A', 'D', 'G', 'C', 'F'];
       return ['E', 'A', 'D', 'G']; // Fallback
    }
    
    if (count === 6) return ['E', 'A', 'D', 'G', 'B', 'e'];
    if (count === 7) return ['B', 'E', 'A', 'D', 'G', 'B', 'e'];
    if (count === 8) return ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'e'];
    
    return ['E', 'A', 'D', 'G', 'B', 'e'];
  });

  toggleTuner() {
    if (this.tunerState().isTuning) {
      this.tunerService.stopTuning();
    } else {
      this.tunerService.startTuning();
    }
  }

  // -5 to 5, skipping 0 which is the center triangle
  get segments(): number[] {
    return [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
  }

  get activeSegmentIndex(): number | null {
    if (!this.tunerState().isTuning) return null;
    const cents = this.tunerState().cents;
    const index = Math.round(cents / 10);
    return Math.max(-5, Math.min(5, index));
  }

  get instructionText(): string {
    if (!this.tunerState().isTuning || this.tunerState().note === '--') return 'Afinador inactivo';
    if (this.isPerfectPitch) return 'Perfecto';
    return this.tunerState().cents > 0 ? 'Bajar el tono' : 'Subir el tono';
  }

  get isPerfectPitch(): boolean {
    const cents = this.tunerState().cents;
    return this.tunerState().isTuning && Math.abs(cents) <= 5;
  }
}

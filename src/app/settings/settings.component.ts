import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService, InstrumentType } from './settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  settingsService = inject(SettingsService);
  settingsState = this.settingsService.state;

  setInstrument(type: InstrumentType) {
    this.settingsService.updateInstrumentType(type);
  }

  setStringCount(count: number) {
    this.settingsService.updateStringCount(count);
  }

  onSensitivityChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.settingsService.updateSensitivity(Number(input.value));
  }
}

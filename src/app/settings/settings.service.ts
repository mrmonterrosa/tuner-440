import { Injectable, signal } from '@angular/core';

export type InstrumentType = 'Acústica' | 'Eléctrica' | 'Bajo';

export interface SettingsState {
  instrumentType: InstrumentType;
  stringCount: number;
  micSensitivity: number; // 0 to 100
  activePresetId: string;
  presetStrings: string[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  state = signal<SettingsState>({
    instrumentType: 'Acústica',
    stringCount: 6,
    micSensitivity: 75,
    activePresetId: 'standard',
    presetStrings: null
  });

  updateInstrumentType(type: InstrumentType) {
    this.state.update(s => ({ ...s, instrumentType: type, activePresetId: 'standard', presetStrings: null }));
  }

  updateStringCount(count: number) {
    this.state.update(s => ({ ...s, stringCount: count, activePresetId: 'standard', presetStrings: null }));
  }

  updateSensitivity(value: number) {
    this.state.update(s => ({ ...s, micSensitivity: value }));
  }

  applyPreset(presetId: string, strings: string[] | null) {
    this.state.update(s => ({ ...s, activePresetId: presetId, presetStrings: strings }));
  }
}

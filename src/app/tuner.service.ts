import { Injectable, signal, OnDestroy, inject } from '@angular/core';
import { SettingsService } from './settings/settings.service';

export interface TunerState {
  note: string;
  octave: number | null;
  frequency: number;
  cents: number;
  isTuning: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TunerService implements OnDestroy {
  settingsService = inject(SettingsService);
  state = signal<TunerState>({
    note: '--',
    octave: null,
    frequency: 0,
    cents: 0,
    isTuning: false
  });

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number = 0;
  private bufferLength: number = 0;
  private dataArray: Float32Array = new Float32Array(0);

  constructor() {}

  async startTuning() {
    if (this.state().isTuning) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096;
      
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.bufferLength = this.analyser.fftSize;
      this.dataArray = new Float32Array(this.bufferLength);
      
      this.state.update(s => ({ ...s, isTuning: true }));
      this.updatePitch();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }

  stopTuning() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.state.set({
      note: '--',
      octave: null,
      frequency: 0,
      cents: 0,
      isTuning: false
    });
  }

  ngOnDestroy() {
    this.stopTuning();
  }

  private updatePitch = () => {
    if (!this.analyser || !this.audioContext) return;

    this.analyser.getFloatTimeDomainData(this.dataArray as any);
    const ac = this.autoCorrelate(this.dataArray, this.audioContext.sampleRate);
    
    if (ac !== -1) {
      const pitch = ac;
      const noteNum = this.noteFromPitch(pitch);
      const detune = this.centsOffFromPitch(pitch, noteNum);
      
      this.state.set({
        note: this.noteStrings[noteNum % 12],
        octave: Math.floor(noteNum / 12) - 1,
        frequency: pitch,
        cents: detune,
        isTuning: true
      });
    }

    this.animationFrameId = requestAnimationFrame(this.updatePitch);
  }

  private noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private noteFromPitch(frequency: number): number {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  private frequencyFromNoteNumber(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  private centsOffFromPitch(frequency: number, note: number): number {
    return Math.floor(1200 * Math.log(frequency / this.frequencyFromNoteNumber(note)) / Math.log(2));
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    let SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    const sensitivity = this.settingsService.state().micSensitivity;
    const threshold = 0.05 - (0.049 * (sensitivity / 100));
    
    if (rms < threshold) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++)
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    const c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
      for (let j = 0; j < SIZE - i; j++)
        c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}

import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metronome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metronome.component.html'
})
export class MetronomeComponent implements OnDestroy {
  bpm = signal<number>(120);
  isPlaying = signal<boolean>(false);
  timeSignature = signal<number>(4);
  currentBeat = signal<number>(0);

  private audioContext: AudioContext | null = null;
  private timerID: number | null = null;
  private nextNoteTime: number = 0.0;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // s

  togglePlay() {
    if (this.isPlaying()) {
      this.stop();
    } else {
      this.start();
    }
  }

  setBpm(value: number) {
    this.bpm.set(Math.max(40, Math.min(250, value)));
  }

  onBpmChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.setBpm(Number(input.value));
  }

  setTimeSignature(beats: number) {
    this.timeSignature.set(beats);
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm();
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat.update(b => (b + 1) % this.timeSignature());
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    
    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);
    
    if (beatNumber === 0) {
      osc.frequency.value = 880.0; // High pitch for downbeat
    } else {
      osc.frequency.value = 440.0; // Normal pitch for other beats
    }
    
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private scheduler = () => {
    while (this.nextNoteTime < this.audioContext!.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeat(), this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = window.setTimeout(this.scheduler, this.lookahead);
  }

  start() {
    if (this.isPlaying()) return;
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    
    this.isPlaying.set(true);
    this.currentBeat.set(0);
    this.nextNoteTime = this.audioContext.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    this.isPlaying.set(false);
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  ngOnDestroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

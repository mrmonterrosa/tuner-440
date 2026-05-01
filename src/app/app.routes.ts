import { Routes } from '@angular/router';
import { TunerComponent } from './tuner/tuner.component';
import { SettingsComponent } from './settings/settings.component';
import { MetronomeComponent } from './metronome/metronome.component';
import { LibraryComponent } from './library/library.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tuner', pathMatch: 'full' },
  { path: 'tuner', component: TunerComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'metronome', component: MetronomeComponent },
  { path: 'library', component: LibraryComponent }
];

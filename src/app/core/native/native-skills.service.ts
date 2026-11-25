import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { NativeSkillOption, NativeSkillResult } from './skill-selection';
const picker = registerPlugin<{ choose(options: { options: NativeSkillOption[]; selectedIds: number[] }): Promise<NativeSkillResult> }>('SkillPicker');
@Injectable({ providedIn: 'root' })
export class NativeSkillsService {
  readonly available = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  choose(options: NativeSkillOption[], selectedIds: number[]): Promise<NativeSkillResult> {
    if (!this.available) return Promise.reject(new Error('Disponible únicamente en Android.'));
    return picker.choose({ options: options.map(({ id, label }) => ({ id, label })), selectedIds });
  }
}

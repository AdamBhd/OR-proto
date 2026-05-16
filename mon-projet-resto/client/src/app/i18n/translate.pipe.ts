import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

/**
 * `{{ 'home.heroTitle' | translate }}`
 *
 * `pure: false` is required: the lookup depends on a signal (lang) that lives
 * outside the pipe's input. The pipe re-runs each change-detection cycle —
 * cheap with OnPush + signals because it's only triggered by signal updates.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(LanguageService);

  transform(key: string): string {
    return this.i18n.t(key);
  }
}

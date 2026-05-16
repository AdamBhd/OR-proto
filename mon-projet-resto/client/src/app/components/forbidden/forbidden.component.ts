import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section style="text-align:center; padding:6rem 1rem;">
      <h1 style="font-family:'Anton',sans-serif; font-size:3rem; margin:0 0 0.5rem;">
        {{ 'forbidden.title' | translate }}
      </h1>
      <p style="color:#555; margin:0 0 1.5rem;">{{ 'forbidden.subtitle' | translate }}</p>
      <a routerLink="/" style="color:#1E88E5; font-weight:700;">
        {{ 'forbidden.back' | translate }}
      </a>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {}

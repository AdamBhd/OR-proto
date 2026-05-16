import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(LanguageService);

  readonly email = signal('admin@yva.local');
  readonly password = signal('admin1234');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email(), this.password()).subscribe({
      next: () => {
        this.loading.set(false);
        const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? this.defaultRoute();
        this.router.navigateByUrl(redirect);
      },
      error: (e) => {
        this.loading.set(false);
        // Distinguish: network failure (status 0) vs server-returned error.
        if (e?.status === 0) {
          this.error.set(this.i18n.t('login.errorNetwork'));
        } else if (e?.status === 401) {
          this.error.set(this.i18n.t('login.errorInvalid'));
        } else {
          this.error.set(
            e?.error?.error ?? `${this.i18n.t('login.errorGeneric')} (HTTP ${e?.status ?? '?'})`,
          );
        }
      },
    });
  }

  /** Sends each role to their natural landing page. */
  private defaultRoute(): string {
    const u = this.auth.user();
    if (!u) return '/';
    if (u.role === 'ADMIN') return '/admin';
    if (u.role === 'OWNER') return '/owner';
    return '/';
  }
}

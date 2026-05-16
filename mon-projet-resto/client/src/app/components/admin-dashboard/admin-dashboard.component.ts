import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalConfigService } from '../../services/global-config.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../../models/restaurant.model';
import { GlobalConfig } from '../../models/global-config.model';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Super Admin dashboard.
 *
 * Today: edit global feature flags + the cross-tenant banner.
 * Save flips the GlobalConfig document — every storefront picks up the change
 * the next time it hydrates.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./dashboard-shared.scss', './admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly globalConfig = inject(GlobalConfigService);
  protected readonly auth = inject(AuthService);

  readonly draft = signal<GlobalConfig | null>(this.globalConfig.config());
  readonly saving = signal(false);
  readonly savedAt = signal<Date | null>(null);
  readonly error = signal<string | null>(null);

  readonly hasDraft = computed(() => !!this.draft());

  ngOnInit(): void {
    if (!this.draft()) {
      // ensure we always have an editable copy
      void this.globalConfig.refresh().then(() => {
        const cfg = this.globalConfig.config();
        if (cfg) this.draft.set(structuredClone(cfg));
      });
    } else {
      this.draft.set(structuredClone(this.draft()!));
    }
  }

  toggleFlagEnabled(flagKey: string): void {
    this.draft.update((d) => {
      if (!d) return d;
      const next = structuredClone(d);
      const f = next.flags.find((x) => x.key === flagKey);
      if (f) f.enabled = !f.enabled;
      return next;
    });
  }

  toggleForceDefault(flagKey: string): void {
    this.draft.update((d) => {
      if (!d) return d;
      const next = structuredClone(d);
      const f = next.flags.find((x) => x.key === flagKey);
      if (f) f.forceDefault = !f.forceDefault;
      return next;
    });
  }

  setDefaultVariant(flagKey: string, variantName: string): void {
    this.draft.update((d) => {
      if (!d) return d;
      const next = structuredClone(d);
      const f = next.flags.find((x) => x.key === flagKey);
      if (f) f.defaultVariant = variantName;
      return next;
    });
  }

  setBannerEnabled(enabled: boolean): void {
    this.draft.update((d) => (d ? { ...d, globalBannerEnabled: enabled } : d));
  }

  setBannerText(text: string): void {
    this.draft.update((d) => (d ? { ...d, globalBannerText: text } : d));
  }

  async save(): Promise<void> {
    const d = this.draft();
    if (!d || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.http.put<ApiEnvelope<GlobalConfig>>(`${environment.apiBase}/global-config`, d),
      );
      await this.globalConfig.refresh();
      this.savedAt.set(new Date());
    } catch (err: unknown) {
      const e = err as { error?: { error?: string }; message?: string };
      this.error.set(e?.error?.error ?? e?.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}

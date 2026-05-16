import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RestaurantService } from '../../services/restaurant.service';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, Restaurant } from '../../models/restaurant.model';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Restaurant Partner (Owner) dashboard.
 * Loads the owner's restaurant by slug-of-record and lets them edit
 * basic text + uiConfig fields + Shopify keys. The PATCH endpoint
 * enforces ownership server-side.
 */
@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['../admin-dashboard/dashboard-shared.scss', './owner-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerDashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly restaurantService = inject(RestaurantService);
  protected readonly auth = inject(AuthService);

  readonly draft = signal<Restaurant | null>(null);
  readonly saving = signal(false);
  readonly savedAt = signal<Date | null>(null);
  readonly error = signal<string | null>(null);

  readonly restaurantId = computed(() => this.auth.user()?.restaurantId ?? null);

  async ngOnInit(): Promise<void> {
    // Owners log in linked to a restaurantId; we look up the doc via /api/restaurants
    // (a richer endpoint /restaurants/by-id/:id can be added later).
    try {
      const all = await firstValueFrom(this.restaurantService.list());
      const mine = all.find((r) => r._id === this.restaurantId());
      if (mine) this.draft.set(structuredClone(mine));
      else this.error.set('Could not find your restaurant. Ask an admin to link your account.');
    } catch (e: unknown) {
      this.error.set((e as Error).message ?? 'Failed to load restaurant');
    }
  }

  patchField<K extends keyof Restaurant>(key: K, value: Restaurant[K]): void {
    this.draft.update((d) => (d ? { ...d, [key]: value } : d));
  }

  patchUi<K extends keyof Restaurant['uiConfig']>(key: K, value: Restaurant['uiConfig'][K]): void {
    this.draft.update((d) => (d ? { ...d, uiConfig: { ...d.uiConfig, [key]: value } } : d));
  }

  async save(): Promise<void> {
    const d = this.draft();
    if (!d || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      // Send only the fields the owner is allowed to change.
      const patch = {
        name: d.name,
        tagline: d.tagline,
        description: d.description,
        phone: d.phone,
        email: d.email,
        address: d.address,
        uiConfig: d.uiConfig,
        shopifyShopUrl: d.shopifyShopUrl,
      };
      await firstValueFrom(
        this.http.patch<ApiEnvelope<Restaurant>>(
          `${environment.apiBase}/restaurants/${d._id}`,
          patch,
        ),
      );
      this.savedAt.set(new Date());
    } catch (err: unknown) {
      const e = err as { error?: { error?: string }; message?: string };
      this.error.set(e?.error?.error ?? e?.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}

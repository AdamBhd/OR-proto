import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { RestaurantService } from '../../services/restaurant.service';
import { GlobalConfigService } from '../../services/global-config.service';
import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { MenuItem, MenuLayout, Restaurant } from '../../models/restaurant.model';

/**
 * Single, data-driven storefront component used by every tenant.
 * Layout / palette / typography / category nav all come from `restaurant.uiConfig`.
 *
 * Visual inspiration: talkintacos.net + shandmas.com — bold hero, sticky
 * category pills, large image-first menu cards, clear CTA per item.
 */
@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly restaurantService = inject(RestaurantService);
  private readonly globalConfig = inject(GlobalConfigService);
  private readonly i18n = inject(LanguageService);

  /** Active category for sticky-nav filtering. `null` = show all. */
  readonly activeCategory = signal<string | null>(null);

  readonly restaurant = toSignal<Restaurant | null>(
    this.route.paramMap.pipe(
      switchMap((p) => this.restaurantService.getBySlug(p.get('slug') ?? '')),
    ),
    { initialValue: null },
  );

  readonly visibleItems = computed<MenuItem[]>(() => {
    const r = this.restaurant();
    if (!r) return [];
    const cat = this.activeCategory();
    return cat ? r.menuItems.filter((i) => i.category === cat) : r.menuItems;
  });

  /** Global banner from GlobalConfig (e.g. "Free delivery this week"). */
  readonly banner = this.globalConfig.banner;

  /**
   * Effective layout = global A/B flag override (sticky on slug) or per-tenant default.
   * This is what makes the UI "data-driven, globally controllable".
   */
  readonly effectiveLayout = computed<MenuLayout>(() => {
    const r = this.restaurant();
    if (!r) return 'GRID';
    const variant = this.globalConfig.resolveVariant('menu.layout', r.slug);
    if (variant === 'GRID' || variant === 'LIST' || variant === 'MAGAZINE') return variant;
    return r.uiConfig.menuLayout;
  });

  /** Sticky category nav can be globally killed via the flag. */
  readonly stickyNavEnabled = computed<boolean>(() => {
    const r = this.restaurant();
    if (!r) return false;
    const variant = this.globalConfig.resolveVariant('storefront.stickyCategoryNav', r.slug);
    if (variant === 'OFF') return false;
    if (variant === 'ON') return true;
    return r.uiConfig.showStickyCategoryNav;
  });

  /** Per-tenant CSS variables — applied on the host element. */
  readonly themeStyles = computed<Record<string, string>>(() => {
    const ui = this.restaurant()?.uiConfig;
    if (!ui) return {} as Record<string, string>;
    const styles: Record<string, string> = {
      '--brand-primary': ui.primaryColor,
      '--brand-secondary': ui.secondaryColor,
      '--brand-accent': ui.accentColor,
      '--font-heading': ui.headingFont,
      '--font-body': ui.bodyFont,
    };
    return styles;
  });

  selectCategory(category: string | null): void {
    this.activeCategory.set(category);
  }

  formatPrice(item: MenuItem): string {
    // Locale follows the active language so prices format e.g. "5,50 $US" in FR.
    return new Intl.NumberFormat(this.i18n.lang(), {
      style: 'currency',
      currency: item.currency || 'USD',
    }).format(item.priceCents / 100);
  }

  /** Headless redirect to the tenant's Shopify checkout. */
  orderItem(item: MenuItem): void {
    const r = this.restaurant();
    if (!r) return;
    const url = this.restaurantService.buildCheckoutUrl(r, item);
    if (url) window.location.href = url;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, MenuItem, Restaurant } from '../models/restaurant.model';
import { environment } from '../../environments/environment';

/**
 * Single point of entry for restaurant configuration on the frontend.
 * Drives the data-driven RestaurantDetailComponent — no per-tenant code paths.
 */
@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBase;

  /** List published restaurants (directory / homepage). */
  list(): Observable<Restaurant[]> {
    return this.http
      .get<ApiEnvelope<Restaurant[]>>(`${this.apiBase}/restaurants`)
      .pipe(map((r) => r.data));
  }

  /** Fetch one restaurant's full configuration by slug. */
  getBySlug(slug: string): Observable<Restaurant> {
    return this.http
      .get<ApiEnvelope<Restaurant>>(`${this.apiBase}/restaurants/${slug}`)
      .pipe(map((r) => r.data));
  }

  /**
   * Headless checkout redirect URL for a Shopify variant.
   * The actual cart + payment lives on the tenant's Shopify store.
   */
  buildCheckoutUrl(restaurant: Restaurant, item: MenuItem, quantity = 1): string | null {
    if (!item.shopifyVariantId || !restaurant.shopifyShopUrl) return null;
    const shop = restaurant.shopifyShopUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${shop}/cart/${item.shopifyVariantId}:${quantity}`;
  }
}

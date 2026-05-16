import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiEnvelope } from '../models/restaurant.model';
import { FeatureFlag, GlobalConfig } from '../models/global-config.model';

/**
 * Hydrates and exposes the singleton GlobalConfig.
 * - `loadOnce()` is called once at app boot via APP_INITIALIZER.
 * - `resolveVariant(key)` returns the variant a given client should see for an A/B flag,
 *   honouring `forceDefault` and falling back gracefully if the flag is missing.
 */
@Injectable({ providedIn: 'root' })
export class GlobalConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBase;

  private readonly _config = signal<GlobalConfig | null>(null);

  readonly config = computed(() => this._config());
  readonly banner = computed(() => {
    const c = this._config();
    return c?.globalBannerEnabled ? c.globalBannerText : null;
  });

  /** Called from APP_INITIALIZER. Resolves even if the API is offline (degraded mode). */
  loadOnce(): Promise<void> {
    return firstValueFrom(
      this.http.get<ApiEnvelope<GlobalConfig>>(`${this.apiBase}/global-config`).pipe(
        map(({ data }) => data),
        catchError(() => of(null)),
      ),
    ).then((cfg) => {
      this._config.set(cfg);
    });
  }

  /** Refresh on demand (e.g. after the Admin saves a flag change). */
  refresh(): Promise<void> {
    return this.loadOnce();
  }

  /**
   * Pick the variant for a given flag key.
   * - returns `null` if the flag is missing / disabled
   * - returns `defaultVariant` if `forceDefault` is true (kill-switch behaviour)
   * - otherwise weights the variants client-side (sticky on `seed` if provided)
   */
  resolveVariant(key: string, seed?: string): string | null {
    const flag = this.findFlag(key);
    if (!flag || !flag.enabled) return null;
    if (flag.forceDefault) return flag.defaultVariant;
    return this.weightedPick(flag, seed) ?? flag.defaultVariant;
  }

  findFlag(key: string): FeatureFlag | undefined {
    return this._config()?.flags.find((f) => f.key === key);
  }

  private weightedPick(flag: FeatureFlag, seed?: string): string | null {
    const total = flag.variants.reduce((s, v) => s + v.weight, 0);
    if (total <= 0) return null;
    // Stable PRNG based on seed (e.g. user id or restaurant slug) — same
    // seed always picks the same variant, which is what you want for A/B.
    const rand = seed ? hash01(`${flag.key}:${seed}`) : Math.random();
    let pick = rand * total;
    for (const v of flag.variants) {
      pick -= v.weight;
      if (pick <= 0) return v.name;
    }
    return flag.variants[flag.variants.length - 1]?.name ?? null;
  }
}

/** Tiny deterministic [0,1) hash for sticky bucket assignment. */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

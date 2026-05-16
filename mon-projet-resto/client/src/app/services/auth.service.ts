import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthUser, LoginResponse, UserRole } from '../models/auth.model';
import { ApiEnvelope } from '../models/restaurant.model';

const STORAGE_KEY = 'yva.auth';

interface PersistedAuth {
  token: string;
  user: AuthUser;
}

/**
 * Holds the current auth state in a signal — components subscribe via signals
 * (no manual subscription / unsubscription).
 *
 * SSR-safe: localStorage access is gated on `isPlatformBrowser`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBase = environment.apiBase;

  private readonly _state = signal<PersistedAuth | null>(this.readFromStorage());

  readonly user = computed<AuthUser | null>(() => this._state()?.user ?? null);
  readonly token = computed<string | null>(() => this._state()?.token ?? null);
  readonly isAuthenticated = computed(() => !!this._state());

  hasRole(...roles: UserRole[]): boolean {
    const u = this.user();
    return !!u && roles.includes(u.role);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<ApiEnvelope<LoginResponse>>(`${this.apiBase}/auth/login`, { email, password })
      .pipe(
        tap(({ data }) => this.persist(data)),
        map(({ data }) => data),
      );
  }

  register(email: string, password: string, displayName: string): Observable<LoginResponse> {
    return this.http
      .post<ApiEnvelope<LoginResponse>>(`${this.apiBase}/auth/register`, {
        email,
        password,
        displayName,
      })
      .pipe(
        tap(({ data }) => this.persist(data)),
        map(({ data }) => data),
      );
  }

  logout(): void {
    this._state.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(payload: PersistedAuth): void {
    this._state.set(payload);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }

  private readFromStorage(): PersistedAuth | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedAuth) : null;
    } catch {
      return null;
    }
  }
}

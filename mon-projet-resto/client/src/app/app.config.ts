import { ApplicationConfig, APP_INITIALIZER, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { GlobalConfigService } from './services/global-config.service';

/**
 * Hydrates the GlobalConfig before the first route renders.
 * `inject()` must be called inside the factory itself (which runs in an
 * injection context), not inside the returned thunk.
 */
function initGlobalConfig() {
  const cfg = inject(GlobalConfigService);
  return () => cfg.loadOnce();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initGlobalConfig,
    },
  ],
};

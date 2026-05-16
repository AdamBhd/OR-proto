import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * OpenRate brand mark — a circular "OR" monogram with a blue gradient
 * paired (optionally) with the wordmark.
 *
 * Built from scratch as inline SVG so it scales crisply, picks up
 * `currentColor` for the wordmark, and theme-matches without an extra HTTP fetch.
 */
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <span class="brand-logo" [class.brand-logo--wordmark]="showWordmark">
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="OpenRate"
      >
        <defs>
          <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#3DA5F5" />
            <stop offset="55%" stop-color="#1E88E5" />
            <stop offset="100%" stop-color="#0D47A1" />
          </linearGradient>
        </defs>

        <!-- O ring -->
        <circle
          cx="32" cy="32" r="24"
          fill="none"
          [attr.stroke]="'url(#' + gradientId + ')'"
          stroke-width="7"
        />
        <!-- R stem -->
        <rect
          x="34" y="20" width="6" height="24"
          rx="2"
          [attr.fill]="'url(#' + gradientId + ')'"
        />
        <!-- R leg, angled out from the stem -->
        <path
          d="M40 36 L48 48"
          [attr.stroke]="'url(#' + gradientId + ')'"
          stroke-width="6"
          stroke-linecap="round"
          fill="none"
        />
      </svg>

      @if (showWordmark) {
        <span class="brand-logo__wordmark">OpenRate</span>
      }
    </span>
  `,
  styles: [
    `
      .brand-logo {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        line-height: 1;
      }
      .brand-logo__wordmark {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 700;
        font-size: 1.1rem;
        letter-spacing: -0.01em;
        color: currentColor;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandLogoComponent {
  /** SVG size in px. Default suits a header. */
  @Input() size = 32;
  /** Render the "OpenRate" wordmark next to the mark. */
  @Input() showWordmark = true;

  // Unique id so multiple instances on a page don't collide on the gradient.
  protected readonly gradientId = `or-gradient-${Math.random().toString(36).slice(2, 9)}`;
}

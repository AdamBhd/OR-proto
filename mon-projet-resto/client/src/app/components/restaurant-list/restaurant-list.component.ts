import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RestaurantService } from '../../services/restaurant.service';
import { GlobalConfigService } from '../../services/global-config.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantListComponent {
  private readonly restaurantService = inject(RestaurantService);
  private readonly globalConfig = inject(GlobalConfigService);

  readonly restaurants = toSignal(this.restaurantService.list(), { initialValue: [] });
  readonly banner = this.globalConfig.banner;
}

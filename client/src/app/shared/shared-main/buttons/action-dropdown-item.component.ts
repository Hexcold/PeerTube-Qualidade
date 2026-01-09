import { Component, input, TemplateRef } from '@angular/core'
import { CommonModule, NgTemplateOutlet } from '@angular/common'
import { RouterLink, Params } from '@angular/router'
import { GlobalIconComponent } from '../../shared-icons/global-icon.component'
import { ActorAvatarComponent } from '@app/shared/shared-actor-image/actor-avatar.component'
import { DropdownAction } from './action-dropdown.model'

@Component({
  selector: 'my-action-dropdown-item',
  standalone: true,
  imports: [CommonModule, RouterLink, GlobalIconComponent, ActorAvatarComponent, NgTemplateOutlet],
  template: `
    @if (action().handler) {
      <button class="dropdown-item" (click)="action().handler!(entry())" [title]="action().title || ''">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>
    } @else {
      <a class="dropdown-item" [routerLink]="action().linkBuilder!(entry())" [queryParams]="getQueryParams()" [title]="action().title || ''">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </a>
    }
    <ng-template #content>
      @if (action().iconName) { <my-global-icon [iconName]="action().iconName!"></my-global-icon> }
      @if (action().actorAvatar) { <my-actor-avatar [actor]="action().actorAvatar!.actor" [type]="action().actorAvatar!.type"></my-actor-avatar> }
      <span class="action-label">{{ action().label }}</span>
      @if (extraTemplate()) { <ng-container *ngTemplateOutlet="extraTemplate()!; context: { $implicit: action(), entry: entry() }"></ng-container> }
    </ng-template>
  `
})
export class ActionDropdownItemComponent<T, D = never> {
  readonly action = input.required<DropdownAction<T, D>>()
  readonly entry = input.required<T>()
  readonly extraTemplate = input<TemplateRef<any> | null>(null)
  getQueryParams(): Params { return this.action().queryParamsBuilder ? this.action().queryParamsBuilder(this.entry()) : {} }
}
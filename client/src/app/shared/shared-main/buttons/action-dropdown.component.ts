import { ChangeDetectionStrategy, Component, ContentChild, input, OnChanges, output, TemplateRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { ActionDropdownItemComponent } from './action-dropdown-item.component'
import { DropdownAction, DropdownButtonIcon, DropdownButtonSize, DropdownTheme } from './action-dropdown.model'

@Component({
  selector: 'my-action-dropdown',
  styleUrls: [ './action-dropdown.component.scss' ],
  templateUrl: './action-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ CommonModule, NgbTooltipModule, NgbDropdownModule, ActionDropdownItemComponent ]
})
export class ActionDropdownComponent<T, D = never> implements OnChanges {
  readonly actions = input<DropdownAction<T, D>[] | DropdownAction<T, D>[][]>([])
  readonly entry = input<T>(undefined)
  readonly placement = input('bottom-left auto')
  readonly container = input<null | 'body'>(undefined)
  readonly buttonSize = input<DropdownButtonSize>('normal')
  readonly buttonIcon = input<DropdownButtonIcon>('more-horizontal')
  readonly buttonStyled = input(true)
  readonly label = input<string>(undefined)
  readonly theme = input<DropdownTheme>('secondary')
  readonly openChange = output<boolean>()

  @ContentChild('dropdownItemExtra') dropdownItemExtra: TemplateRef<any>
  buttonClasses: Record<string, boolean> = {}

  ngOnChanges () {
    this.buttonClasses = {
      'icon-only': !this.label(),
      'peertube-button': this.buttonStyled(),
      'peertube-button-small': this.buttonSize() === 'small',
      'secondary-button': this.theme() === 'secondary',
      'primary-button': this.theme() === 'primary'
    }
  }

  getActions() {
    const a = this.actions();
    return (a.length > 0 && Array.isArray(a[0])) ? a as DropdownAction<T, D>[][] : [a as DropdownAction<T, D>[]];
  }

  areActionsDisplayed(actions: any[]): boolean {
    return actions.some(a => Array.isArray(a) ? this.areActionsDisplayed(a) : (a.isHeader !== true && (!a.isDisplayed || a.isDisplayed(this.entry()))));
  }
}
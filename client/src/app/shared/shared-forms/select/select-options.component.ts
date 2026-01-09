// client/src/app/shared/shared-forms/select/select-options.component.ts

import { CommonModule } from '@angular/common'
import {
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  ContentChild,
  forwardRef,
  HostListener,
  inject,
  input,
  numberAttribute,
  TemplateRef
} from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { SelectModule } from 'primeng/select'
import { SelectOptionsItem } from '../../../../types/select-options-item.model'

@Component({
  selector: 'my-select-options',
  templateUrl: './select-options.component.html',
  styleUrls: [ './select-options.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectOptionsComponent),
      multi: true
    }
  ],
  imports: [ SelectModule, FormsModule, CommonModule ]
})
export class SelectOptionsComponent implements ControlValueAccessor {
  private cd = inject(ChangeDetectorRef)

  readonly items = input<SelectOptionsItem[]>([])
  readonly inputId = input.required<string>()
  readonly clearable = input(false, { transform: booleanAttribute })
  readonly filter = input(false, { transform: booleanAttribute })
  readonly virtualScroll = input(false, { transform: booleanAttribute })
  readonly virtualScrollItemSize = input(39, { transform: numberAttribute })

  @ContentChild('selectOption', { descendants: false })
  selectOptionTemplate: TemplateRef<{ $implicit: SelectOptionsItem }>

  @ContentChild('itemExtra', { descendants: false })
  itemExtraTemplate: TemplateRef<{ $implicit: SelectOptionsItem }>

  selectedId: number | string
  disabled = false
  wroteValue: number | string

  propagateChange = (_: number | string) => {
    // empty
  }

  @HostListener('change', [ '$event.target' ])
  handleChange (target: HTMLInputElement) {
    if (target.role === 'searchbox') return

    this.writeValue(target.value)
    this.onModelChange()
  }

  writeValue (id: number | string) {
    this.selectedId = id
    this.wroteValue = id
    this.cd.detectChanges()
  }

  registerOnChange (fn: (id: number | string) => void) {
    this.propagateChange = fn
  }

  registerOnTouched () {
    // Unused
  }

  onModelChange () {
    if (this.wroteValue !== undefined && this.wroteValue === this.selectedId) {
      return
    }

    this.wroteValue = undefined
    this.propagateChange(this.selectedId)
  }

  setDisabledState (isDisabled: boolean) {
    this.disabled = isDisabled
  }

  getSelectedItem (): SelectOptionsItem | undefined {
    return this.items().find(i => i.id === this.selectedId)
  }
}
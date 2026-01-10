import { CommonModule } from '@angular/common';
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
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SelectOptionsItem } from '../../../../types/select-options-item.model';

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
  private cd = inject(ChangeDetectorRef);

  readonly items = input<SelectOptionsItem[]>([]);
  readonly inputId = input.required<string>();
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly filter = input(false, { transform: booleanAttribute });
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  readonly virtualScrollItemSize = input(39, { transform: numberAttribute });

  // Refatorado: TemplateRef<any> -> TemplateRef<unknown>
  @ContentChild('selectOption', { descendants: false })
  selectOptionTemplate: TemplateRef<unknown>;

  // Refatorado: TemplateRef<any> -> TemplateRef<unknown>
  @ContentChild('itemExtra', { descendants: false })
  itemExtraTemplate: TemplateRef<unknown>;

  // Refatorado: Adicionado null para suportar reset de formulário
  selectedId: number | string | null = null;
  disabled = false;

  wroteValue: number | string | null | undefined;

  // Refatorado: Tipagem explícita do callback
  propagateChange = (_: number | string | null) => {
    // empty
  };

  @HostListener('change', [ '$event.target' ])
  handleChange (target: HTMLInputElement) {
    if (target.role === 'searchbox') return;

    this.writeValue(target.value);
    this.onModelChange();
  }

  // Refatorado: Tipagem da entrada do writeValue
  writeValue (id: number | string | null) {
    this.selectedId = id;

    // https://github.com/primefaces/primeng/issues/14609 workaround
    this.wroteValue = id;
    this.cd.detectChanges();
  }

  // Refatorado: Tipagem do registro
  registerOnChange (fn: (_: number | string | null) => void) {
    this.propagateChange = fn;
  }

  registerOnTouched () {
    // Unused
  }

  onModelChange () {
    if (this.wroteValue !== undefined && this.wroteValue === this.selectedId) {
      return;
    }

    this.wroteValue = undefined;
    this.propagateChange(this.selectedId);
  }

  setDisabledState (isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  getSelectedItem () {
    return this.items().find(i => i.id === this.selectedId);
  }
}
import { NgClass, isPlatformBrowser } from '@angular/common'
import { AfterViewInit, Component, ElementRef, forwardRef, inject, input, model, viewChild, PLATFORM_ID, Renderer2 } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { GlobalIconComponent } from '../shared-icons/global-icon.component'
import { CopyButtonComponent } from '../shared-main/buttons/copy-button.component'
import { FormReactiveErrors } from './form-reactive.service'

@Component({
  selector: 'my-input-text',
  templateUrl: './input-text.component.html',
  styleUrls: [ './input-text.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTextComponent),
      multi: true
    }
  ],
  imports: [ FormsModule, NgClass, GlobalIconComponent, CopyButtonComponent ]
})
export class InputTextComponent implements ControlValueAccessor, AfterViewInit {
  // injetei o renderer e o id da plataforma pra evitar manipulação direta insegura
  private renderer = inject(Renderer2)
  private platformId = inject(PLATFORM_ID)

  readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('input')

  readonly inputId = input.required<string>()

  readonly value = model('')
  readonly autocomplete = input('off')
  readonly placeholder = input('')
  readonly tabindex = input(0)
  readonly withToggle = input(true)
  readonly withCopy = input(false)
  readonly readonly = input(false)
  readonly show = model(false)
  readonly formError = input<string | FormReactiveErrors | FormReactiveErrors[]>(undefined)
  readonly autofocus = input(false)
  readonly ariaLabel = input<string>(undefined)

  get inputType () {
    return this.show()
      ? 'text'
      : 'password'
  }

  get toggleTitle () {
    return this.show()
      ? $localize`Hide`
      : $localize`Show`
  }

  ngAfterViewInit () {
    if (this.autofocus() !== true) return

    this.focus()
  }

  toggle () {
    this.show.set(!this.show())
  }

  propagateChange = (_: any) => {
    // empty
  }

  writeValue (value: string) {
    this.value.set(value)
  }

  registerOnChange (fn: (_: any) => void) {
    this.propagateChange = fn
  }

  registerOnTouched () {
    // Unused
  }

  update () {
    this.propagateChange(this.value())
  }

  focus () {
    // verifiquei a plataforma antes de acessar o nativeelement
    if (isPlatformBrowser(this.platformId)) {
      const el = this.inputElement()?.nativeElement

      if (el) {
        el.focus({ preventScroll: true })
      }
    }
  }
}
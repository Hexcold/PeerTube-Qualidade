// client/src/app/shared/shared-forms/reactive-file.component.ts

import { CommonModule } from '@angular/common'
import { Component, forwardRef, inject, input, OnChanges, OnInit, output } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Notifier } from '@app/core'
import { GlobalIconComponent, GlobalIconName } from '@app/shared/shared-icons/global-icon.component'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'my-reactive-file',
  styleUrls: [ './reactive-file.component.scss' ],
  templateUrl: './reactive-file.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReactiveFileComponent),
      multi: true
    }
  ],
  imports: [ CommonModule, NgbTooltipModule, FormsModule, GlobalIconComponent ]
})
export class ReactiveFileComponent implements OnInit, OnChanges, ControlValueAccessor {
  private notifier = inject(Notifier)

  readonly theme = input<'primary' | 'secondary'>('secondary')
  readonly inputLabel = input<string>(undefined)
  readonly inputName = input<string>(undefined)
  readonly extensions = input<string[]>([])
  readonly maxFileSize = input<number>(undefined)

  readonly displayFilename = input(false)
  readonly displayReset = input(false)

  readonly icon = input<GlobalIconName>(undefined)
  readonly buttonTooltip = input<string>(undefined)

  readonly fileChanged = output<File | null>()

  classes: { [id: string]: boolean } = {}
  allowedExtensionsMessage = ''
  
  // CORREÇÃO: Tipagem de any para string | null
  fileInputValue: string | null = null 
  file: File | null = null 

  get filename () {
    if (!this.file) return ''
    return this.file.name
  }

  ngOnInit () {
    this.allowedExtensionsMessage = this.extensions().join(', ')
    this.buildClasses()
  }

  ngOnChanges () {
    this.buildClasses()
  }

  buildClasses () {
    this.classes = {
      'with-icon': !!this.icon(),
      'primary-button': this.theme() === 'primary',
      'secondary-button': this.theme() === 'secondary',
      'icon-only': !this.inputLabel()
    }
  }

  // CORREÇÃO: Tipagem do evento de 'any' para 'Event'
  fileChange (event: Event) {
    const target = event.target as HTMLInputElement
    
    if (target.files?.length) {
      const file = target.files[0]

      if (file.size > this.maxFileSize()) {
        this.notifier.error($localize`This file is too large.`)
        return
      }

      const extension = '.' + file.name.split('.').pop()
      if (this.extensions().includes(extension.toLowerCase()) === false) {
        const message = $localize`PeerTube cannot handle this kind of file. Accepted extensions are ${this.allowedExtensionsMessage}.`
        this.notifier.error(message)
        return
      }

      this.file = file
      this.propagateChange(this.file)
    }
    this.fileChanged.emit(this.file)
  }

  reset () {
    this.writeValue(null)
    this.propagateChange(null)
    this.fileChanged.emit(null)
  }

  // CORREÇÃO: Tipagem da função de propagação
  propagateChange = (_: File | null) => {
    // empty
  }

  // CORREÇÃO: Tipagem do valor recebido do formulário
  writeValue (file: File | null) {
    this.file = file

    if (!this.file) this.fileInputValue = null
  }

  // CORREÇÃO: Tipagem do callback registrado
  registerOnChange (fn: (value: File | null) => void) {
    this.propagateChange = fn
  }

  registerOnTouched () {
    // Unused
  }
}

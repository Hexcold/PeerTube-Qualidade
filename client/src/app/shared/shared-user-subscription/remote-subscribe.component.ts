import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms'
import { FormReactiveService } from '@app/shared/shared-forms/form-reactive.service'
import { USER_EMAIL_VALIDATOR } from '@app/shared/form-validators/user-validators'

@Component({
  selector: 'my-remote-subscribe',
  templateUrl: './remote-subscribe.component.html',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule]
})
export class RemoteSubscribeComponent implements OnInit {
  private formReactiveService = inject(FormReactiveService)

  form: FormGroup

  @Input() interact: () => boolean = () => false
  @Input() showHelp: () => boolean = () => true

  @Output() submitForm = new EventEmitter<string>()

  ngOnInit () {
    const result = this.formReactiveService.buildForm({
      text: USER_EMAIL_VALIDATOR
    })

    this.form = result.form
  }

  onValidKey () {
    if (this.form.valid) {
      this.formValidated()
    }
  }

  formValidated () {
    if (!this.form.valid) return

    this.submitForm.emit(this.form.value.text)
  }
}

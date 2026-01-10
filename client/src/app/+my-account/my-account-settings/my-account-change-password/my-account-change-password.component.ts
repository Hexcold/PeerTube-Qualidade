import { Component, OnInit, inject } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms' // import do formgroup
import { AuthService, Notifier, ServerService, UserService } from '@app/core'
import {
  USER_CONFIRM_PASSWORD_VALIDATOR,
  USER_EXISTING_PASSWORD_VALIDATOR,
  getUserNewPasswordValidator
} from '@app/shared/form-validators/user-validators'
// troquei a herança pelo service especializado
import { FormValidatorService } from '@app/shared/shared-forms/form-validator.service'
import { FormReactiveErrors, FormReactiveMessages } from '@app/shared/shared-forms/form-reactive.service'
import { AlertComponent } from '@app/shared/shared-main/common/alert.component'
import { HttpStatusCode, User } from '@peertube/peertube-models'
import { filter } from 'rxjs/operators'
import { InputTextComponent } from '../../../shared/shared-forms/input-text.component'

@Component({
  selector: 'my-account-change-password',
  templateUrl: './my-account-change-password.component.html',
  styleUrls: [ './my-account-change-password.component.scss' ],
  imports: [ FormsModule, ReactiveFormsModule, InputTextComponent, AlertComponent ]
})
// removi o extends pra seguir o principio de composição
export class MyAccountChangePasswordComponent implements OnInit {
  private notifier = inject(Notifier)
  private authService = inject(AuthService)
  private userService = inject(UserService)
  private serverService = inject(ServerService)
  private formValidatorService = inject(FormValidatorService)

  // propriedades que antes eram herdadas e agora estao explicitas
  form: FormGroup
  formErrors: FormReactiveErrors
  validationMessages: FormReactiveMessages

  error: string
  user: User

  ngOnInit () {
    const { minLength, maxLength } = this.serverService.getHTMLConfig().fieldsConstraints.users.password

    // usando o service injetado pra montar o form de troca de senha
    const { form, formErrors, validationMessages } = this.formValidatorService.internalBuildForm({
      'current-password': USER_EXISTING_PASSWORD_VALIDATOR,
      'new-password': getUserNewPasswordValidator(minLength, maxLength),
      'new-confirmed-password': USER_CONFIRM_PASSWORD_VALIDATOR
    })

    this.form = form
    this.formErrors = formErrors
    this.validationMessages = validationMessages

    this.user = this.authService.getUser()

    const confirmPasswordControl = this.form.get('new-confirmed-password')

    // logica de comparação de senhas continua igual, so que agora o contexto é local
    confirmPasswordControl.valueChanges
      .pipe(filter(v => v !== this.form.value['new-password']))
      .subscribe(() => confirmPasswordControl.setErrors({ matchPassword: true }))
  }

  changePassword () {
    const currentPassword = this.form.value['current-password']
    const newPassword = this.form.value['new-password']

    this.userService.changePassword(currentPassword, newPassword)
      .subscribe({
        next: () => {
          this.notifier.success($localize`Password updated.`)

          this.form.reset()
          this.error = null
        },

        error: err => {
          if (err.status === HttpStatusCode.UNAUTHORIZED_401) {
            this.error = $localize`You current password is invalid.`
            return
          }

          this.error = err.message
        }
      })
  }
}
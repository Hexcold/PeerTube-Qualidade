import { Component, OnInit, inject, model } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms' // adicionei o formgroup
import { Notifier, UserService } from '@app/core'
// troquei o formreactive pelo service que centraliza a logica
import { FormValidatorService } from '@app/shared/shared-forms/form-validator.service'
import { FormReactiveErrors, FormReactiveMessages, FormReactiveService } from '@app/shared/shared-forms/form-reactive.service'
import { PeerTubeTemplateDirective } from '@app/shared/shared-main/common/peertube-template.directive'
import { User, UserUpdateMe } from '@peertube/peertube-models'
import { PeertubeCheckboxComponent } from '../../../shared/shared-forms/peertube-checkbox.component'

@Component({
  selector: 'my-account-email-preferences',
  templateUrl: './my-account-email-preferences.component.html',
  styleUrls: [ './my-account-email-preferences.component.scss' ],
  imports: [ FormsModule, ReactiveFormsModule, PeertubeCheckboxComponent, PeerTubeTemplateDirective ]
})
// removi o extends pra usar composicao
export class MyAccountEmailPreferencesComponent implements OnInit {
  protected formReactiveService = inject(FormReactiveService)
  private userService = inject(UserService)
  private notifier = inject(Notifier)
  private formValidatorService = inject(FormValidatorService)

  // declarei as propriedades de form explicitamente
  form: FormGroup
  formErrors: FormReactiveErrors
  validationMessages: FormReactiveMessages

  readonly user = model<User>(undefined)

  checkboxLabel: string

  ngOnInit () {
    // uso o service pra criar o formulario de preferencias
    const { form, formErrors, validationMessages } = this.formValidatorService.internalBuildForm({
      'email-public': null
    })

    this.form = form
    this.formErrors = formErrors
    this.validationMessages = validationMessages

    this.form.patchValue({ 'email-public': this.user().emailPublic })

    this.checkboxLabel = $localize``
  }

  updateEmailPublic () {
    const details: UserUpdateMe = {
      emailPublic: this.form.value['email-public']
    }

    this.userService.updateMyProfile(details)
      .subscribe({
        next: () => {
          if (details.emailPublic) this.notifier.success($localize`Email is now public`)
          else this.notifier.success($localize`Email is now private`)

          this.user.update(u => ({ ...u, emailPublic: details.emailPublic }))
        },

        error: err => this.notifier.handleError(err)
      })
  }
}
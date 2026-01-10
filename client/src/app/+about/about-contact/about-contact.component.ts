import { NgClass } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms' // adicionei o formgroup
import { ActivatedRoute } from '@angular/router'
import { ServerService } from '@app/core'
import {
  BODY_VALIDATOR,
  FROM_EMAIL_VALIDATOR,
  FROM_NAME_VALIDATOR,
  SUBJECT_VALIDATOR
} from '@app/shared/form-validators/instance-validators'
// import do serviço que lida com a logica que antes vinha por herança
import { FormValidatorService } from '@app/shared/shared-forms/form-validator.service'
import { FormReactiveErrors, FormReactiveMessages } from '@app/shared/shared-forms/form-reactive.service'
import { AlertComponent } from '@app/shared/shared-main/common/alert.component'
import { InstanceService } from '@app/shared/shared-main/instance/instance.service'
import { HTMLServerConfig, HttpStatusCode } from '@peertube/peertube-models'

type Prefill = {
  subject?: string
  body?: string
}

@Component({
  templateUrl: './about-contact.component.html',
  styleUrls: [ './about-contact.component.scss' ],
  imports: [ FormsModule, ReactiveFormsModule, NgClass, AlertComponent ]
})
// removi o extends pra seguir o principio de composição
export class AboutContactComponent implements OnInit {
  private formValidatorService = inject(FormValidatorService)
  private route = inject(ActivatedRoute)
  private instanceService = inject(InstanceService)
  private serverService = inject(ServerService)

  // declarei as propriedades explicitamente em vez de herdar no escuro
  form: FormGroup
  formErrors: FormReactiveErrors
  validationMessages: FormReactiveMessages

  error: string
  success: string

  private serverConfig: HTMLServerConfig

  get instanceName () {
    return this.serverConfig.instance.name
  }

  ngOnInit () {
    this.serverConfig = this.serverService.getHTMLConfig()

    // agora uso o serviço injetado pra construir o form
    const { form, formErrors, validationMessages } = this.formValidatorService.internalBuildForm({
      fromName: FROM_NAME_VALIDATOR,
      fromEmail: FROM_EMAIL_VALIDATOR,
      subject: SUBJECT_VALIDATOR,
      body: BODY_VALIDATOR
    })

    this.form = form
    this.formErrors = formErrors
    this.validationMessages = validationMessages

    this.prefillForm(this.route.snapshot.queryParams)
  }

  isContactFormEnabled () {
    return this.serverConfig.email.enabled && this.serverConfig.contactForm.enabled
  }

  sendForm () {
    const fromName = this.form.value['fromName']
    const fromEmail = this.form.value['fromEmail']
    const subject = this.form.value['subject']
    const body = this.form.value['body']

    this.instanceService.contactAdministrator(fromEmail, fromName, subject, body)
      .subscribe({
        next: () => {
          this.success = $localize`Your message has been sent.`
        },

        error: err => {
          this.error = err.status === HttpStatusCode.FORBIDDEN_403
            ? $localize`You already sent this form recently`
            : err.message
        }
      })
  }

  private prefillForm (prefill: Prefill) {
    if (prefill.subject) {
      this.form.get('subject').setValue(prefill.subject)
    }

    if (prefill.body) {
      this.form.get('body').setValue(prefill.body)
    }
  }
}
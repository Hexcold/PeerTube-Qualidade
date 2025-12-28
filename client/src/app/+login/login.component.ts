import { NgClass } from '@angular/common'
import { AfterViewInit, Component, ElementRef, LOCALE_ID, OnInit, inject, viewChild } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms' // adicionei o formgroup
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { AuthService, Notifier, RedirectService, SessionStorageService, UserService } from '@app/core'
import { HooksService } from '@app/core/plugins/hooks.service'
import { LOGIN_PASSWORD_VALIDATOR, LOGIN_USERNAME_VALIDATOR } from '@app/shared/form-validators/login-validators'
import { USER_OTP_TOKEN_VALIDATOR } from '@app/shared/form-validators/user-validators'
// troquei a herança pelo serviço que ja refatoramos
import { FormValidatorService } from '@app/shared/shared-forms/form-validator.service'
import { FormReactiveErrors, FormReactiveMessages } from '@app/shared/shared-forms/form-reactive.service'
import { InputTextComponent } from '@app/shared/shared-forms/input-text.component'
import { InstanceAboutAccordionComponent } from '@app/shared/shared-instance/instance-about-accordion.component'
import { AlertComponent } from '@app/shared/shared-main/common/alert.component'
import { NgbAccordionDirective, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'
import { getCompleteLocale, getExternalAuthHref } from '@peertube/peertube-core-utils'
import { RegisteredExternalAuthConfig, ServerConfig, ServerErrorCode } from '@peertube/peertube-models'
import { of, switchMap } from 'rxjs'
import { environment } from 'src/environments/environment'
import { GlobalIconComponent } from '../shared/shared-icons/global-icon.component'
import { InstanceBannerComponent } from '../shared/shared-instance/instance-banner.component'
import { AutofocusDirective } from '../shared/shared-main/common/autofocus.directive'
import { PluginSelectorDirective } from '../shared/shared-main/plugins/plugin-selector.directive'

@Component({
  selector: 'my-login',
  templateUrl: './login.component.html',
  styleUrls: [ './login.component.scss' ],
  imports: [
    RouterLink,
    FormsModule,
    PluginSelectorDirective,
    ReactiveFormsModule,
    AutofocusDirective,
    NgClass,
    InputTextComponent,
    InstanceBannerComponent,
    InstanceAboutAccordionComponent,
    GlobalIconComponent,
    AlertComponent
  ]
})
// removi o extends pra usar composicao
export class LoginComponent implements OnInit, AfterViewInit {
  private formValidatorService = inject(FormValidatorService)
  private route = inject(ActivatedRoute)
  private modalService = inject(NgbModal)
  private authService = inject(AuthService)
  private userService = inject(UserService)
  private redirectService = inject(RedirectService)
  private notifier = inject(Notifier)
  private hooks = inject(HooksService)
  private storage = inject(SessionStorageService)
  private router = inject(Router)
  private localeId = inject(LOCALE_ID)

  // declarei as propriedades de formulario que antes eram herdadas
  form: FormGroup
  formErrors: FormReactiveErrors
  validationMessages: FormReactiveMessages

  private static SESSION_STORAGE_REDIRECT_URL_KEY = 'login-previous-url'

  readonly forgotPasswordModal = viewChild<ElementRef>('forgotPasswordModal')
  readonly otpTokenInput = viewChild<InputTextComponent>('otpTokenInput')
  readonly instanceAboutAccordion = viewChild<InstanceAboutAccordionComponent>('instanceAboutAccordion')

  accordion: NgbAccordionDirective
  error: string = null
  forgotPasswordEmail = ''

  isAuthenticatedWithExternalAuth = false
  externalAuthError = false
  externalLogins: string[] = []

  instanceBannerUrl: string

  instanceInformationPanels = {
    terms: true,
    administrators: false,
    features: false,
    moderation: false,
    codeOfConduct: false
  }

  otpStep = false

  private openedForgotPasswordModal: NgbModalRef
  private serverConfig: ServerConfig

  get signupAllowed () {
    return this.serverConfig.signup.allowed === true
  }

  get instanceName () {
    return this.serverConfig.instance.name
  }

  onTermsClick (event: Event, instanceInformation: HTMLElement) {
    event.preventDefault()

    const instanceAboutAccordion = this.instanceAboutAccordion()
    if (instanceAboutAccordion) {
      instanceAboutAccordion.expandTerms()
      instanceInformation.scrollIntoView({ behavior: 'smooth' })
    }
  }

  isEmailDisabled () {
    return this.serverConfig.email.enabled === false
  }

  canUploadByDefault () {
    return this.serverConfig.user.videoQuota !== 0 && this.serverConfig.user.videoQuotaDaily !== 0
  }

  ngOnInit () {
    const snapshot = this.route.snapshot

    // agora uso o serviço injetado pra construir o formulario de login
    const { form, formErrors, validationMessages } = this.formValidatorService.internalBuildForm({
      'username': LOGIN_USERNAME_VALIDATOR,
      'password': LOGIN_PASSWORD_VALIDATOR,
      'otp-token': {
        VALIDATORS: [], 
        MESSAGES: USER_OTP_TOKEN_VALIDATOR.MESSAGES
      }
    })

    this.form = form
    this.formErrors = formErrors
    this.validationMessages = validationMessages

    this.serverConfig = snapshot.data.serverConfig

    if (snapshot.queryParams.externalAuthToken) {
      this.loadExternalAuthToken(snapshot.queryParams.username, snapshot.queryParams.externalAuthToken)
      return
    }

    if (snapshot.queryParams.externalAuthError) {
      this.externalAuthError = true
      return
    }

    const previousUrl = this.redirectService.getPreviousUrl()
    if (previousUrl && previousUrl !== '/') {
      this.storage.setItem(LoginComponent.SESSION_STORAGE_REDIRECT_URL_KEY, previousUrl)
    }
  }

  ngAfterViewInit () {
    this.hooks.runAction('action:login.init', 'login')
  }

  getExternalLogins () {
    return this.serverConfig.plugin.registeredExternalAuths
  }

  hasExternalLogins () {
    return this.getExternalLogins().length !== 0
  }

  getAuthHref (auth: RegisteredExternalAuthConfig) {
    return getExternalAuthHref(environment.apiUrl, auth)
  }

  login () {
    this.error = null

    const options = {
      username: this.form.value['username'],
      password: this.form.value['password'],
      otpToken: this.form.value['otp-token']
    }

    this.authService.login(options)
      .pipe(
        switchMap(() => this.authService.userInformationLoaded),
        switchMap(() => this.updateUserLanguageIfNeeded())
      )
      .subscribe({
        next: () => this.redirectService.redirectToPreviousRoute({ reloadTab: this.shouldReloadTabOnLogin() }),

        error: err => {
          this.handleError(err)
        }
      })
  }

  askResetPassword () {
    this.userService.askResetPassword(this.forgotPasswordEmail)
      .subscribe({
        next: () => {
          const message = $localize`An email with the reset password instructions will be sent to ${this.forgotPasswordEmail}.
The link will expire within 1 hour.`

          this.notifier.success(message)
          this.hideForgotPasswordModal()
        },

        error: err => this.notifier.handleError(err)
      })
  }

  openForgotPasswordModal () {
    this.openedForgotPasswordModal = this.modalService.open(this.forgotPasswordModal())
  }

  hideForgotPasswordModal () {
    this.openedForgotPasswordModal.close()
  }

  onInstanceAboutAccordionInit (instanceAboutAccordion: InstanceAboutAccordionComponent) {
    this.accordion = instanceAboutAccordion.accordion()
  }

  private loadExternalAuthToken (username: string, token: string) {
    this.isAuthenticatedWithExternalAuth = true

    this.authService.login({ username, password: null, token })
      .pipe(
        switchMap(() => this.authService.userInformationLoaded),
        switchMap(() => this.updateUserLanguageIfNeeded())
      )
      .subscribe({
        next: () => {
          const redirectUrl = this.storage.getItem(LoginComponent.SESSION_STORAGE_REDIRECT_URL_KEY)
          if (redirectUrl) {
            this.storage.removeItem(LoginComponent.SESSION_STORAGE_REDIRECT_URL_KEY)
            return this.router.navigateByUrl(redirectUrl)
          }

          this.redirectService.redirectToLatestSessionRoute({ reloadTab: this.shouldReloadTabOnLogin() })
        },

        error: err => {
          this.handleError(err)
          this.isAuthenticatedWithExternalAuth = false
        }
      })
  }

  private handleError (err: any) {
    if (this.authService.isOTPMissingError(err)) {
      this.otpStep = true

      setTimeout(() => {
        this.form.get('otp-token').setValidators(USER_OTP_TOKEN_VALIDATOR.VALIDATORS)
        this.otpTokenInput().focus()
      })

      return
    }

    if (err.message.includes('credentials are invalid')) {
      this.error = $localize`Incorrect username or password.`
      return
    }

    if (err.message.includes('blocked')) {
      this.error = $localize`Your account is blocked.`
      return
    }

    if (err.body?.code === ServerErrorCode.ACCOUNT_WAITING_FOR_APPROVAL) {
      this.error = $localize`This account is awaiting approval by moderators.`
      return
    }

    if (err.body?.code === ServerErrorCode.ACCOUNT_APPROVAL_REJECTED) {
      this.error = $localize`Registration approval has been rejected for this account.`
      return
    }

    this.error = err.message
  }

  private shouldReloadTabOnLogin () {
    const user = this.authService.getUser()

    return user.language && getCompleteLocale(user.language) !== getCompleteLocale(this.localeId)
  }

  private updateUserLanguageIfNeeded () {
    if (this.authService.getUser().language) {
      return this.userService.updateInterfaceLanguage(this.authService.getUser().language)
    }

    return of(true)
  }
}
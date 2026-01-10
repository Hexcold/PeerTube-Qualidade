import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Injectable, Injector, inject } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from '@app/core/auth/auth.service'
import { getBackendUrl } from '@app/helpers'
import {
  HttpStatusCode,
  OAuth2ErrorCode,
  OAuth2ErrorCodeType,
  PeerTubeProblemDocument,
  ServerErrorCode,
  ServerErrorCodeType
} from '@peertube/peertube-models'
import { isSameOrigin } from '@root-helpers/url'
import { Observable, throwError as observableThrowError, of } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private injector = inject(Injector)
  private router = inject(Router)

  private authService: AuthService

  // Refatorado: HttpRequest<any> -> HttpRequest<unknown>
  intercept (req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.authService === undefined) {
      this.authService = this.injector.get(AuthService)
    }

    const authReq = this.cloneRequestWithAuth(req)

    // Pass on the cloned request instead of the original request
    // Catch 401 errors (refresh token expired)
    return next.handle(authReq)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const error = err.error as PeerTubeProblemDocument

          const bypassCodes = new Set<ServerErrorCodeType | OAuth2ErrorCodeType>([
            ServerErrorCode.VIDEO_REQUIRES_PASSWORD,
            ServerErrorCode.INCORRECT_VIDEO_PASSWORD,
            ServerErrorCode.CURRENT_PASSWORD_IS_INVALID
          ])

          if (error?.code && bypassCodes.has(error.code)) {
            return observableThrowError(() => err)
          }

          if (!this.authService.isOTPMissingError(err)) {
            if (err.status === HttpStatusCode.UNAUTHORIZED_401 && error && error.code === OAuth2ErrorCode.INVALID_TOKEN) {
              return this.handleTokenExpired(req, next)
            }

            if (err.status === HttpStatusCode.UNAUTHORIZED_401) {
              return this.handleNotAuthenticated(err)
            }
          }

          return observableThrowError(() => err)
        })
      )
  }

  // Refatorado: HttpRequest<any> -> HttpRequest<unknown>
  private handleTokenExpired (req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.authService.refreshAccessToken()
      .pipe(
        switchMap(() => {
          const authReq = this.cloneRequestWithAuth(req)

          return next.handle(authReq)
        })
      )
  }

  // Refatorado: HttpRequest<any> -> HttpRequest<unknown>
  private cloneRequestWithAuth (req: HttpRequest<unknown>) {
    const authHeaderValue = this.authService.getRequestHeaderValue()

    const sameOrigin = req.url.startsWith('/') || isSameOrigin(getBackendUrl(), req.url)

    if (authHeaderValue === null || !sameOrigin) {
      return req
    }

    // Clone the request to add the new header
    return req.clone({ headers: req.headers.set('Authorization', authHeaderValue) })
  }

  // Refatorado: Observable<any> -> Observable<string> (of(err.message))
  private handleNotAuthenticated (err: HttpErrorResponse): Observable<string> {
    this.router.navigate([ '/401' ], { state: { obj: err }, skipLocationChange: true })
    return of(err.message)
  }
}

export const AUTH_INTERCEPTOR_PROVIDER = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true
}
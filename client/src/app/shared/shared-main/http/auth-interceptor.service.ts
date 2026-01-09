// client/src/app/shared/shared-main/http/auth-interceptor.service.ts

import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http'
import { Injectable, Injector, inject } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from '@app/core/auth/auth.service'
import { getBackendUrl } from '@app/helpers'
import {
  OAuth2ErrorCode,
  OAuth2ErrorCodeType,
  PeerTubeProblemDocument,
  ServerErrorCode,
  ServerErrorCodeType
} from '@peertube/peertube-models'
import { isSameOrigin } from '@root-helpers/url'
import { Observable, throwError } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private injector = inject(Injector)
  private router = inject(Router)
  private authService: AuthService

  private static readonly BYPASS_CODES = new Set<ServerErrorCodeType | OAuth2ErrorCodeType>([
    ServerErrorCode.VIDEO_REQUIRES_PASSWORD,
    ServerErrorCode.INCORRECT_VIDEO_PASSWORD,
    ServerErrorCode.CURRENT_PASSWORD_IS_INVALID
  ])

  // Alterado de any para unknown (mais seguro)
  intercept (req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService)
    }

    const authReq = this.cloneRequestWithAuth(req)

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        const errorBody = err.error as PeerTubeProblemDocument

        if (errorBody?.code && AuthInterceptor.BYPASS_CODES.has(errorBody.code)) {
          return throwError(() => err)
        }

        if (!this.authService.isOTPMissingError(err)) {
          if (err.status === HttpStatusCode.UNAUTHORIZED_401 && errorBody?.code === OAuth2ErrorCode.INVALID_TOKEN) {
            return this.handleTokenExpired(req, next)
          }

          if (err.status === HttpStatusCode.UNAUTHORIZED_401) {
            return this.handleNotAuthenticated(err)
          }
        }

        return throwError(() => err)
      })
    )
  }

  // Tipagem corrigida para evitar any
  private handleTokenExpired (req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.authService.refreshAccessToken().pipe(
      switchMap(() => {
        return next.handle(this.cloneRequestWithAuth(req))
      })
    )
  }

  private cloneRequestWithAuth (req: HttpRequest<unknown>): HttpRequest<unknown> {
    const authHeaderValue = this.authService.getRequestHeaderValue()
    const sameOrigin = req.url.startsWith('/') || isSameOrigin(getBackendUrl(), req.url)

    if (!authHeaderValue || !sameOrigin) {
      return req
    }

    return req.clone({
      headers: req.headers.set('Authorization', authHeaderValue)
    })
  }

  // Observable<never> indica que este método sempre lança um erro (throwError)
  private handleNotAuthenticated (err: HttpErrorResponse): Observable<never> {
    this.router.navigate(['/401'], { state: { obj: err }, skipLocationChange: true })
    return throwError(() => err)
  }
}

export const AUTH_INTERCEPTOR_PROVIDER = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true
}
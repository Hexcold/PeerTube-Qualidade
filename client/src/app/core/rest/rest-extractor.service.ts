import { HttpHeaderResponse, HttpErrorResponse } from '@angular/common/http'
import { Injectable, LOCALE_ID, inject } from '@angular/core'
import { Router } from '@angular/router'
import { DateFormat, dateToHuman } from '@app/helpers'
import { HttpStatusCode, HttpStatusCodeType, ResultList } from '@peertube/peertube-models'
import { PeerTubeHTTPError, PeerTubeReconnectError } from '@root-helpers/errors'
import { throwError as observableThrowError, Observable } from 'rxjs'

// interface definida localmente para remover o any do corpo de erro
interface PeerTubeErrorBody {
  error?: string
  detail?: string
  title?: string
  errors?: {
    [key: string]: {
      msg: string
      value: any
      param: string
      location: string
    }
  }
}

@Injectable()
export class RestExtractor {
  private localeId = inject(LOCALE_ID)
  private router = inject(Router)

  applyToResultListData<T, A, U> (
    result: ResultList<T>,
    fun: (data: T, ...args: A[]) => U,
    additionalArgs: A[] = []
  ): ResultList<U> {
    const data: T[] = result.data

    return {
      total: result.total,
      data: data.map(d => fun.apply(this, [ d, ...additionalArgs ]))
    }
  }

  convertResultListDateToHuman<T> (
    result: ResultList<T>,
    fieldsToConvert: string[] = [ 'createdAt' ],
    format?: DateFormat
  ): ResultList<T> {
    return this.applyToResultListData(result, this.convertDateToHuman.bind(this), [ fieldsToConvert, format ])
  }

  // substituicao do any por um tipo genérico que estende um objeto
  convertDateToHuman<T extends object> (target: T, fieldsToConvert: string[], format?: DateFormat): T {
    fieldsToConvert.forEach(field => {
      const value = (target as any)[field]
      if (!value) return

      (target as any)[field] = dateToHuman(this.localeId, new Date(value), format)
    })

    return target
  }

  redirectTo404IfNotFound (
    obj: { status: HttpStatusCodeType },
    type: 'video' | 'other',
    status: HttpStatusCodeType[] = [ HttpStatusCode.NOT_FOUND_404 ]
  ): Observable<never> {
    if (obj?.status && status.includes(obj.status)) {
      this.router.navigate([ '/404' ], { state: { type, obj }, skipLocationChange: true })
    }

    return observableThrowError(() => obj)
  }

  
  handleError (err: HttpErrorResponse | PeerTubeReconnectError | Error | any) {
    const errorMessage = this.buildErrorMessage(err)


    const errorObj = {
      message: errorMessage,
      status: (err instanceof HttpErrorResponse) ? err.status : undefined,
      body: (err instanceof HttpErrorResponse) ? err.error : undefined,
      headers: (err instanceof HttpErrorResponse) ? err.headers : undefined
    }

    return observableThrowError(() => {
      if (err instanceof PeerTubeReconnectError) {
        return err
      }

      if (err instanceof HttpErrorResponse) {
        return new PeerTubeHTTPError(errorMessage, {
          status: err.status,
          body: errorObj.body,
          headers: errorObj.headers,
          url: err.url || ''
        })
      }

      return err
    })
  }

  private buildErrorMessage (err: HttpErrorResponse | Error | any): string {
    
    if (err instanceof HttpErrorResponse && err.error instanceof Error) {
      return err.error.message
    }
    
    
    if (err instanceof HttpErrorResponse && err.status !== undefined) {
      return this.buildServerErrorMessage(err)
    }

    if (typeof err === 'string') return err
    
    return err.message || err.detail || $localize`Unknown error`
  }

  private buildServerErrorMessage (err: HttpErrorResponse): string {
    const errorBody = err.error as PeerTubeErrorBody

    if (errorBody?.errors) {
      const errors = errorBody.errors
      return Object.keys(errors)
        .map(key => errors[key].msg)
        .join('. ')
    }

    if (err.status === HttpStatusCode.PAYLOAD_TOO_LARGE_413) {
      return $localize`Media is too large for the server. Please contact you administrator if you want to increase the limit size.`
    }

    if (err.status === HttpStatusCode.TOO_MANY_REQUESTS_429) {
      const secondsLeft = err.headers.get('retry-after')

      if (secondsLeft) {
        const minutesLeft = Math.floor(parseInt(secondsLeft, 10) / 60)
        return $localize`Too many attempts, please try again after ${minutesLeft} minutes.`
      }

      return $localize`Too many attempts, please try again later.`
    }

    if (err.status === HttpStatusCode.INTERNAL_SERVER_ERROR_500) {
      return $localize`Server error. Please retry later.`
    }

    if (err.status === HttpStatusCode.BAD_GATEWAY_502) {
      return $localize`Server is unavailable. Please retry later.`
    }

    return errorBody?.error || errorBody?.detail || errorBody?.title || $localize`Unknown server error`
  }
}
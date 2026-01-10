import { AfterViewInit, Directive, ElementRef, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Directive({
  selector: '[myAutofocus]',
  standalone: true
})
export class AutofocusDirective implements AfterViewInit {
  private host = inject(ElementRef)
  // injetei o id da plataforma pra saber onde o codigo ta rodando
  private platformId = inject(PLATFORM_ID)

  ngAfterViewInit () {
    // so tento manipular o dom se eu tiver certeza que estou no navegador
    if (isPlatformBrowser(this.platformId)) {
      const el = this.host.nativeElement as HTMLElement

      // verifiquei se o metodo existe antes de chamar pra evitar erro de runtime
      if (el && typeof el.focus === 'function') {
        el.focus({ preventScroll: true })
      }
    }
  }
}
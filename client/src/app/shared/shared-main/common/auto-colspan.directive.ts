import { AfterViewInit, Directive, ElementRef, Renderer2, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Directive({
  selector: '[myAutoColspan]',
  standalone: true
})
export class AutoColspanDirective implements AfterViewInit {
  private host = inject(ElementRef)
  private renderer = inject(Renderer2)
  // injetei a plataforma pra busca nao quebrar no servidor
  private platformId = inject(PLATFORM_ID)

  ngAfterViewInit () {
    // so executo se estiver no navegador pois preciso do dom real pra contar as colunas
    if (isPlatformBrowser(this.platformId)) {
      const el = this.host.nativeElement as HTMLElement
      
      // uso o closest pra achar a tabela pai mas protejo a execucao
      const table = el.closest('table')
      if (!table) {
        console.warn('table element not found for myAutoColspan')
        return
      }

      // conto os ths da tabela pra saber o tamanho do colspan
      const th = table.querySelectorAll('th')

      if (th.length > 0) {
        this.renderer.setAttribute(el, 'colspan', th.length.toString())
      }
    }
  }
}
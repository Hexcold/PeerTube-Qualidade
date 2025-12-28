import debug from 'debug'
import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  inject,
  output,
  contentChild,
  PLATFORM_ID // adicionei pra checar a plataforma
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

const debugLogger = debug('peertube:main:DeferLoadingDirective')

@Directive({
  selector: '[myDeferLoading]',
  standalone: true
})
export class DeferLoadingDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef)
  private viewContainer = inject(ViewContainerRef)
  private cd = inject(ChangeDetectorRef)
  private platformId = inject(PLATFORM_ID)

  readonly template = contentChild(TemplateRef)
  readonly loaded = output()

  // troquei o any por unknown ja aproveitando a boa pratica
  view: EmbeddedViewRef<unknown>

  private observer: IntersectionObserver

  ngAfterViewInit () {
    // se nao estiver no navegador (tipo no servidor), carrega logo pra nao quebrar
    if (!isPlatformBrowser(this.platformId)) {
      return this.load()
    }

    if (this.hasIncompatibleBrowser()) {
      return this.load()
    }

    this.observer = new IntersectionObserver(entries => {
      const entry = entries[0]
      // acesso ao nativeelement protegido pelo check de plataforma la em cima
      if (!entry.isIntersecting || entry.target !== this.el.nativeElement) return

      this.observer.unobserve(this.el.nativeElement)
      this.load()
    }, { threshold: 0.1 })

    this.observer.observe(this.el.nativeElement)
  }

  load () {
    if (this.isLoaded()) return

    debugLogger('Loading component')

    this.viewContainer.clear()
    const templateRef = this.template()
    if (templateRef) {
      this.view = this.viewContainer.createEmbeddedView(templateRef, {}, 0)
      this.loaded.emit()
      this.cd.detectChanges()
    }
  }

  isLoaded () {
    return this.view != null
  }

  ngOnDestroy () {
    this.view = null

    if (this.observer) this.observer.disconnect()
  }

  private hasIncompatibleBrowser () {
    // evitei acessar window direto sem verificar se ele existe
    return typeof window === 'undefined' || !('IntersectionObserver' in window)
  }
}
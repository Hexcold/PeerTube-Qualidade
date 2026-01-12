import {
  Directive,
  ElementRef,
  AfterViewInit,
  Renderer2,
  inject,
  input
} from '@angular/core'
import { PluginSelectorId } from '@peertube/peertube-models'

@Directive({
  selector: '[myPluginSelector]',
  standalone: true
})
export class PluginSelectorDirective implements AfterViewInit {
  private renderer = inject(Renderer2)
  private host = inject<ElementRef<HTMLElement>>(ElementRef)

  readonly pluginSelectorId = input<PluginSelectorId>(undefined)

  ngAfterViewInit () {
    const pluginSelectorId = this.pluginSelectorId()
    if (!pluginSelectorId) return

    const element = this.host.nativeElement
    const existingId = element.getAttribute('id')

    if (existingId) {
      console.warn(
        `[PluginSelectorDirective] Element already has id="${existingId}". ` +
        `Skipping plugin selector id assignment.`
      )
      return
    }

    this.renderer.setAttribute(
      element,
      'id',
      `plugin-selector-${pluginSelectorId}`
    )
  }
}

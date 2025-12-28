// Thanks: https://github.com/evseevdev/ngx-textarea-autosize
import { AfterViewInit, Directive, ElementRef, HostBinding, HostListener, inject, Renderer2 } from '@angular/core'

@Directive({
  selector: 'textarea[myAutoResize]',
  standalone: true
})
export class TextareaAutoResizeDirective implements AfterViewInit {
  private elem = inject(ElementRef)
  // injetei o renderer pra evitar mexer no .style direto
  private renderer = inject(Renderer2)

  @HostBinding('attr.rows')
  rows = '1'
  @HostBinding('style.overflow')
  overflow = 'hidden'

  public ngAfterViewInit () {
    this.resize()
  }

  @HostListener('input')
  resize () {
    const textarea = this.elem.nativeElement as HTMLTextAreaElement
    
    // usei o renderer pra resetar a altura e depois aplicar o novo valor
    // isso e mais seguro que mexer no objeto style diretamente
    this.renderer.setStyle(textarea, 'height', 'auto')
    this.renderer.setStyle(textarea, 'height', `${textarea.scrollHeight}px`)
  }
}
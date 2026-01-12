import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  inject,
  input
} from '@angular/core'

@Component({
  selector: 'my-custom-icon',
  template: '',
  styleUrls: [ './common-icon.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class CustomIconComponent implements AfterViewInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef)
  private renderer = inject(Renderer2)

  readonly html = input.required<string>()

  ngAfterViewInit () {
    const element = this.host.nativeElement

    this.renderer.setProperty(element, 'innerHTML', '')
    this.renderer.setProperty(element, 'innerHTML', this.html())
    this.renderer.setAttribute(element, 'aria-hidden', 'true')
  }
}

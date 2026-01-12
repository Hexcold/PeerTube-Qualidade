import {
  Directive,
  ElementRef,
  Renderer2,
  inject,
  input,
  output,
  OnInit,
  OnDestroy,
  AfterViewInit,
  booleanAttribute
} from '@angular/core'
import { fromEvent, Observable, Subscription } from 'rxjs'
import { filter, map, throttleTime, distinctUntilChanged, startWith } from 'rxjs/operators'

@Directive({
  selector: '[myInfiniteScroller]',
  standalone: true
})
export class InfiniteScrollerDirective implements OnInit, AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>)
  private renderer = inject(Renderer2)

  readonly percentLimit = input(70)
  readonly onItself = input(false, { transform: booleanAttribute })
  readonly dataObservable = input<Observable<any[]>>(undefined)

  readonly nearOfBottom = output()

  private container!: HTMLElement
  private scrollTarget!: HTMLElement | Window
  private scrollSub?: Subscription
  private dataSub?: Subscription

  private lastScrollTop = 0
  private decimalLimit = 0

  ngOnInit () {
    this.decimalLimit = this.percentLimit() / 100
  }

  ngAfterViewInit () {
    this.resolveScrollContainer()
    this.listenScroll()
    this.listenDataChanges()
    this.checkInitialScroll()
  }

  ngOnDestroy () {
    this.scrollSub?.unsubscribe()
    this.dataSub?.unsubscribe()
  }


  private resolveScrollContainer () {
    if (this.onItself()) {
      this.container = this.el.nativeElement
      this.scrollTarget = this.container
    } else {
      this.container = document.scrollingElement as HTMLElement
      this.scrollTarget = window
    }
  }

  private listenScroll () {
    this.scrollSub = fromEvent(this.scrollTarget, 'scroll')
      .pipe(
        startWith(null),
        throttleTime(150, undefined, { leading: true, trailing: true }),
        map(() => this.getScrollInfo()),
        distinctUntilChanged((a, b) => a.current === b.current),
        filter(info => this.isScrollingDown(info.current)),
        filter(info => info.maximum > 0 && (info.current / info.maximum) >= this.decimalLimit)
      )
      .subscribe(() => {
        this.nearOfBottom.emit()
      })
  }

  private listenDataChanges () {
    const data$ = this.dataObservable()
    if (!data$) return

    this.dataSub = data$
      .pipe(filter(d => d.length > 0))
      .subscribe(() => {
        this.checkIfNoScroll()
      })
  }


  private getScrollInfo () {
    const current = this.onItself()
      ? this.container.scrollTop
      : window.scrollY

    const maximum = this.getMaximumScroll()

    return { current, maximum }
  }

  private getMaximumScroll () {
    const height = this.onItself()
      ? this.container.clientHeight
      : window.innerHeight

    return this.container.scrollHeight - height
  }

  private isScrollingDown (current: number) {
    const down = current > this.lastScrollTop
    this.lastScrollTop = current
    return down
  }

  private checkIfNoScroll () {
    if (this.getMaximumScroll() <= 0) {
      this.nearOfBottom.emit()
    }
  }

  private checkInitialScroll () {
    this.checkIfNoScroll()
  }
}

import { NgClass, NgTemplateOutlet, SlicePipe } from '@angular/common'
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  inject,
  input,
  viewChild,
  viewChildren,
  Renderer2,
  NgZone
} from '@angular/core'
import { ScreenService } from '@app/core'
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { randomInt } from '@peertube/peertube-core-utils'
import debug from 'debug'
import { lowerFirst, uniqueId } from 'lodash-es'
import { Subject, takeUntil } from 'rxjs'

const debugLogger = debug('peertube:main:ListOverflowItem')

export interface ListOverflowItem {
  label: string
  routerLink: string | any[]
  isDisplayed?: () => boolean
}

@Component({
  selector: 'my-list-overflow',
  templateUrl: './list-overflow.component.html',
  styleUrls: [ './list-overflow.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    NgbDropdown,
    NgbDropdownToggle,
    NgClass,
    NgbDropdownMenu,
    SlicePipe
  ]
})
export class ListOverflowComponent<T extends ListOverflowItem>
  implements OnInit, AfterViewInit, OnDestroy {

  private cdr = inject(ChangeDetectorRef)
  private modalService = inject(NgbModal)
  private screenService = inject(ScreenService)
  private renderer = inject(Renderer2)
  private zone = inject(NgZone)

  private destroy$ = new Subject<void>()
  private removeResizeListener?: () => void
  private randomInt: number

  readonly items = input<T[]>(undefined)
  readonly itemTemplate = input<TemplateRef<{ item: T; dropdown?: boolean; modal?: boolean }>>(undefined)
  readonly hasBorder = input(false, { transform: booleanAttribute })

  readonly modal = viewChild<ElementRef>('modal')
  readonly parent = viewChild<ElementRef<HTMLDivElement>>('itemsParent')
  readonly itemsRendered = viewChildren<ElementRef>('itemsRendered')

  showItemsUntilIndexExcluded: number
  isInMobileView = false
  initialized = false

  ngOnInit () {
    this.randomInt = randomInt(1, 2000)
  }

  ngAfterViewInit () {
    this.zone.onStable
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculate()
        this.initialized = true
      })

    this.zone.runOutsideAngular(() => {
      this.removeResizeListener = this.renderer.listen(
        'window',
        'resize',
        () => this.zone.run(() => this.recalculate())
      )
    })
  }

  ngOnDestroy () {
    this.destroy$.next()
    this.destroy$.complete()
    this.removeResizeListener?.()
  }

  isMenuDisplayed () {
    return this.showItemsUntilIndexExcluded !== undefined
  }

  private recalculate () {
    if (!this.parent() || this.itemsRendered().length === 0) return

    this.isInMobileView = !!this.screenService.isInMobileView()

    const parentWidth = this.parent().nativeElement.getBoundingClientRect().width
    let accWidth = 0
    let cutoffIndex: number = undefined

    for (const [ index, el ] of this.itemsRendered().entries()) {
      accWidth += el.nativeElement.getBoundingClientRect().width
      if (cutoffIndex === undefined && accWidth > parentWidth) {
        cutoffIndex = index
      }
    }

    debugLogger('Parent %d | Acc %d | Cut %d', parentWidth, accWidth, cutoffIndex)

    this.showItemsUntilIndexExcluded = cutoffIndex
    this.cdr.markForCheck()
  }

  toggleModal () {
    this.modalService.open(this.modal(), { centered: true })
  }

  getId (id: number | string = uniqueId()): string {
    return lowerFirst(this.constructor.name) + '_' + this.randomInt + '_' + id
  }
}

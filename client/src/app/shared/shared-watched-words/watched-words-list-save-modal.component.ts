import { NgClass } from '@angular/common'
import { Component, ElementRef, OnInit, inject, input, output, viewChild } from '@angular/core'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'
import { Notifier } from '@app/core'
import { WatchedWordsList } from '@peertube/peertube-models'
import { splitAndGetNotEmpty } from '@root-helpers/string'
import {
  UNIQUE_WATCHED_WORDS_VALIDATOR,
  WATCHED_WORDS_LIST_NAME_VALIDATOR
} from '../form-validators/watched-words-list-validators'
import { GlobalIconComponent } from '../shared-icons/global-icon.component'
import { WatchedWordsListService } from './watched-words-list.service'

@Component({
  selector: 'my-watched-words-list-save-modal',
  styleUrls: [ './watched-words-list-save-modal.component.scss' ],
  templateUrl: './watched-words-list-save-modal.component.html',
  imports: [ FormsModule, ReactiveFormsModule, GlobalIconComponent, NgClass ]
})
export class WatchedWordsListSaveModalComponent implements OnInit {
  private fb = inject(FormBuilder)
  private modalService = inject(NgbModal)
  private notifier = inject(Notifier)
  private watchedWordsService = inject(WatchedWordsListService)

  readonly accountName = input.required<string>()
  readonly listAddedOrUpdated = output()

  readonly modal = viewChild<ElementRef>('modal')

  form!: FormGroup

  private openedModal!: NgbModalRef
  private listToUpdate?: WatchedWordsList

  ngOnInit () {
    this.form = this.fb.group({
      listName: [ '', WATCHED_WORDS_LIST_NAME_VALIDATOR ],
      words: [ '', UNIQUE_WATCHED_WORDS_VALIDATOR ]
    })
  }

  show (list?: WatchedWordsList) {
    this.listToUpdate = list

    this.openedModal = this.modalService.open(this.modal(), {
      centered: true,
      keyboard: false
    })

    if (list) {
      this.form.patchValue({
        listName: list.listName,
        words: list.words.join('\n')
      })
    }
  }

  hide () {
    this.openedModal.close()
    this.form.reset()
    this.listToUpdate = undefined
  }

  addOrUpdate () {
    if (this.form.invalid) return

    const params = {
      accountName: this.accountName(),
      listName: this.form.value.listName,
      words: splitAndGetNotEmpty(this.form.value.words)
    }

    const request$ = this.listToUpdate
      ? this.watchedWordsService.updateList({
          ...params,
          listId: this.listToUpdate.id
        })
      : this.watchedWordsService.addList(params)

    request$.subscribe({
      next: () => {
        const message = this.listToUpdate
          ? $localize`${params.listName} updated`
          : $localize`${params.listName} created`

        this.notifier.success(message)
        this.listAddedOrUpdated.emit()
      },
      error: err => this.notifier.handleError(err)
    })

    this.hide()
  }
}

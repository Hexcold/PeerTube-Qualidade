import { DestroyRef, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AuthService, ComponentPagination, User } from '@app/core'
import { immutableAssign } from '@app/helpers'
import { UserHistoryService } from '@app/shared/shared-main/users/user-history.service'
import { Video } from '@app/shared/shared-main/video/video.model'
import { tap } from 'rxjs/operators'

export class MyHistoryViewModel {
  private readonly auth = inject(AuthService)
  private readonly historyService = inject(UserHistoryService)
  private readonly destroyRef = inject(DestroyRef)

  readonly titlePage = $localize`My watch history`

  pagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: null
  }

  user: User
  videosHistoryEnabled = false
  search = ''

  videos: Video[] = []

  constructor () {
    this.user = this.auth.getUser()

    this.auth.userInformationLoaded
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.videosHistoryEnabled = this.user.videosHistoryEnabled
      })
  }

  setSearch (search: string) {
    this.search = search
  }

  getVideos (page: number) {
    const pagination = immutableAssign(this.pagination, { currentPage: page })

    return this.historyService
      .list(pagination, this.search)
      .pipe(
        tap(res => this.pagination.totalItems = res.total)
      )
  }

  getNoResultMessage () {
    if (this.search) {
      return $localize`No videos found for "${this.search}".`
    }

    return $localize`You don't have any video in your watch history yet.`
  }
}

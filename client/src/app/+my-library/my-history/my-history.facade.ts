import { inject } from '@angular/core'
import {
  AuthService,
  ConfirmService,
  Notifier,
  updatePaginationOnDelete,
  UserService
} from '@app/core'
import { UserHistoryService } from '@app/shared/shared-main/users/user-history.service'
import { Video } from '@app/shared/shared-main/video/video.model'

export class MyHistoryFacade {
  private readonly historyService = inject(UserHistoryService)
  private readonly userService = inject(UserService)
  private readonly auth = inject(AuthService)
  private readonly notifier = inject(Notifier)
  private readonly confirm = inject(ConfirmService)

  toggleHistory (enabled: boolean) {
    this.userService.updateMyProfile({ videosHistoryEnabled: enabled })
      .subscribe({
        next: () => {
          this.notifier.success(
            enabled
              ? $localize`Video history is enabled`
              : $localize`Video history is disabled`
          )
          this.auth.refreshUserInformation()
        },
        error: err => this.notifier.handleError(err)
      })
  }

  deleteVideo (video: Video, onSuccess: () => void) {
    this.historyService.deleteElement(video)
      .subscribe({
        next: () => {
          updatePaginationOnDelete((video as any).pagination)
          onSuccess()
        },
        error: err => this.notifier.handleError(err)
      })
  }

  async clearAll (onSuccess: () => void) {
    const confirmed = await this.confirm.confirm(
      $localize`Are you sure you want to delete all your video history?`,
      $localize`Delete video history`
    )

    if (!confirmed) return

    this.historyService.clearAll()
      .subscribe({
        next: () => {
          this.notifier.success($localize`Video history deleted`)
          onSuccess()
        },
        error: err => this.notifier.handleError(err)
      })
  }
}

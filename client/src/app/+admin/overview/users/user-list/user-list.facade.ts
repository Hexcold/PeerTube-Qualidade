import { inject, Injectable } from '@angular/core'
import { ConfirmService, Notifier, PluginService } from '@app/core'
import { UserAdminService } from '@app/shared/shared-users/user-admin.service'
import { formatICU } from '@app/helpers'
import { User } from './user-list.types'

@Injectable()
export class UserListFacade {
  private notifier = inject(Notifier)
  private confirmService = inject(ConfirmService)
  private userAdminService = inject(UserAdminService)
  private pluginService = inject(PluginService)

  registerReloadAction (reload: () => void) {
    this.pluginService.addAction('admin-users-list:load-data', reload)
  }

  unregisterReloadAction () {
    this.pluginService.removeAction('admin-users-list:load-data')
  }

  async confirmAndRemoveUsers (users: User, reload: () => void) {
    if (users.some(u => u.username === 'root')) {
      this.notifier.error($localize`You cannot delete root.`)
      return
    }

    const res = await this.confirmService.confirm(
      $localize`Do you really want to delete these users?`,
      $localize`Delete`
    )

    if (!res) return

    this.userAdminService.removeUsers(users).subscribe({
      next: () => {
        this.notifier.success(
          formatICU(
            $localize`{count, plural, =1 {1 user deleted.} other {{count} users deleted.}}`,
            { count: users.length }
          )
        )
        reload()
      },
      error: err => this.notifier.handleError(err)
    })
  }
}

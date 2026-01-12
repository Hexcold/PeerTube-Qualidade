import { inject, Injectable } from '@angular/core'
import { map, switchMap } from 'rxjs'
import { BlocklistService } from '@app/shared/shared-moderation/blocklist.service'
import { UserAdminService } from '@app/shared/shared-users/user-admin.service'
import { getBackendHost } from '@app/helpers'
import { Actor } from '@app/shared/shared-main/account/actor.model'

@Injectable()
export class UserListDataSource {
  private userAdminService = inject(UserAdminService)
  private blocklist = inject(BlocklistService)

  load (options) {
    return this.userAdminService.listUsers(options).pipe(
      switchMap(result =>
        this.blocklist
          .getStatus({
            accounts: result.data.map(u => `${u.username}@${getBackendHost()}`)
          })
          .pipe(map(blockStatus => ({ result, blockStatus })))
      ),
      map(({ result, blockStatus }) => ({
        total: result.total,
        data: result.data.map(u => ({
          ...u,
          accountMutedStatus: {
            ...u.account,
            nameWithHost: Actor.CREATE_BY_STRING(u.account.name, u.account.host),
            mutedByInstance: blockStatus.accounts[`${u.username}@${getBackendHost()}`].blockedByServer,
            mutedByUser: false,
            mutedServerByInstance: false,
            mutedServerByUser: false
          }
        }))
      }))
    )
  }
}

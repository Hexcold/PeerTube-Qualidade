import { Injectable, inject } from '@angular/core'
import { ConfirmService, Notifier } from '@app/core'
import { PluginApiService } from '@app/shared/shared-admin/plugin-api.service'
import { PeerTubePlugin } from '@peertube/peertube-models'

@Injectable()
export class PluginListFacade {
  private readonly api = inject(PluginApiService)
  private readonly confirm = inject(ConfirmService)
  private readonly notifier = inject(Notifier)

  async uninstall (plugin: PeerTubePlugin) {
    const ok = await this.confirm.confirm(
      $localize`Do you really want to uninstall ${plugin.name}?`,
      $localize`Uninstall`
    )
    if (!ok) return

    this.api.uninstall(plugin.name, plugin.type).subscribe({
      next: () => this.notifier.success(
        $localize`${plugin.name} uninstalled.`
      ),
      error: err => this.notifier.handleError(err)
    })
  }

  update (plugin: PeerTubePlugin) {
    this.api.update(plugin.name, plugin.type).subscribe({
      next: () => this.notifier.success(
        $localize`${plugin.name} updated.`
      ),
      error: err => this.notifier.handleError(err)
    })
  }
}

import { inject } from '@angular/core'
import { ConfirmService, Notifier } from '@app/core'
import { PluginApiService } from '@app/shared/shared-admin/plugin-api.service'
import { PeerTubePluginIndex } from '@peertube/peertube-models'

export class PluginSearchFacade {
  private readonly confirm = inject(ConfirmService)
  private readonly notifier = inject(Notifier)
  private readonly api = inject(PluginApiService)

  private installing: Record<string, boolean> = {}

  isInstalling (plugin: PeerTubePluginIndex) {
    return !!this.installing[plugin.npmName]
  }

  async install (plugin: PeerTubePluginIndex) {
    if (this.installing[plugin.npmName]) return

    const confirmed = await this.confirm.confirm(
      $localize`Please only install plugins or themes you trust, since they can execute any code on your platform.`,
      $localize`Install ${plugin.name}?`
    )

    if (!confirmed) return

    this.installing[plugin.npmName] = true

    this.api.install(plugin.npmName).subscribe({
      next: () => {
        this.installing[plugin.npmName] = false
        plugin.installed = true
        this.notifier.success($localize`${plugin.name} installed.`)
      },
      error: err => {
        this.installing[plugin.npmName] = false
        this.notifier.handleError(err)
      }
    })
  }
}

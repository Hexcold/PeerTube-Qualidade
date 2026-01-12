import { Component, inject } from '@angular/core'
import { PeerTubePlugin, PluginType_Type } from '@peertube/peertube-models'

import { PluginListFacade } from './plugin-list.facade'
import { PluginListViewModel } from './plugin-list.viewmodel'

@Component({
  selector: 'my-plugin-list-installed',
  templateUrl: './plugin-list-installed.container.html',
  providers: [ PluginListFacade, PluginListViewModel ]
})
export class PluginListInstalledContainer {
  private readonly facade = inject(PluginListFacade)
  private readonly vm = inject(PluginListViewModel)

  // 🔒 contratos explícitos para o template
  readonly plugins$ = this.vm.plugins$
  readonly pagination = this.vm.pagination
  readonly pluginType = this.vm.pluginType

  loadMore () {
    this.vm.loadMore()
  }

  update (plugin: PeerTubePlugin) {
    this.facade.update(plugin)
  }

  uninstall (plugin: PeerTubePlugin) {
    this.facade.uninstall(plugin)
  }

  onPluginTypeChange (type: PluginType_Type) {
    this.vm.setPluginType(type)
  }
}

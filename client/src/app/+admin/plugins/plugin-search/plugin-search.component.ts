import { Component, inject } from '@angular/core'
import { PluginSearchViewModel } from './plugin-search.viewmodel'
import { PluginSearchFacade } from './plugin-search.facade'
import { PeerTubePluginIndex } from '@peertube/peertube-models'

@Component({
  selector: 'my-plugin-search',
  templateUrl: './plugin-search.component.html',
  styleUrls: [ './plugin-search.component.scss' ],
  providers: [ PluginSearchViewModel, PluginSearchFacade ]
})
export class PluginSearchComponent {
  private readonly vm = inject(PluginSearchViewModel)
  private readonly facade = inject(PluginSearchFacade)

  readonly plugins = this.vm.plugins
  readonly pagination = this.vm.pagination
  readonly isSearching = this.vm.isSearching
  readonly pluginType = this.vm.pluginType
  readonly onDataSubject = this.vm.onDataSubject

  onSearchChange (event: Event) {
    const value = (event.target as HTMLInputElement).value
    this.vm.setSearch(value)
  }

  onNearOfBottom () {
    this.vm.loadMore()
  }

  install (plugin: PeerTubePluginIndex) {
    this.facade.install(plugin)
  }

  isInstalling (plugin: PeerTubePluginIndex) {
    return this.facade.isInstalling(plugin)
  }

  isThemeSearch () {
    return this.vm.isThemeSearch()
  }

  getShowRouterLink (plugin: PeerTubePluginIndex) {
    return this.vm.getShowRouterLink(plugin)
  }
}

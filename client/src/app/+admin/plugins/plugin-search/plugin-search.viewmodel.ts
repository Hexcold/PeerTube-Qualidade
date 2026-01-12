import { inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import {
  ComponentPagination,
  hasMoreItems,
  resetCurrentPage,
  PluginService
} from '@app/core'
import { PluginApiService } from '@app/shared/shared-admin/plugin-api.service'
import { PeerTubePluginIndex, PluginType, PluginType_Type } from '@peertube/peertube-models'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'

export class PluginSearchViewModel {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly api = inject(PluginApiService)
  private readonly pluginService = inject(PluginService)

  readonly onDataSubject = new Subject<PeerTubePluginIndex[]>()
  private readonly searchSubject = new Subject<string>()

  pluginType!: PluginType_Type
  search = ''
  sort = '-trending'
  isSearching = false

  plugins: PeerTubePluginIndex[] = []

  pagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: null
  }

  constructor () {
    this.initFromRoute()
    this.initSearchListener()
  }

  private initFromRoute () {
    const type = this.route.snapshot.queryParams['pluginType']

    if (!type) {
      this.router.navigate([], {
        queryParams: { pluginType: PluginType.PLUGIN },
        replaceUrl: true
      })
      return
    }

    this.pluginType = Number(type) as PluginType_Type
    this.search = this.route.snapshot.queryParams['search'] ?? ''

    this.reload()
  }

  private initSearchListener () {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(search => {
        this.router.navigate([], {
          queryParams: { search },
          queryParamsHandling: 'merge'
        })
        this.search = search
        this.reload()
      })
  }

  setSearch (value: string) {
    this.searchSubject.next(value)
  }

  reload () {
    resetCurrentPage(this.pagination)
    this.plugins = []
    this.loadMore()
  }

  loadMore () {
    if (!hasMoreItems(this.pagination) && this.pagination.currentPage !== 1) return

    this.isSearching = true

    this.api
      .searchAvailablePlugins(
        this.pluginType,
        this.pagination,
        this.sort,
        this.search
      )
      .subscribe({
        next: res => {
          this.isSearching = false
          this.plugins = [ ...this.plugins, ...res.data ]
          this.pagination.totalItems = res.total
          this.onDataSubject.next(res.data)
        },
        error: () => {
          this.isSearching = false
        }
      })
  }

  isThemeSearch () {
    return this.pluginType === PluginType.THEME
  }

  getShowRouterLink (plugin: PeerTubePluginIndex) {
    return [
      '/admin',
      'settings',
      'plugins',
      'show',
      this.pluginService.nameToNpmName(plugin.name, this.pluginType)
    ]
  }
}

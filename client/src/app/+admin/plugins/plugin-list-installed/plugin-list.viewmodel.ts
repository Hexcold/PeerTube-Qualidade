import { Injectable, inject } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { ComponentPagination, hasMoreItems, resetCurrentPage } from '@app/core'
import { PluginApiService } from '@app/shared/shared-admin/plugin-api.service'
import { PeerTubePlugin, PluginType_Type } from '@peertube/peertube-models'

@Injectable()
export class PluginListViewModel {
  private readonly api = inject(PluginApiService)

  private readonly pluginsSubject = new BehaviorSubject<PeerTubePlugin[]>([])
  readonly plugins$ = this.pluginsSubject.asObservable()

  pagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: null
  }

  pluginType!: PluginType_Type

  setPluginType (type: PluginType_Type) {
    this.pluginType = type
    resetCurrentPage(this.pagination)
    this.pluginsSubject.next([])
    this.loadMore()
  }

  loadMore () {
    if (!hasMoreItems(this.pagination)) return

    this.api.getPlugins(this.pluginType, this.pagination, 'name')
      .subscribe(res => {
        this.pluginsSubject.next([
          ...this.pluginsSubject.value,
          ...res.data
        ])

        this.pagination.totalItems = res.total
        this.pagination.currentPage++
      })
  }
}

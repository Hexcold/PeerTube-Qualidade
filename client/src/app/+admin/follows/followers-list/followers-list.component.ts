import { Component, OnInit, inject, viewChild } from '@angular/core'
import { Notifier } from '@app/core' // removi o confirmService daqui, agora o service cuida disso
import { InstanceFollowService } from '@app/shared/shared-instance/instance-follow.service'
import { PTDatePipe } from '@app/shared/shared-main/common/date.pipe'
import { DataLoaderOptions, TableColumnInfo, TableComponent } from '@app/shared/shared-tables/table.component'
import { ActorFollow } from '@peertube/peertube-models'
import { AdvancedInputFilter, AdvancedInputFilterComponent } from '../../../shared/shared-forms/advanced-input-filter.component'
import { GlobalIconComponent } from '../../../shared/shared-icons/global-icon.component'
import { DropdownAction } from '../../../shared/shared-main/buttons/action-dropdown.component'
import { ButtonComponent } from '../../../shared/shared-main/buttons/button.component'
import { DeleteButtonComponent } from '../../../shared/shared-main/buttons/delete-button.component'
import { NumberFormatterPipe } from '../../../shared/shared-main/common/number-formatter.pipe'

@Component({
  selector: 'my-followers-list',
  templateUrl: './followers-list.component.html',
  styleUrls: [ './followers-list.component.scss' ],
  imports: [
    GlobalIconComponent,
    AdvancedInputFilterComponent,
    ButtonComponent,
    DeleteButtonComponent,
    PTDatePipe,
    NumberFormatterPipe,
    TableComponent
  ]
})
export class FollowersListComponent implements OnInit {
  private notifier = inject(Notifier)
  private followService = inject(InstanceFollowService)

  readonly table = viewChild<TableComponent<ActorFollow>>('table')

  searchFilters: AdvancedInputFilter[] = []
  bulkActions: DropdownAction<ActorFollow[]>[] = []

  // as colunas sao configuracao de ui, entao ficam aqui
  columns: TableColumnInfo<string>[] = [
    { id: 'follower', label: $localize`Follower`, sortable: false },
    { id: 'state', label: $localize`State`, sortable: true },
    { id: 'score', label: $localize`Reliability`, sortable: true },
    { id: 'createdAt', label: $localize`Created`, sortable: true }
  ]

  dataLoader: typeof this._dataLoader

  constructor () {
    this.dataLoader = this._dataLoader.bind(this)
  }

  ngOnInit () {
    this.searchFilters = this.followService.buildFollowsListFilters()
    this.buildBulkActions()
  }

  // agrupei a definicao das acoes pra nao poluir o ngoninit
  private buildBulkActions () {
    this.bulkActions = [
      {
        label: $localize`Reject`,
        handler: follows => this.handleAction(this.followService.rejectFollowerWithConfirmation(follows)),
        isDisplayed: follows => follows.every(f => f.state !== 'rejected')
      },
      {
        label: $localize`Accept`,
        handler: follows => this.handleAction(this.followService.acceptFollower(follows)),
        isDisplayed: follows => follows.every(f => f.state !== 'accepted')
      },
      {
        label: $localize`Delete`,
        handler: follows => this.handleAction(this.followService.removeFollowerWithConfirmation(follows)),
        isDisplayed: follows => follows.every(f => f.state === 'rejected')
      }
    ]
  }

  // criei um handler generico pra reduzir a repeticao de codigo de sucesso/erro
  private handleAction (observable: any) {
    observable.subscribe({
      next: () => this.table().loadData(),
      error: (err: any) => this.notifier.handleError(err)
    })
  }

  private _dataLoader (options: DataLoaderOptions) {
    const { pagination, sort, search } = options
    return this.followService.getFollowers({ pagination, sort, search })
  }
}
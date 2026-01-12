@Component({
  selector: 'my-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.scss' ],
  providers: [ UserListFacade, UserListDataSource ]
})
export class UserListComponent implements OnInit, OnDestroy {
  private facade = inject(UserListFacade)
  private dataSource = inject(UserListDataSource)

  readonly table = viewChild<TableComponent<User, ColumnName>>('table')

  dataLoader = options => this.dataSource.load(options)

  ngOnInit () {
    this.facade.registerReloadAction(() => this.table().loadData())
  }

  ngOnDestroy () {
    this.facade.unregisterReloadAction()
  }

  removeUsers (users: User[]) {
    this.facade.confirmAndRemoveUsers(users, () => this.table().loadData())
  }
}

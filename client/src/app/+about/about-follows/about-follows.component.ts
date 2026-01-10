import { DecimalPipe } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ComponentPagination, hasMoreItems, Notifier, RestService, ServerService } from '@app/core'
import { ActorAvatarComponent } from '@app/shared/shared-actor-image/actor-avatar.component'
import { GlobalIconComponent } from '@app/shared/shared-icons/global-icon.component'
import { InstanceFollowService } from '@app/shared/shared-instance/instance-follow.service'
import { ButtonComponent } from '@app/shared/shared-main/buttons/button.component'
import { PluginSelectorDirective } from '@app/shared/shared-main/plugins/plugin-selector.directive'
import { Actor, ServerStats } from '@peertube/peertube-models'
import { SortMeta } from 'primeng/api'
import { FollowerImageComponent } from './follower-image.component'
import { SubscriptionImageComponent } from './subscription-image.component'

@Component({
  selector: 'my-about-follows',
  templateUrl: './about-follows.component.html',
  styleUrls: [ './about-follows.component.scss' ],
  imports: [
    ActorAvatarComponent,
    ButtonComponent,
    PluginSelectorDirective,
    GlobalIconComponent,
    DecimalPipe,
    RouterLink,
    SubscriptionImageComponent,
    FollowerImageComponent
  ]
})
export class AboutFollowsComponent implements OnInit {
  private server = inject(ServerService)
  private restService = inject(RestService)
  private notifier = inject(Notifier)
  private followService = inject(InstanceFollowService)

  instanceName: string
  followers: Actor[] = []
  subscriptions: Actor[] = []
  serverStats: ServerStats

  // centralizei o estado das listas pra diminuir o numero de variaveis soltas
  followersPagination: ComponentPagination = { currentPage: 1, itemsPerPage: 20, totalItems: 0 }
  subscriptionsPagination: ComponentPagination = { currentPage: 1, itemsPerPage: 20, totalItems: 0 }

  private loadingFollowers = false
  private loadingSubscriptions = false

  private sort: SortMeta = { field: 'createdAt', order: -1 }

  ngOnInit () {
    this.loadMoreFollowers(true)
    this.loadMoreSubscriptions(true)
    this.instanceName = this.server.getHTMLConfig().instance.name
    this.server.getServerStats().subscribe(stats => this.serverStats = stats)
  }

  // logica de dominio que poderia estar num helper mas deixei simples
  buildLink (host: string) {
    return `${window.location.protocol}//${host}`
  }

  canLoadMoreFollowers () {
    return hasMoreItems(this.followersPagination)
  }

  canLoadMoreSubscriptions () {
    return hasMoreItems(this.subscriptionsPagination)
  }

  loadMoreFollowers (reset = false) {
    if (this.loadingFollowers) return
    this.loadingFollowers = true

    this.followersPagination.currentPage = reset ? 1 : this.followersPagination.currentPage + 1
    const pagination = this.restService.componentToRestPagination(this.followersPagination)

    // deleguei a busca e a formatação pro service especializado
    this.followService.getFollowersFormatted({ pagination, sort: this.sort, state: 'accepted' })
      .subscribe({
        next: result => {
          this.followers = reset ? result.data : this.followers.concat(result.data)
          this.followersPagination.totalItems = result.total
        },
        error: err => this.notifier.handleError(err),
        complete: () => this.loadingFollowers = false
      })
  }

  loadMoreSubscriptions (reset = false) {
    if (this.loadingSubscriptions) return
    this.loadingSubscriptions = true

    this.subscriptionsPagination.currentPage = reset ? 1 : this.subscriptionsPagination.currentPage + 1
    const pagination = this.restService.componentToRestPagination(this.subscriptionsPagination)

    // movi a regra de negocio de formatacao de nome la pro followService
    this.followService.getFollowingFormatted({ pagination, sort: this.sort, state: 'accepted' })
      .subscribe({
        next: result => {
          this.subscriptions = reset ? result.data : this.subscriptions.concat(result.data)
          this.subscriptionsPagination.totalItems = result.total
        },
        error: err => this.notifier.handleError(err),
        complete: () => this.loadingSubscriptions = false
      })
  }
}
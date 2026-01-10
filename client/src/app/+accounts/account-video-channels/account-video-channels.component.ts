import { Component, inject, OnDestroy, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ComponentPagination, hasMoreItems, MarkdownService, User, UserService } from '@app/core'
import { SimpleMemoize } from '@app/helpers'
import { NSFWPolicyType, VideoSortField } from '@peertube/peertube-models'
import { Subject, Subscription } from 'rxjs'
import { ActorAvatarComponent } from '../../shared/shared-actor-image/actor-avatar.component'
import { InfiniteScrollerDirective } from '../../shared/shared-main/common/infinite-scroller.directive'
import { SubscribeButtonComponent } from '../../shared/shared-user-subscription/subscribe-button.component'
import { MiniatureDisplayOptions, VideoMiniatureComponent } from '../../shared/shared-video-miniature/video-miniature.component'
import { Account } from '@app/shared/shared-main/account/account.model'
import { AccountService } from '@app/shared/shared-main/account/account.service'
import { VideoChannel } from '@app/shared/shared-main/channel/video-channel.model'
import { VideoChannelService } from '@app/shared/shared-main/channel/video-channel.service'
import { Video } from '@app/shared/shared-main/video/video.model'
import { VideoService } from '@app/shared/shared-main/video/video.service'

@Component({
  selector: 'my-account-video-channels',
  templateUrl: './account-video-channels.component.html',
  styleUrls: [ './account-video-channels.component.scss' ],
  imports: [ InfiniteScrollerDirective, ActorAvatarComponent, RouterLink, SubscribeButtonComponent, VideoMiniatureComponent ]
})
export class AccountVideoChannelsComponent implements OnInit, OnDestroy {
  private accountService = inject(AccountService)
  // injetei o serviço que agora vai cuidar da logica de busca pesada
  private videoChannelService = inject(VideoChannelService)
  private videoService = inject(VideoService)
  private markdown = inject(MarkdownService)
  private userService = inject(UserService)

  account: Account
  videoChannels: VideoChannel[] = []
  videos: { [id: number]: { total: number, videos: Video[] } } = {}
  channelsDescriptionHTML: { [id: number]: string } = {}

  // a logica de paginação continua aqui mas a orquestração foi pro serviço
  channelPagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 2,
    totalItems: null
  }

  videosPagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: null
  }
  videosSort: VideoSortField = '-publishedAt'

  // troquei o any por unknown pra seguir a limpeza anterior
  onChannelDataSubject = new Subject<unknown[]>()

  userMiniature: User
  nsfwPolicy: NSFWPolicyType
  miniatureDisplayOptions: MiniatureDisplayOptions = {
    date: true,
    views: true,
    by: false,
    avatar: false,
    privacyLabel: false
  }

  private accountSub: Subscription

  ngOnInit () {
    this.accountSub = this.accountService.accountLoaded
      .subscribe(account => {
        this.account = account
        this.videoChannels = []
        this.loadMoreChannels()
      })

    this.userService.getAnonymousOrLoggedUser()
      .subscribe(user => {
        this.userMiniature = user
        this.nsfwPolicy = user.nsfwPolicy
      })
  }

  ngOnDestroy () {
    if (this.accountSub) this.accountSub.unsubscribe()
  }

  loadMoreChannels () {
    // movi toda aquela cadeia de RxJS (switchMap/concatMap) para o VideoChannelService
    // o componente agora so "compoe" o resultado na tela
    this.videoChannelService.listAccountChannelsWithVideos({
      account: this.account,
      channelPagination: this.channelPagination,
      videosPagination: this.videosPagination,
      videosSort: this.videosSort,
      nsfw: this.videoService.nsfwPolicyToParam(this.nsfwPolicy)
    }).subscribe(async ({ videoChannel, videos, total }) => {
      this.channelsDescriptionHTML[videoChannel.id] = await this.markdown.textMarkdownToHTML({
        markdown: videoChannel.description,
        withEmoji: true,
        withHtml: true
      })

      this.videoChannels.push(videoChannel)
      this.videos[videoChannel.id] = { videos, total }
      this.onChannelDataSubject.next([ videoChannel ])
    })
  }

  getVideosOf (videoChannel: VideoChannel) {
    return this.videos[videoChannel.id]?.videos || []
  }

  getTotalVideosOf (videoChannel: VideoChannel) {
    return this.videos[videoChannel.id]?.total
  }

  getChannelDescription (videoChannel: VideoChannel) {
    return this.channelsDescriptionHTML[videoChannel.id]
  }

  onNearOfBottom () {
    if (!hasMoreItems(this.channelPagination)) return

    this.channelPagination.currentPage += 1
    this.loadMoreChannels()
  }

  @SimpleMemoize()
  getVideoChannelLink (videoChannel: VideoChannel) {
    return [ '/c', videoChannel.nameWithHost ]
  }
}
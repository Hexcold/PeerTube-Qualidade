import { Component, inject, viewChild } from '@angular/core'
import { VideosSelectionComponent } from '@app/shared/shared-video-miniature/videos-selection.component'
import { Video } from '@app/shared/shared-main/video/video.model'

import { MyHistoryFacade } from './my-history.facade'
import { MyHistoryViewModel } from './my-history.viewmodel'

@Component({
  templateUrl: './my-history.component.html',
  styleUrls: [ './my-history.component.scss' ],
  providers: [ MyHistoryFacade, MyHistoryViewModel ]
})
export class MyHistoryComponent {
  private readonly facade = inject(MyHistoryFacade)
  readonly vm = inject(MyHistoryViewModel)

  readonly videosSelection = viewChild<VideosSelectionComponent>('videosSelection')

  // HTML continua chamando isso
  getVideosObservableFunction = (page: number) =>
    this.vm.getVideos(page)

  reloadData () {
    this.videosSelection().reloadVideos()
  }

  onSearch (search: string) {
    this.vm.setSearch(search)
    this.reloadData()
  }

  onVideosHistoryChange () {
    this.facade.toggleHistory(this.vm.videosHistoryEnabled)
  }

  deleteHistoryElement (video: Video) {
    this.facade.deleteVideo(video, () => this.reloadData())
  }

  clearAllHistory () {
    this.facade.clearAll(() => this.reloadData())
  }

  getNoResultMessage () {
    return this.vm.getNoResultMessage()
  }
}

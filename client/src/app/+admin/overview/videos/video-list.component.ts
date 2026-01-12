import { Component, inject, viewChild } from '@angular/core'
import {
  TableComponent,
  DataLoaderOptions
} from '../../../shared/shared-tables/table.component'
import { Video } from '@app/shared/shared-main/video/video.model'

import { VideoListFacade } from './video-list.facade'
import { VideoListDataSource } from './video-list.datasource'

@Component({
  selector: 'my-video-list',
  templateUrl: './video-list.component.html',
  styleUrls: [ './video-list.component.scss' ],
  providers: [ VideoListFacade, VideoListDataSource ]
})
export class VideoListComponent {
  private readonly facade = inject(VideoListFacade)
  private readonly dataSource = inject(VideoListDataSource)

  readonly table = viewChild<TableComponent<Video>>('table')

  readonly dataLoader = (options: DataLoaderOptions) =>
    this.dataSource.load(options)

  removeVideos (videos: Video[]) {
    this.facade.removeVideos(videos, () => {
      this.table().loadData()
    })
  }
}

import { inject, Injectable } from '@angular/core'
import { VideoAdminService } from './video-admin.service'
import { DataLoaderOptions } from '../../../shared/shared-tables/table.component'
import { NSFWFlag } from '@peertube/peertube-models'

@Injectable()
export class VideoListDataSource {
  private videoAdminService = inject(VideoAdminService)

  load (options: DataLoaderOptions) {
    return this.videoAdminService.getAdminVideos({
      ...options,
      nsfw: 'both',
      nsfwFlagsExcluded: NSFWFlag.NONE
    })
  }
}

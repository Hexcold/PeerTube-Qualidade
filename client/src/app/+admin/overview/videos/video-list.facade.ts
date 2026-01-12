import { inject, Injectable } from '@angular/core'
import { ConfirmService, Notifier } from '@app/core'
import { VideoService } from '@app/shared/shared-main/video/video.service'
import { VideoBlockService } from '@app/shared/shared-moderation/video-block.service'
import { VideoCaptionService } from '@app/shared/shared-main/video-caption/video-caption.service'
import { formatICU } from '@app/helpers'
import { Video } from '@app/shared/shared-main/video/video.model'

@Injectable()
export class VideoListFacade {
  private confirmService = inject(ConfirmService)
  private notifier = inject(Notifier)
  private videoService = inject(VideoService)
  private videoBlockService = inject(VideoBlockService)
  private videoCaptionService = inject(VideoCaptionService)

  async removeVideos (videos: Video[], reload: () => void) {
    const res = await this.confirmService.confirm(
      formatICU(
        $localize`Are you sure you want to delete {count, plural, =1 {this video} other {these {count} videos}}?`,
        { count: videos.length }
      ),
      $localize`Delete`
    )

    if (!res) return

    this.videoService.removeVideo(videos.map(v => v.id)).subscribe({
      next: () => {
        this.notifier.success(
          formatICU(
            $localize`Deleted {count, plural, =1 {1 video} other {{count} videos}}.`,
            { count: videos.length }
          )
        )
        reload()
      },
      error: err => this.notifier.handleError(err)
    })
  }

  unblockVideos (videos: Video[], reload: () => void) {
    this.videoBlockService.unblockVideo(videos.map(v => v.id)).subscribe({
      next: () => {
        this.notifier.success(
          formatICU(
            $localize`Unblocked {count, plural, =1 {1 video} other {{count} videos}}.`,
            { count: videos.length }
          )
        )
        reload()
      },
      error: err => this.notifier.handleError(err)
    })
  }

  runTranscoding (videos: Video[], type: 'hls' | 'web-video', reload: () => void) {
    this.videoService.runTranscoding({ videos, type }).subscribe({
      next: () => {
        this.notifier.success($localize`Transcoding jobs created.`)
        reload()
      },
      error: err => this.notifier.handleError(err)
    })
  }

  generateCaption (videos: Video[]) {
    this.videoCaptionService.generateCaption({ videos }).subscribe({
      next: result => {
        if (result.success) {
          this.notifier.success(
            formatICU(
              $localize`{count, plural, =1 {1 transcription job created.} other {{count} transcription jobs created.}}`,
              { count: result.success }
            )
          )
        }
      },
      error: err => this.notifier.handleError(err)
    })
  }
}

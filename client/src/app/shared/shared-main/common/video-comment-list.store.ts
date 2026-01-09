import { Injectable, inject } from '@angular/core'
import { VideoCommentService } from '@app/shared/shared-video-comment/video-comment.service'
import { MarkdownService, Notifier, ConfirmService, HooksService, PluginService, AuthService } from '@app/core'
import { BulkService } from '@app/shared/shared-moderation/bulk.service'
import { VideoCommentForAdminOrUser } from '@app/shared/shared-video-comment/video-comment.model'
import { map, switchMap } from 'rxjs/operators'
import { from } from 'rxjs'

@Injectable()
export class VideoCommentListStore {
  private videoCommentService = inject(VideoCommentService); private markdown = inject(MarkdownService)
  private notifier = inject(Notifier); private confirmService = inject(ConfirmService)
  private bulkService = inject(BulkService); private auth = inject(AuthService)

  async processComments(data: any[]) {
    const processed = []
    for (const c of data) {
      const html = await this.markdown.textMarkdownToHTML({ markdown: c.text, withHtml: true, withEmoji: true })
      processed.push(new VideoCommentForAdminOrUser(c, html))
    }
    return processed
  }

  getDataLoader(mode: 'user' | 'admin') {
    return (options: any) => {
      const apiCall = mode === 'admin' 
        ? this.videoCommentService.listAdminVideoComments(options)
        : this.videoCommentService.listVideoCommentsOfMyVideos(options)
      
      return apiCall.pipe(
        switchMap(async result => ({
          total: result.total,
          data: await this.processComments(result.data)
        }))
      )
    }
  }

  // Métodos de Delete/Approve simplificados aqui...
}
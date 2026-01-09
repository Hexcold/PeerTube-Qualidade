import { DropdownAction } from '../shared-main/buttons/action-dropdown.component'
import { VideoCommentForAdminOrUser } from '@app/shared/shared-video-comment/video-comment.model'
import { UserRight } from '@peertube/peertube-models'

export class VideoCommentActionsHelper {
  static getBaseActions(
    mode: 'user' | 'admin', 
    user: any, 
    handlers: { remove: any, removeAccount: any, approve: any }
  ): DropdownAction<VideoCommentForAdminOrUser>[][] {
    return [
      [
        {
          label: $localize`Delete this comment`,
          handler: handlers.remove,
          isDisplayed: () => mode === 'user' || user.hasRight(UserRight.MANAGE_ANY_VIDEO_COMMENT)
        },
        {
          label: $localize`Delete all comments of this account`,
          description: mode === 'user' 
            ? (user.isCollaboratingToChannels() ? $localize`Channels you own or edit` : $localize`All your videos`)
            : $localize`All videos from your platform`,
          handler: handlers.removeAccount,
          isDisplayed: () => mode === 'user' || user.hasRight(UserRight.MANAGE_ANY_VIDEO_COMMENT)
        }
      ],
      [
        {
          label: $localize`Approve this comment`,
          handler: handlers.approve,
          isDisplayed: (c) => mode === 'user' && c.heldForReview
        }
      ]
    ]
  }
}
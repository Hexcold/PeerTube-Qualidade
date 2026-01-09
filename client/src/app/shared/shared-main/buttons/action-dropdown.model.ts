import { Params } from '@angular/router'
import { ActorAvatarInput, ActorAvatarType } from '@app/shared/shared-actor-image/actor-avatar.component'
import { GlobalIconName } from '@app/shared/shared-icons/global-icon.component'
import { CollaboratorStateType } from '../channel/collaborator-state.component'

export type DropdownAction<T, D = never> = {
  label: string
  iconName?: GlobalIconName
  actorAvatar?: { actor: ActorAvatarInput; type: ActorAvatarType }
  collaboratorBadge?: CollaboratorStateType
  description?: string
  title?: string
  handler?: (a: T) => void
  linkBuilder?: (a: T) => (string | number)[]
  queryParamsBuilder?: (a: T) => Params
  isDisplayed?: (a: T) => boolean
  class?: string[]
  isHeader?: boolean
  ownerOrModeratorPrivilege?: () => string
  data?: D
}

export type DropdownButtonSize = 'normal' | 'small'
export type DropdownTheme = 'primary' | 'secondary'
export type DropdownButtonIcon = 'more-horizontal' | 'more-vertical' | 'chevron-down'
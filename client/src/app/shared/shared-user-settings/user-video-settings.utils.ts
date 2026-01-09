import { NSFWFlag, NSFWFlagType, NSFWPolicyType, User, UserUpdateMe } from '@peertube/peertube-models'
import { SelectOptionsItem } from 'src/types'

export const NSFW_ITEMS: SelectOptionsItem[] = [
  { id: 'do_not_list', label: $localize`Hide` }, { id: 'blur', label: $localize`Blur` },
  { id: 'warn', label: $localize`Warn` }, { id: 'display', label: $localize`Display` }
]

export const getFlagPolicy = (user: User, flag: NSFWFlagType): NSFWPolicyType | 'default' => {
  if (user.nsfwFlagsDisplayed & flag) return 'display'
  if (user.nsfwFlagsWarned & flag) return 'warn'
  if (user.nsfwFlagsBlurred & flag) return 'blur'
  if (user.nsfwFlagsHidden & flag) return 'do_not_list'
  return 'default'
}

export const mapToUpdateMe = (val: any): UserUpdateMe => {
  const getFlag = (type: NSFWPolicyType) => {
    let res = NSFWFlag.NONE
    if (val.nsfwFlagViolent === type) res |= NSFWFlag.VIOLENT
    if (val.nsfwFlagSex === type) res |= NSFWFlag.EXPLICIT_SEX
    return res
  }
  return {
    nsfwPolicy: val.nsfwPolicy, p2pEnabled: val.p2pEnabled,
    autoPlayVideo: val.autoPlayVideo, autoPlayNextVideo: val.autoPlayNextVideo,
    videoLanguages: val.videoLanguages,
    nsfwFlagsDisplayed: getFlag('display'), nsfwFlagsHidden: getFlag('do_not_list'),
    nsfwFlagsWarned: getFlag('warn'), nsfwFlagsBlurred: getFlag('blur')
  }
}
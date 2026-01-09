import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AuthService, Notifier, ServerService, User, UserService } from '@app/core';
import { FormReactiveService } from '@app/shared/shared-forms/form-reactive.service';
import { NSFWFlag, NSFWPolicyType, UserUpdateMe } from '@peertube/peertube-models';
import { pick } from 'lodash-es';
import { Subscription } from 'rxjs';
import * as Utils from './user-video-settings.utils';

@Injectable()
export class UserVideoSettingsStore {
  private userService = inject(UserService); private authService = inject(AuthService)
  private notifier = inject(Notifier); private serverService = inject(ServerService)
  private formService = inject(FormReactiveService)

  form: FormGroup;
  private subs = new Subscription();

  build(user: User) {
    const { form } = this.formService.buildForm({
      nsfwPolicy: null, nsfwFlagViolent: null, nsfwFlagSex: null,
      p2pEnabled: null, autoPlayVideo: null, autoPlayNextVideo: null, videoLanguages: null
    })
    this.form = form;
    this.patch(user);
  }

  private patch(user: User) {
    this.form.patchValue({
      nsfwPolicy: user.nsfwPolicy || this.serverService.getHTMLConfig().instance.defaultNSFWPolicy,
      nsfwFlagViolent: Utils.getFlagPolicy(user, NSFWFlag.VIOLENT),
      nsfwFlagSex: Utils.getFlagPolicy(user, NSFWFlag.EXPLICIT_SEX),
      p2pEnabled: user.p2pEnabled, autoPlayVideo: user.autoPlayVideo === true,
      autoPlayNextVideo: user.autoPlayNextVideo, videoLanguages: user.videoLanguages
    })
  }

  save(onlyKeys?: string[], notify = true) {
    const val = this.form.getRawValue();
    if (val.videoLanguages?.length > 20) return this.notifier.error($localize`Too many languages.`);

    let details = Utils.mapToUpdateMe(val);
    if (onlyKeys) {
      const keys = onlyKeys.some(k => k.startsWith('nsfwFlag')) 
        ? [...onlyKeys, 'nsfwFlagsDisplayed', 'nsfwFlagsHidden', 'nsfwFlagsWarned', 'nsfwFlagsBlurred'] 
        : onlyKeys;
      details = pick(details, keys as (keyof UserUpdateMe)[]);
    }

    const obs = this.authService.isLoggedIn() ? this.userService.updateMyProfile(details) : null;
    if (!obs) {
      this.userService.updateMyAnonymousProfile(details);
      if (notify) this.notifier.success($localize`Settings updated.`);
      return;
    }

    obs.subscribe({
      next: () => { 
        this.authService.refreshUserInformation(); 
        if (notify) this.notifier.success($localize`Settings updated.`);
      },
      error: err => this.notifier.handleError(err)
    });
  }

  watch(callback: (key: string) => void) {
    let old = this.form.getRawValue();
    this.subs.add(this.form.valueChanges.subscribe(val => {
      const key = Object.keys(val).find(k => val[k] !== old[k]);
      old = { ...val };
      if (key) callback(key);
    }));
  }

  cleanup() { this.subs.unsubscribe(); }
}
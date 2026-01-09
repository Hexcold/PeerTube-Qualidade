import { Component, OnDestroy, OnInit, booleanAttribute, inject, input } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { User } from '@app/core'
import { Subject } from 'rxjs'
import { first } from 'rxjs/operators'
import * as Utils from './user-video-settings.utils'
import { UserVideoSettingsStore } from './user-video-settings.store'

@Component({
  selector: 'my-user-video-settings',
  templateUrl: './user-video-settings.component.html',
  standalone: true,
  providers: [UserVideoSettingsStore], // O Store vive e morre com o componente
  imports: [FormsModule, ReactiveFormsModule /* ...outros */]
})
export class UserVideoSettingsComponent implements OnInit, OnDestroy {
  protected store = inject(UserVideoSettingsStore)
  
  readonly user = input<User>(null)
  readonly reactiveUpdate = input(false, { transform: booleanAttribute })
  readonly notifyOnUpdate = input(true, { transform: booleanAttribute })
  readonly userInformationLoaded = input<Subject<void>>(undefined)

  readonly nsfwItems = Utils.NSFW_ITEMS
  readonly nsfwFlagItems = [{ id: 'default', label: $localize`Default` }, ...Utils.NSFW_ITEMS]

  ngOnInit() {
    this.store.build(this.user())
    this.userInformationLoaded()?.pipe(first()).subscribe(() => {
      if (this.reactiveUpdate()) {
        this.store.watch(key => this.store.save([key], this.notifyOnUpdate()))
      }
    })
  }

  ngOnDestroy() { this.store.cleanup() }

  // Usado pelo botão de salvar no template (se houver)
  updateDetails() {
    this.store.save(undefined, this.notifyOnUpdate())
  }
}
import { Component, OnInit, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AuthService, ServerService } from '@app/core'
import { HorizontalMenuComponent, HorizontalMenuEntry } from '@app/shared/shared-main/menu/horizontal-menu.component'
// import do novo serviço (ou moveríamos para um AdminMenuService no mundo real)
import { AdminMenuService } from './admin-menu.service'

@Component({
  selector: 'my-admin-settings',
  templateUrl: './admin-settings.component.html',
  imports: [ HorizontalMenuComponent, RouterOutlet ]
})
export class AdminSettingsComponent implements OnInit {
  private server = inject(ServerService)
  // injetei o serviço que agora lida com a construção pesada do menu
  private adminMenuService = inject(AdminMenuService)

  menuEntries: HorizontalMenuEntry[] = []

  ngOnInit () {
    // toda vez que o config recarregar, o serviço reprocessa o menu
    this.server.configReloaded.subscribe(() => this.refreshMenu())

    this.refreshMenu()
  }

  private refreshMenu () {
    // o componente agora é "burro": ele só pede os dados e guarda na variável
    this.menuEntries = this.adminMenuService.buildAdminMenu()
  }
}
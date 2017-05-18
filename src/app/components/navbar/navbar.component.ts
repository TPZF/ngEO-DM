import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SettingsService } from './../../services/settings.service';

/*
 * NavBar Component
 */
@Component({
    selector: 'ngeo-navbar',
    styleUrls: ['./navbar.component.scss'],
    templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {

	private _username: string = null;

    constructor(
        private _router: Router,
        private _settingsService: SettingsService) {
    }

    ngOnInit() {
		this._username = this._settingsService.get('username');
        if (this._username !== '') {
            this._router.navigate(['/downloadManagers']);
        } else {
			this._router.navigate(['/']);
		}
    }

}

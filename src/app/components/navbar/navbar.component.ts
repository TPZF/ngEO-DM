import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from './../../services/authentication.service';

/*
 * NavBar Component
 */
@Component({
    selector: 'ngeo-navbar',
    styleUrls: ['./navbar.component.scss'],
    templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService) {
    }

    ngOnInit() {
        if (this.authenticationService.getCurrentUser() === null) {
            this.router.navigate(['/login']);
        }
    }

}

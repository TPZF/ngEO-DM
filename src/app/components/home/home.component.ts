import { AuthenticationService } from './../../services/authentication.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/*
 * App Component
 */
@Component({
  selector: 'home',
  styleUrls: ['./home.component.scss'],
  template: `
    <md-tab-group>
      <md-tab label="Download manager">
        <download-manager></download-manager>
      </md-tab>
      <md-tab label="Search">
        <search></search>
      </md-tab>
    </md-tab-group>
    <div class="userInfo">
      Logged as : {{authenticationService.currentUser.username}}
      <button md-raised-button color="primary" (click)="logout()">Logout</button>
    </div>
    `
})
export class HomeComponent implements OnInit {

  constructor(private router: Router, private authenticationService: AuthenticationService) {
  }

  ngOnInit() {
  }

  logout() {
    this.router.navigate(['/login']);
  }
}

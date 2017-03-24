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
    <button class="logout" md-raised-button color="primary" (click)="logout()">Logout</button>
    `
})
export class HomeComponent implements OnInit {

  constructor(private router: Router) {
  }

  ngOnInit() {
  }

  logout() {
    this.router.navigate(['/login']);
  }
}

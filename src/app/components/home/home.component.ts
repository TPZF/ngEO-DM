import { Component, OnInit } from '@angular/core';

/*
 * App Component
 */
@Component({
  selector: 'home',
  // styleUrls: ['./home.component.scss'],
  template: `
    <md-tab-group>
      <md-tab label="Download manager">
        <download-manager></download-manager>
      </md-tab>
      <md-tab label="Search">
        <search></search>
      </md-tab>
    </md-tab-group>
    `
})
export class HomeComponent implements OnInit {

  isDarkTheme: boolean = false;
  ngOnInit() {
  }

  checkAuthentication() { }
}

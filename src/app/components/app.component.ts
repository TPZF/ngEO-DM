import { Component, OnInit } from '@angular/core';

/*
 * App Component
 */
@Component({
  selector: 'app',
  styleUrls: ['./app.component.scss'],
  template: `

    <nav [class.m2app-dark]="isDarkTheme" md-tab-nav-bar>
      <a md-tab-link
        *ngFor="let link of navLinks"
        [routerLink]="link.url"
        routerLinkActive #rla="routerLinkActive"
        [active]="rla.isActive">
        {{link.label}}
      </a>
    </nav>

    <div [class.m2app-dark]="isDarkTheme">
        <main>
            <router-outlet></router-outlet>
            <br/>
            <md-slide-toggle (change)="isDarkTheme = !isDarkTheme" [checked]="isDarkTheme" color="primary">
                Set Dark theme
            </md-slide-toggle>
        </main>
    </div>
    `
})
export class AppComponent implements OnInit {

  isDarkTheme: boolean = false;
  ngOnInit() {
  }

  private navLinks = [{
    url: '/home',
    label: 'Download manager'
  }, {
    url: '/search',
    label: 'Search'
  }]

  checkAuthentication() { }
}

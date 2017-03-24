import { Component, OnInit } from '@angular/core';

/*
 * App Component
 */
@Component({
  selector: 'app',
  styleUrls: ['./app.component.scss'],
  template: `
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
}

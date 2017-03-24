import { AuthenticationService } from './../../services/authentication.service';

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { NgeoService } from './../../services/ngeo';

@Component({
  selector: 'login',
  template: `

    <md-tab-group class="login" [selectedIndex]="step">
      <md-tab>
        <md-grid-list cols="1" rowHeight="300px">
          <md-grid-tile>
            <md-card>
              <md-card-title>Login</md-card-title>
              <md-card-content>

                <md-input-container class="full-width">
                  <input mdInput [(ngModel)]="username" placeholder="Username">
                </md-input-container>

                <md-input-container class="full-width">
                  <input mdInput type="password" [(ngModel)]="password" placeholder="Password">
                </md-input-container>
              </md-card-content>
            </md-card>
          </md-grid-tile>
          <md-grid-tile>
            <button md-raised-button color="primary" (click)="login()">Login</button>
            <md-progress-spinner style="display: inline-block; height: 16px; width: 16px;" *ngIf="loaders['authentication']" mode="indeterminate"></md-progress-spinner>
          </md-grid-tile>
        </md-grid-list>
      </md-tab>
      <md-tab>
        <md-grid-list cols="2" rowHeight="300px">
          <md-grid-tile>
            <md-card>
              <md-card-title>Select download manager</md-card-title>
              <md-card-content>
                <md-select color="primary" [(ngModel)]="selectedDownloadManager" *ngIf="downloadManagers.length > 0" placeholder="Download managers">
                  <md-option *ngFor="let dm of downloadManagers" [value]="dm.downloadManagerFriendlyName">{{ dm.downloadManagerFriendlyName }}</md-option>
                </md-select>
                <button [disabled]="!selectedDownloadManager" style="margin: 0px 10px" md-raised-button color="primary" (click)="select()">Select</button>
                <md-progress-spinner style="display: inline-block; height: 16px; width: 16px;" *ngIf="loaders['select']" mode="indeterminate"></md-progress-spinner>
              </md-card-content>
            </md-card>
          </md-grid-tile>
          <md-grid-tile>
            <md-card>
              <md-card-title>Register a new download manager</md-card-title>
              <md-card-content>
                <md-input-container class="full-width">
                  <input mdInput [(ngModel)]="downloadManagerName" placeholder="Download manager name">
                </md-input-container>
                <button [disabled]="!downloadManagerName" style="margin: 0px 10px" md-raised-button color="primary" (click)="register()">Register</button>
                <md-progress-spinner style="display: inline-block; height: 16px; width: 16px;" *ngIf="loaders['register']" mode="indeterminate"></md-progress-spinner>
              </md-card-content>
            </md-card>
          </md-grid-tile>
          <md-grid-tile colspan="2">
            <button md-raised-button color="primary" (click)="logout()">Logout</button>
          </md-grid-tile>
        </md-grid-list>
      </md-tab>
    </md-tab-group>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  private step: number = 0;
  private username: string = "";
  private password: string = "";
  private loaders = {
    "register": false,
    "select": false,
    "authentication": false
  };
  private downloadManagerName: string = "";
  private downloadManagers = [];
  private selectedDownloadManager;
  constructor(private _ngeoService: NgeoService, private router: Router, private authenticationService: AuthenticationService) {
  }

  ngOnInit() {
  }

  /**
   * Login user to entered download manager
   */
  private login() {
    this.loaders['authentication'] = true;
    this.authenticationService.login(this.username, this.password).subscribe((data) => {
      this.loaders['authentication'] = false;
      this.loaders['select'] = true;
      this._ngeoService.getDownloadManagers(this.username).subscribe((downloadManagersRes) => {
        this.loaders['select'] = false;
        this.step = 1;
        this.downloadManagers = downloadManagersRes['downloadmanagers'];
      })
    });
  }

  /**
   * Logout & move to first step
   */
  private logout() {
    this.authenticationService.logout().subscribe(() => {
      this.step = 0;
    });
  }

  /**
   * Select the available download manager
   */
  private select() {
    console.log(this.selectedDownloadManager);
    this.router.navigate(['/home']);
  }

  /**
   * Register the given download manager
   */
  private register() {
    this.loaders['register'] = true;
    this._ngeoService.registerDownloadManager(this.username, this.downloadManagerName).subscribe((res) => {
      this.loaders['register'] = false;
      this.downloadManagers.push(res.downloadmanager);
    })
  }
}

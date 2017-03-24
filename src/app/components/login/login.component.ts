
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { NgeoService } from './../../services/ngeo';

@Component({
  selector: 'login',
  template: `

    <md-grid-list cols="1" rowHeight="300px">
      <md-grid-tile>
        <md-card>
          <md-card-title>Login</md-card-title>
          <md-card-content>

            <md-input-container class="full-width">
              <input mdInput [(ngModel)]="userName" placeholder="Username">
            </md-input-container>

            <md-input-container class="full-width">
              <input mdInput type="password" [(ngModel)]="password" placeholder="Password">
            </md-input-container>

            <md-input-container class="full-width">
              <input mdInput [(ngModel)]="downloadManagerName" placeholder="Download manager name">
            </md-input-container>

          </md-card-content>
        </md-card>
      </md-grid-tile>
      <md-grid-tile>
        <button md-raised-button color="primary" (click)="login()">Login</button>
        <button style="margin: 0px 10px" md-raised-button color="primary" (click)="register()">Register</button>
        <md-progress-spinner style="display: inline-block; height: 16px; width: 16px;" *ngIf="isProcessing" mode="indeterminate"></md-progress-spinner>
      </md-grid-tile>
    </md-grid-list>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  private userName: string = "";
  private password: string = "";
  private downloadManagerName: string = "";
  private isProcessing: boolean = false;
  constructor(private _ngeoService: NgeoService, private router: Router) {
  }

  ngOnInit() {
  }

  /**
   * Login user to entered download manager
   */
  login() {
    this.router.navigate(['/home']);
  }

  /**
   * Register the given download manager
   */
  private register() {
    console.log("Registering DM");
  }
}

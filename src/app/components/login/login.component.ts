import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthenticationService } from './../../services/authentication.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  private username: string = '';
  private password: string = '';

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.authenticationService.logout();
  }

  /**
   * Login user to entered download manager
   */
  private login() {
    this.authenticationService.login(this.username, this.password);
    this.router.navigate(['downloadManagers']);
  }

  private isValidForm() {
      return ((this.username) && (this.password));
  }

}

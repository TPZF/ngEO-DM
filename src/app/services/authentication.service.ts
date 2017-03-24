import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/map'

@Injectable()
export class AuthenticationService {
  constructor(private http: Http) { }

  private currentUser: any = null;

  /**
   * Login with the given username & password
   *
   * @param username
   * @param password
   */
  public login(username: string, password: string) {
    // TODO: replace by a real implementation
    this.currentUser = {
      username: username,
      password: password
    }
    return Observable.of(this.currentUser);
  }

  /**
   * Logout
   */
  public logout() {
    this.currentUser = null;
    return Observable.of(this.currentUser);
  }
}
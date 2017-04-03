// Imports
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { DownloadManagerService } from './../../services/download-manager.service';
import { DownloadManager } from './../../models/download-manager';

@Component({
  selector: 'download-manager-list',
  templateUrl: './download-manager-list.component.html',
  styleUrls: ['./download-manager-list.component.scss']
})
// Component class implementing OnInit
export class DownloadManagerListComponent implements OnInit {
  
  // Private property for binding
  private errorMessage: string;
  private downloadManagers: DownloadManager[];

  private formAdd: boolean = false;
  private downloadManagerFriendlyName: FormControl = new FormControl('', [ Validators.required ]);
  private registerForm: FormGroup;

  private dateNow: number;

  constructor(
    private downloadManagerService: DownloadManagerService,
    private formBuilder: FormBuilder
  ) {
    this.registerForm = this.formBuilder.group({
      downloadManagerFriendlyName: this.downloadManagerFriendlyName
    });
  }

  // Load data ones componet is ready
  ngOnInit() {
    // Pass retreived downloadManagers to the property
    this.downloadManagerService
    .getDownloadManagers()
    .subscribe(
      downloadManagers => this.downloadManagers = downloadManagers,
      error => this.errorMessage = <any>error
    );
    this.dateNow = new Date().getTime();
  }

  isActive(myDownloadManager) {
    return myDownloadManager.status === 'ACTIVE';
  }

  getLastAccess(dateLastAccess) {
    let date1 = new Date(dateLastAccess).getTime();
    // if diff > 4 hours, display date
    if ((this.dateNow - date1) > 1000 * 60 * 60 * 4) {
      return dateLastAccess;
    } else { // display diff
      return this.convertTime(this.dateNow - date1);
    }
  }

  onSubmit(myForm: FormGroup) {
    this.downloadManagerService
    .registerDownloadManager(myForm.value)
    .subscribe(
      downloadManager => this.downloadManagers.push(downloadManager.downloadmanager),
      error => this.errorMessage = <any>error
    );
    this.formAdd = false;
  }

  convertTime(time : number) {
    var out = '';
    var millis = time % 1000;
    time = (time - millis) / 1000;
    var seconds = time % 60;
    time = (time - seconds) / 60;
    var minutes = time % 60;
    time = (time - minutes) / 60;
    var hours = time % 24;
    if (hours && hours > 0) out += hours + ' ' + ((hours == 1) ? 'hr' : 'hrs') + ' ';
    if (minutes && minutes > 0) out += minutes + ' ' + ((minutes == 1) ? 'min' : 'mins') + ' ';
    if (seconds && seconds > 0) out += seconds + ' ' + ((seconds == 1) ? 'sec' : 'secs') + ' ';
    return (out + ' ago').trim();
  }
}

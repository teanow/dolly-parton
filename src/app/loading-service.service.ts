import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingServiceService {
  isLoading = false;

  constructor(public loading: LoadingController) { }
  async present() {
    if (!this.isLoading) {
      this.isLoading = true;
      return await this.loading.create({
        message: '',
        cssClass: 'transparent-white-loading',
        spinner: 'crescent'
      }).then(a => {
        a.present().then(() => {
          if (!this.isLoading) {
            a.dismiss();
          }
        });
      });
    }
  }

  async dismiss() {
    this.isLoading = false;
    this.loading.getTop().then(async active => {
      if (active) {
        return await this.loading.dismiss();
      }
    });
  }
}

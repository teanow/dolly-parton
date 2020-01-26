import { Component } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Observable, Subscription } from 'rxjs';
import { ApiServiceService } from '../api-service.service';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { ToastController } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  base64Image: any;
  photos: any = [];
  data: any;
  res$: Observable<any>;
  archive$: Observable<any>;
  private resSubscription: Subscription;
  readyToDownload: boolean = false;
  downloadSrc: string = "";
  fileTransfer: FileTransferObject = this.transfer.create();

  constructor(public actionsheetCtrl: ActionSheetController,
    public platform: Platform,
    private apiService: ApiServiceService,
    private camera: Camera,
    private socialSharing: SocialSharing,
    private transfer: FileTransfer,
    private file: File,
    public toastController: ToastController,
    private androidPermissions: AndroidPermissions) { }

  ionViewWillLeave() {
    this.resSubscription.unsubscribe();
  }

  share(network: number) {
    if (network === 1) {
      this.socialSharing.shareViaInstagram('', this.downloadSrc).then((res) => {
        // Success
      }).catch((e) => {
        // Error!
      });
    }
    if (network === 2) {
      this.socialSharing.shareViaWhatsApp(null, this.downloadSrc, null).then((res) => {
        // Success
      }).catch((e) => {
        // Error!
      });
    }
    if (network === 3) {
      this.socialSharing.shareViaTwitter(null, this.downloadSrc, null).then((res) => {
        // Success
      }).catch((e) => {
        // Error!
      });
    }
    if (network === 4) {
      this.socialSharing.saveToPhotoAlbum(this.downloadSrc).then((res) => {
        // Success
      }).catch((e) => {
        // Error!
      });
    }
  }

  checkPermission() {
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.INTERNET).then(
      result => {
        if (result.hasPermission) {
          return true;
        } else {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.INTERNET).then(result => {
            if (result.hasPermission) {
              return true;
            }
          });
        }
      },
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.INTERNET)
    );
    return false;
  }

  downloadFile() {
    if (this.checkPermission) {
      const url = encodeURI(this.downloadSrc);
      const name = url.split('/').pop();
      console.log(name);
      console.log(this.file.externalRootDirectory);
      this.file.checkDir(this.file.externalRootDirectory, 'downloads')
        .then(
          // Directory exists, check for file with the same name
          _ => this.file.checkFile(this.file.externalRootDirectory, 'downloads/' + name)
            .then(_ => {
              this.presentToastWithOptions("A file with the same name already exists!")
            })
            // File does not exist yet, we can save normally
            .catch(err =>
              this.fileTransfer.download(url, this.file.externalRootDirectory + 'downloads/' + name).then((entry) => {
                this.presentToastWithOptions('saved successfully');
              })
                .catch((err) => {
                  this.presentToastWithOptions('error 1');
                  console.log(err);
                })
            ))
        .catch(
          // Directory does not exists, create a new one
          err => this.file.createDir(this.file.externalRootDirectory, 'downloads', false)
            .then(response => {
              this.fileTransfer.download(url, this.file.externalRootDirectory + 'downloads/' + name).then((entry) => {
                this.presentToastWithOptions('saved successfully');
              })
                .catch((err) => {
                  this.presentToastWithOptions('error 2');
                  console.log(err);
                });

            }).catch(err => {
              this.presentToastWithOptions('error creating folder');
            })
        );
    }
  }

  async presentToastWithOptions(message: string) {
    const toast = await this.toastController.create({
      header: '',
      message: message,
      position: 'top',
      duration: 2000,
      color: 'success'
    });
    toast.present();
  }

  sendImagesToServer() {
    var data = JSON.stringify({
      "id": "106a5sd6asas64d5cz6x5c1",
      "images": this.photos
    });
    this.res$ = this.apiService.sendPost('generate', data);
    this.resSubscription = this.res$.subscribe(data => {
      if (data && data["data"] && data["data"]["url"]) {
        this.downloadSrc = data["data"]["url"];
        this.readyToDownload = true;
      }
    });
  }

  async openeditprofile(index: number) {
    const actionSheet = await this.actionsheetCtrl.create({
      cssClass: 'action-sheets-basic-page',
      buttons: [
        {
          text: '',
          role: 'destructive',
          icon: 'camera',
          handler: () => {
            this.captureImage(false, index);
          }
        },
        {
          text: '',
          icon: 'image',
          handler: () => {
            this.captureImage(true, index);
          }
        },
      ]
    });
    await actionSheet.present();
  }

  async captureImage(useAlbum: boolean, index: number) {
    const options: CameraOptions = {
      quality: 100,
      targetWidth: 640,
      targetHeight: 640,
      allowEdit: true,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      ...useAlbum ? { sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM } : {}
    }

    const imageData = await this.camera.getPicture(options);
    let base64Image = 'data:image/jpeg;base64,' + imageData;
    this.photos[index] = base64Image;
  }

  redo() {
    this.downloadSrc = "";
    this.readyToDownload = false;
    this.photos = [];
  }
}

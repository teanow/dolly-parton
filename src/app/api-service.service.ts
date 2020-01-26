import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, EMPTY, from, of, throwError } from "rxjs";
import { catchError, retry, shareReplay, retryWhen, delay, mergeMap, finalize, tap, startWith } from "rxjs/operators"
import { LoadingController } from '@ionic/angular';
import { LoadingServiceService } from './loading-service.service';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {
  private ENDPOINT = "http://5.152.223.138:4444/";
    private asyncMaxRetry = 3;
    private asyncBackoffMs = 2000;
    loading: any;

    constructor(private httpClient: HttpClient, public loadingService: LoadingServiceService) { }

    delayedRetry(delayMs: number, maxRetry = 3) {
        let retries = maxRetry;
        return (src: Observable<any>) =>
            src.pipe(
                retryWhen((errors: Observable<any>) => errors.pipe(
                    delay(delayMs),
                    mergeMap(error => retries-- > 0 ? of(error) : throwError(error)))
                )
            );
    }

    delayedRetryWithBackoff(delayMs: number, maxRetry = 3, backoffMs = 1500) {
        let retries = maxRetry;
        return (src: Observable<any>) =>
            src.pipe(
                retryWhen((errors: Observable<any>) => errors.pipe(
                    mergeMap(error => {
                        if (retries-- > 0) {
                            const backoffTime = delayMs + (maxRetry - retries) * backoffMs;
                            return of(error).pipe(delay(backoffTime));
                        }
                        return throwError(error);
                    }
                    )
                )
                )
            );
    }

    sendGet(url: string, notConcatEndpoint?: boolean, hideLoading?: boolean) {

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.append('Accept', 'application/json');
        headers = headers.append('X-Client-Name', 'android');

        if (!hideLoading)
            this.loadingService.present()
        if (!notConcatEndpoint)
            url = this.ENDPOINT + url;
        return this.httpClient.get(url, { headers: headers }).pipe(
            this.delayedRetryWithBackoff(1000, 3, 1200),
            catchError(err => {
                console.log(err.status);
                return EMPTY;
            }),
            finalize(() => {
                this.loadingService.dismiss();
            })
        )
    }

    sendPost(url: string, body?:any, notConcatEndpoint?: boolean, hideLoading?: boolean) {

      let headers: HttpHeaders = new HttpHeaders();
      headers = headers.append('Accept', 'application/json');
      headers = headers.append('content-type', 'application/json');

      if (!hideLoading)
          this.loadingService.present()
      if (!notConcatEndpoint)
          url = this.ENDPOINT + url;
      return this.httpClient.post(url, body, { headers: headers }).pipe(
          this.delayedRetryWithBackoff(1000, 3, 1200),
          catchError(err => {
              console.log(err.status);
              return EMPTY;
          }),
          finalize(() => {
              this.loadingService.dismiss();
          })
      )
  }

    async presentLoading() {

    }
    async dismissLoading() {

    }

    public sendGetRequestAsync = async (url: string, retry?: number, notConcatEndpoint?: boolean, hideLoading?: boolean) => {
        if (!hideLoading) {

        }
        if (!notConcatEndpoint)
            url = this.ENDPOINT + url;
        try {
            const res: any = await this.httpClient.get(url).toPromise();
            await this.loading.dismiss();
            return res;
        } catch (err) {
            if (retry === undefined) {
                retry = this.asyncMaxRetry;
            }
            console.log(retry);
            if (retry !== 0) {
                if (retry === 1) {
                    url = url + "t";
                }
                let timeOut = ((this.asyncMaxRetry - retry) + 1) * this.asyncBackoffMs;
                setTimeout(() => {
                    return this.sendGetRequestAsync(url, retry - 1, true, true);
                }, timeOut)
            }
            else {
                if (this.loading)
                    await this.loading.dismiss();
                if (err.status === 401) {
                }
                else if (err.status === 404) {
                }
                return null;
            }
        }
    };
}

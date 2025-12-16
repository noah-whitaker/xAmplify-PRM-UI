import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomResponse } from 'app/common/models/custom-response';
import { AuthenticationService } from 'app/core/services/authentication.service';
import { IntegrationService } from 'app/core/services/integration.service';
import { ReferenceService } from 'app/core/services/reference.service';
import { noWhiteSpaceValidator } from 'app/form-validator';
import { Subscription } from 'rxjs/Subscription';

declare var swal: any;

@Component({
  selector: 'app-custom-crm-integration',
  templateUrl: './custom-crm-integration.component.html',
  styleUrls: ['./custom-crm-integration.component.css']
})
export class CustomCrmIntegrationComponent implements OnInit {

  @Output() refreshEvent = new EventEmitter<void>();

  patForm: FormGroup;
  loading: boolean = false;
  reconfiguring: boolean = false;
  showDetails: boolean = false;
  // activeIntegrationDetails: any;
  // xAmplifyUserDetails: any;
  activeIntegrationOrganizationName: any;
  activeIntegrationUserName: any;
  activeIntegrationUserEmailId: any;
  xAmplifyUserName: any;
  xAmplifyUserEmailId: any;
  xAmplifyUserOrgnizationName: any;
  activeIntegrationDetailEntries: Array<{ label: string, value: any }> = [];
  userDetailEntries: Array<{ label: string, value: any }> = [];
  customResponse: CustomResponse = new CustomResponse();
  storedPat: string = '';
  xAmplifyCrmType: any;
  updatedDate: any;

  constructor(private fb: FormBuilder, private integrationService: IntegrationService,
    private authenticationService: AuthenticationService, private referenceService: ReferenceService) { }

  // ngOnDestroy(): void {
  //   if (this.subscriptions && this.subscriptions.length) {
  //     this.subscriptions.forEach(subscription => subscription.unsubscribe());
  //   }
  // }

  ngOnInit() {
    this.initializeForm();
    this.loadActiveIntegrationDetails();
  }

  initializeForm() {
    this.patForm = this.fb.group({
      pat: ['', [Validators.required, noWhiteSpaceValidator]]
    });
  }

  // loadActiveIntegrationDetails() {
  //   this.loading = true;
  //   const loggedInUserId = this.authenticationService.getUserId();
  //   const subscription = this.integrationService.fetchCustomCrmActiveIntegration(loggedInUserId).subscribe(response => {
  //     this.loading = false;
  //     const hasData = response && response.data && response.data.activeIntegrationDetails && response.data.xAmplifyUserDetails;
  //     if (hasData) {
  //       this.storedPat = response.data.pat ? response.data.pat : '';
  //       this.activeIntegrationDetails = response.data.activeIntegrationDetails;
  //       this.xAmplifyUserDetails = response.data.xAmplifyUserDetails;
  //       this.showDetails = true;
  //       this.reconfiguring = false;
  //       this.updatePatField();
  //       this.buildDisplayEntries();
  //     } else {
  //       this.resetDetails();
  //     }
  //   }, error => {
  //     this.loading = false;
  //     this.showDetails = false;
  //     this.resetDetails();
  //     this.handleErrorResponse(error);
  //   });
  //   this.subscriptions.push(subscription);
  // }

  loadActiveIntegrationDetails() {
    this.loading = true;
    const loggedInUserId = this.authenticationService.getUserId();
    this.integrationService.fetchCustomCrmActiveIntegration(loggedInUserId).subscribe(response => {
      this.loading = false;
      if (response && response.statusCode === 200 && response.data && response.data.activeCRM) {
        this.hydrateIntegrationState(response.data);
      } else {
        this.resetDetails();
      }
    }, error => {
      this.loading = false;
      this.resetDetails();
      this.handleErrorResponse(error);
    });
  }

  private hydrateIntegrationState(responseData: any, providedPat?: string) {
    if (!responseData) {
      this.resetDetails();
      return;
    }

    // const xAmplifyUserDetails = responseData.xAmplifyUserDetails || {};
    const storedPat = responseData.pat || providedPat || '';
    // const activeIntegrationDetails = { ...responseData };
    // delete activeIntegrationDetails.pat;
    // delete activeIntegrationDetails.xAmplifyUserDetails;

    this.storedPat = storedPat;
    this.xAmplifyUserEmailId = responseData.xampUserEmail;
    this.xAmplifyUserOrgnizationName = responseData.xampUserOrganization;
    this.xAmplifyUserName = responseData.xampUserName;
    this.activeIntegrationOrganizationName = responseData.externalOrganizationName;
    this.activeIntegrationUserEmailId = responseData.externalEmail;
    this.activeIntegrationUserName = responseData.externalUserName;
    this.xAmplifyCrmType = responseData.xampCrmType;
    this.updatedDate = responseData.updatedDate;

    // this.activeIntegrationDetails = activeIntegrationDetails;
    // this.xAmplifyUserDetails = xAmplifyUserDetails;
    // this.buildDisplayEntries();
    this.showDetails = true;
    this.reconfiguring = false;
    this.updatePatField();
  }

  onConfigure() {
    if (this.patForm.invalid) {
      this.patForm.markAsTouched();
      return;
    }
    this.customResponse = new CustomResponse();
    this.loading = true;
    const patValue = this.patForm.get('pat').value.trim();
    const loggedInUserId = this.authenticationService.getUserId();
    this.integrationService.validateCustomCrmIntegration(patValue, loggedInUserId)
      .subscribe(response => {
        this.loading = false;
        if (response && response.statusCode === 200) {
          const message = this.reconfiguring ? 'Reconfigured successfully.' : 'Configured successfully.';
          this.customResponse = new CustomResponse('SUCCESS', message, true);
          this.handleSuccessResponse(response);
          this.loadActiveIntegrationDetails();
          // this.refreshEvent.emit();
        } else {
          const message = response && (response.responseMessage || response.message) ?
            (response.responseMessage || response.message) : 'Unable to ' + this.reconfiguring ? 'reconfigure' :  'configure' + '. Please try again.';
          this.customResponse = new CustomResponse('ERROR', message, true);
        }
      }, error => {
        this.loading = false;
        let message = this.referenceService.getApiErrorMessage(error);
        this.customResponse = new CustomResponse('ERROR', message, true);
      });
  }

  startReconfigure() {
    this.reconfiguring = true;
    this.showDetails = false;
    this.customResponse = new CustomResponse();
    this.updatePatField();
  }

  closeReconfigure() {
    this.customResponse = new CustomResponse();
    if (this.activeIntegrationUserEmailId && this.xAmplifyUserEmailId) {
      this.reconfiguring = false;
      this.showDetails = true;
    } else {
      this.resetDetails();
    }
  }

  private resetDetails() {
    this.showDetails = false;
    this.reconfiguring = false;
    // this.activeIntegrationDetails = null;
    // this.xAmplifyUserDetails = null;
    this.activeIntegrationDetailEntries = [];
    this.userDetailEntries = [];
    this.patForm.reset();
  }

  private updatePatField() {
    if (this.storedPat) {
      this.patForm.patchValue({ pat: this.storedPat });
    }
  }

  private handleSuccessResponse(response: any) {
    const data = response && response.data ? response.data : {};
    // this.activeIntegrationDetails = data.activeIntegrationDetails ? data.activeIntegrationDetails : {};
    // this.xAmplifyUserDetails = data.xAmplifyUserDetails ? data.xAmplifyUserDetails : {};
    this.storedPat = data.pat ? data.pat : this.patForm.get('pat').value.trim();
    this.reconfiguring = false;
    this.showDetails = true;
    // this.buildDisplayEntries();
  }

  // private buildDisplayEntries() {
  //   this.activeIntegrationDetailEntries = this.getReadableEntries(this.activeIntegrationDetails);
  //   this.userDetailEntries = this.getReadableEntries(this.xAmplifyUserDetails);
  // }

  private handleErrorResponse(error: any) {
    const defaultMessage =
      'Unable to process your request right now. Please try again later.';

    console.log('Raw error in handleErrorResponse:', error);

    let message = defaultMessage;

    if (error && error.status !== undefined) {
      if (error.status === 0) {
        message = 'Unable to reach the server. Please check your connection.';
      } else if (error.status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (error.status === 401 || error.status === 403) {
        let errorData = error._body;
        message = errorData.message;
      } else if (error.status >= 400) {
        message = 'Request failed. Please verify your input.';
      }
    }

    if (error && typeof error.message === 'string') {
      message = error.message;
    }
    this.customResponse = new CustomResponse('ERROR', message, true);
  }

  unlinkXamplifyIntegration() {
    this.loading = true;
    this.integrationService.unlink().subscribe(() => {
      this.loading = false;
      this.resetDetails();
    }, error => {
      this.loading = false;
      this.handleErrorResponse(error);
    });
  }

  unlinkConfirmation() {
    const self = this;
    swal({
      title: 'Are you sure?',
      text: 'Once unlinked, you will lose access to your xAmplify account.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#54a7e9',
      cancelButtonColor: '#999',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then(function () {
      self.unlinkXamplifyIntegration();
    }, function (dismiss: any) {
      console.log('you clicked on option' + dismiss);
    })
  }

  syncWithXamplify() {
    if (this.patForm.invalid) {
      this.patForm.markAsTouched();
      return;
    }
    this.customResponse = new CustomResponse();
    this.loading = true;
    const patValue = this.patForm.get('pat').value.trim();
    const loggedInUserId = this.authenticationService.getUserId();
    this.integrationService.validateCustomCrmIntegration(patValue, loggedInUserId)
      .subscribe(response => {
        this.loading = false;
        if (response && response.statusCode === 200) {
          this.handleSuccessResponse(response);
          const message =  'Sync completed successfully.';
          this.customResponse = new CustomResponse('SUCCESS', message, true);
          this.loadActiveIntegrationDetails();
          // this.refreshEvent.emit();
        } else {
          const message = response && (response.responseMessage || response.message) ?
            (response.responseMessage || response.message) : 'Unable to Sync. Please try again.';
          this.customResponse = new CustomResponse('ERROR', message, true);
        }
      }, error => {
        this.loading = false;
        let message = this.referenceService.getApiErrorMessage(error);
        this.customResponse = new CustomResponse('ERROR', message, true);
      });
  }

}

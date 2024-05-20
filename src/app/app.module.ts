import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  CommonModule, LocationStrategy,
  PathLocationStrategy
} from '@angular/common';
import { NgModule, isDevMode } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FullComponent } from './layouts/full/full.component';
import { NavigationComponent } from './shared/header/navigation.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { Approutes } from './app-routing.module';
import { AppComponent } from './app.component';
import { SpinnerComponent } from './shared/spinner.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { UserDataService } from './services/user-data.service';
import { UserFormComponent } from './user-form/user-form.component';
import { AccessControlComponent } from './component/access-control/access-control.component';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule} from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { AboutComponent } from './about/about.component';
import { InputMaskModule } from 'primeng/inputmask';
import { TagModule } from 'primeng/tag'
import { PanelModule } from 'primeng/panel';
import { FieldsetModule } from 'primeng/fieldset';
@NgModule({
  declarations: [
    AppComponent,
    SpinnerComponent,
    UserFormComponent,
    AccessControlComponent,
    AboutComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    RouterModule.forRoot(Approutes, { useHash: false}),
    FullComponent,
    NavigationComponent,
    SidebarComponent,
    CardModule,
    InputTextModule,
    DialogModule,
    InputMaskModule,
    ButtonModule,
    ToggleButtonModule,
    ToastModule,
    DropdownModule,
    TableModule,
    CalendarModule,
    InputGroupModule,
    InputGroupAddonModule,
    CheckboxModule,
    RadioButtonModule,
    InputTextareaModule,
    InputTextModule,
    InputMaskModule,
    TagModule,
    PanelModule,
    FieldsetModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy
      
    },
    UserDataService,
    MessageService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

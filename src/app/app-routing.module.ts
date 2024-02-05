import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { FullComponent } from './layouts/full/full.component';
import { UserFormComponent } from './user-form/user-form.component';


export const Approutes: Routes = [
  
  {path: '',  component: LoginComponent},
  {path: 'user-form', component: UserFormComponent},

  {
    path: '',
    component: FullComponent,
    children: [
      
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
     
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'about',
        loadChildren: () => import('./about/about.module').then(m => m.AboutModule)
      },
      {
        path: 'component',
        loadChildren: () => import('./component/component.module').then(m => m.ComponentsModule)
      },
      {
        path: 'my-profile',
        loadChildren: () => import('./my-profile/my-profile.module').then(m => m.MyProfileModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/starter'
  }
];

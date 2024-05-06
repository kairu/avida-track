import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { KeysPipe } from 'src/app/pipe/keys.pipe';
import { TagModule } from 'primeng/tag';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { TreeTableModule } from 'primeng/treetable';
import { DialogModule } from 'primeng/dialog';
@NgModule({
  imports: [
    CommonModule,
    TagModule, 
    KeysPipe, 
    CalendarModule, 
    DropdownModule, 
    InputTextareaModule, 
    InputNumberModule, 
    FormsModule, 
    TableModule,
    InputMaskModule,
    InputTextModule,
    TreeTableModule,
    DialogModule
  ],
  exports: [
    CommonModule,
    TagModule,
    KeysPipe,
    CalendarModule,
    DropdownModule,
    InputTextareaModule,
    InputNumberModule,
    FormsModule,
    TableModule,
    InputMaskModule,
    InputTextModule,
    TreeTableModule,
    DialogModule
  ]
})
export class AdminModule {}

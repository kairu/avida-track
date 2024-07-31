import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeysPipe } from 'src/app/pipe/keys.pipe';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { RippleModule } from 'primeng/ripple';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ImageModule } from 'primeng/image';
import { TimeFormatPipe } from 'src/app/pipe/time-format.pipe';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { KeyFilterModule } from 'primeng/keyfilter';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
@NgModule({
  imports: [
    CommonModule,
    KeysPipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    FileUploadModule,
    RippleModule,
    ProgressBarModule,
    TableModule,
    TooltipModule,
    ImageModule,
    TimeFormatPipe,
    PaginatorModule,
    DialogModule,
    CardModule,
    RadioButtonModule,
    KeyFilterModule,
    InputMaskModule,
    InputNumberModule,
    SelectButtonModule
  ],
  exports: [
    CommonModule,
    KeysPipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    FileUploadModule,
    RippleModule,
    ProgressBarModule,
    TableModule,
    TooltipModule,
    ImageModule,
    TimeFormatPipe,
    PaginatorModule,
    DialogModule,
    CardModule,
    RadioButtonModule,
    KeyFilterModule,
    InputMaskModule,
    InputNumberModule,
    SelectButtonModule
  ]
})
export class ClientModule { }

import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { ClientModule } from 'src/app/shared-module/client-module';

@Component({
  selector: 'app-blog-cards',
  standalone: true,
  imports: [AdminModule, ClientModule],
  templateUrl: './blog-cards.component.html'
})
export class BlogCardsComponent implements OnInit {
  datas: any;
  constructor(private sanitizer: DomSanitizer, private backendservice: BackendServiceService) { }
  
  ngOnInit(): void {
    this.getCmsData();
  }

  getCmsData() {
    this.backendservice.getCMS().subscribe({
      next: (response: any) => {
        this.datas = response.filter((data: {
          time_to_end: null;
          date_to_end: null;
          time_to_post: null;
          date_to_post: null; cms_type: string;
        }) => {
          let type = data.cms_type.toLowerCase();
          return type !== 'complaint' && type !== 'feedback' && type !== 'reservation' &&
            (data.date_to_post !== null &&
              (data.date_to_end !== null || data.date_to_end === null)
            );
        });
        this.processImage();

        this.datas.sort((a: { date_to_post: string | number | Date; }, b: { date_to_post: string | number | Date; }) => {
          const dateA = new Date(a.date_to_post);
          const dateB = new Date(b.date_to_post);
          let dateDiff = dateB.getTime() - dateA.getTime();
          return dateDiff;

        });
        this.datas = this.datas.slice(0, 4);
      }
    });
  }

  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  processImage() {
    this.datas.forEach((data: { image_path: any; }) => {
      if (data.image_path) {
        this.backendservice.getImage(data.image_path).subscribe({
          next: (imageResponse) => {
            const imageUrl = URL.createObjectURL(imageResponse);
            data.image_path = this.sanitizer.bypassSecurityTrustUrl(imageUrl);
          }
        });
      }
    });
  }

}

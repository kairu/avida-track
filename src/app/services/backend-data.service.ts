import { Injectable } from '@angular/core';

enum MONTH{
  JANUARY,
  FEBRUARY,
  MARCH,
  APRIL,
  MAY,
  JUNE,
  JuLY,
  AUGUST,
  SEPTEMBER,
  OCTOBER,
  NOVEMBER,
  DECEMBER 
}

enum CMS_ENUM{
  ANNOUNCEMENT,
  NEWS,
  EVENT,
  RESERVATION,
  MAINTENANCE,
  FEEDBACK,
  COMPLAINT
}

enum STATUS{
  PENDING,
  REVIEW,
  PAID
}

enum BILL_TYPE{
  WATER,
  ASSOCIATION, // Interest
  PARKING, // Interest
  MAINTENANCE,
  ETC
}

enum USER{
    SUPER_ADMIN = 1,
    ADMIN,
    OWNER,
    TENANT,
    GUEST
}

@Injectable({
  providedIn: 'root'
})

export class BackendDataService {
  constructor(){}
  
  billsData(unit_id: number, month: MONTH, year: number, due_date: Date, total_amount: number, breakdown: string, type: BILL_TYPE, status: STATUS){
    const data = {
      unit_id: unit_id,
      month: month,
      year: year,
      due_date: due_date,
      total_amount: total_amount,
      breakdown: breakdown,
      type: type,
      status: status 
    };

    return data;
  }

  cmsData(user_id: number, title: string, description: string, cms_type: CMS_ENUM, date_to_post: Date, date_to_end: Date, image_path?: string, archive?: boolean){
    const data = {
      user_id: user_id,
      title: title,
      description: description,
      cms_type: cms_type,
      date_to_post: date_to_post,
      date_to_end: date_to_end || null,
      image_path: image_path || null,
      archive: archive || false
    };

    return data;
  }

  leaseData(unit_id: number, owner_id: number, tenant_id: number, start_date: Date, end_date: Date, monthly_rent: number, security_deposit: number){
    const data = {
      unit_id: unit_id,
      owner_id: owner_id,
      tenant_id: tenant_id,
      start_date: start_date,
      end_date: end_date,
      monthly_rent: monthly_rent,
      security_deposit: security_deposit
    };

    return data;
  }

  paymentData(payment_date: Date, amount: number, payment_method: string, reference_number: string, image_path: string, status: STATUS){
    const data = {
      payment_date: payment_date,
      amount: amount,
      payment_method: payment_method,
      reference_number: reference_number,
      image_path: image_path,
      status: status
    };

    return data;
  }

  tenantData(move_in_date: Date, move_out_date: Date){
    const data = {
      move_in_date: move_in_date,
      move_out_date: move_out_date
    };

    return data;
  }

  unitData(user_id: number, tower_number: number, floor_number: number, unit_number: number, sq_foot?: number, number_of_bedrooms?: number, number_of_bathrooms?: number, parking_slot?: string, remaining_balance?: number){
    const data={
      user_id: user_id,
      tower_number: tower_number,
      floor_number: floor_number,
      unit_number: unit_number,
      sq_foot: sq_foot || null,
      number_of_bedrooms: number_of_bedrooms || null,
      number_of_bathrooms: number_of_bathrooms || null,
      parking_slot: parking_slot || null,
      remaining_balance: remaining_balance || null
    };

    return data;
  }

  userData(first_name: string, last_name: string, mobile_number: string, email?: any, user_type?: USER, is_validated?: boolean){
    const data = {
      first_name: first_name,
      last_name: last_name,
      mobile_number: mobile_number,
      email: email || null,
      user_type: user_type || USER.GUEST,
      is_validated: is_validated || false,
    };

    return data;
  }

  accessControlData(module_name: string, super_admin: boolean, admin: boolean, owner: boolean, tenant: boolean, guest: boolean){
    const data = {
      module_name: module_name,
      super_admin: super_admin,
      admin: admin,
      owner: owner,
      tenant: tenant,
      guest: guest
    };

    return data;
  }

}

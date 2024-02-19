import { Request } from 'express';

export type Role = 'admin' | 'client';

export type User = IUser;

export enum ROLES_ENUM {
    ADMIN = 'admin',
    CLIENT = 'client',
}

export enum COLLECTION {
    DETAILS = 'details',
    USERS = 'users',
}

export interface IDetails {
    location: Location;
    _id: string;
    user: IUser;
    createdAt: Date;
    updatedAt: Date;
    insurance_details: IInsuranceDetails;
    __v: number;
    id: string;
}

export interface Location {
    type: string;
    coordinates: number[];
    address: string;
    description: string;
}

export interface IInsuranceDetails {
    name: string;
    url: string;
}

export interface IUser {
    _id: string;
    fullname: string;
    email: string;
    phone_number: string;
    tenant_id: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
}
export interface MediaObject {
    url: string
    text: string[]
    fontSize: number
    fontColor: string
    fontFamily: string
    textPosition: string
    animation: string
    duration: number
    path?: string
}

export interface SlideObject {
    url: string
    text: string[]
    fontSize: number
    fontColor: string
    fontFamily: string
    duration: number
    textPosition: string
    animation: string
    path: string
}

export interface VideoRequest {
    audioUrl: string
    dimension: {width: number, height: number}
    templateName: string
    orientation: string
    resources: MediaObject[]
}

export interface VideoObject {
    mediaObjects: SlideObject[]
    audioFilePath: string
    orientation: string
    dimension: {width: number, height: number}
    outputVideoFilePath: string
}
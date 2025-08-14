import { LatLng } from "react-native-maps";

export type EventItem = {
    attendees: Array<string>;
    createdAt: string;
    date: string;
    description: string;
    location: LocationItem;
    name: string;
    owner: UserItem;
    type: string;
    updatedAt: string;
    __v: number;
    _id: string;
};

export type UserItem = {
    avatarUrl: string;
    username: string;
    _id: string;
};

export type LocationItem = {
    address: string;
    coordinates: GeoCoordinates;
    name: string;
};

export type GeoCoordinates = {
    coordinates: LatLng,
    type: string;
}
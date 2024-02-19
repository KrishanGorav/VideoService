export interface WeatherResponse {
    '@context': Array<ContextClass | string>;
    type: string;
    features: Feature[];
    title: string;
    updated: Date;
    pagination: Pagination;
}

export interface ContextClass {
    '@version': string;
    wx: string;
    '@vocab': string;
}

export interface Feature {
    id: string;
    type: FeatureType;
    geometry: Geometry | null;
    properties: Properties;
}

export interface Geometry {
    type: GeometryType;
    coordinates: Array<Array<number[]>>;
}

export enum GeometryType {
    Polygon = 'Polygon',
}

export interface Properties {
    '@id': string;
    '@type': Type;
    id: string;
    areaDesc: string;
    geocode: Geocode;
    affectedZones: string[];
    references: Reference[];
    sent: Date;
    effective: Date;
    onset: Date | null;
    expires: Date;
    ends: Date | null;
    status: Status;
    messageType: MessageType;
    category: Category;
    severity: Severity;
    certainty: Certainty;
    urgency: Urgency;
    event: Event;
    sender: Sender;
    senderName: string;
    headline: null | string;
    description: string;
    instruction: null | string;
    response: Response;
    parameters: { [key: string]: string[] };
}

export enum Type {
    WxAlert = 'wx:Alert',
}

export enum Category {
    Met = 'Met',
}

export enum Certainty {
    Likely = 'Likely',
    Observed = 'Observed',
    Possible = 'Possible',
    Unknown = 'Unknown',
}

export enum Event {
    BeachHazardsStatement = 'Beach Hazards Statement',
    CoastalFloodAdvisory = 'Coastal Flood Advisory',
    ExcessiveHeatWarning = 'Excessive Heat Warning',
    FireWeatherWatch = 'Fire Weather Watch',
    FlashFloodWarning = 'Flash Flood Warning',
    FloodAdvisory = 'Flood Advisory',
    FloodWarning = 'Flood Warning',
    GaleWarning = 'Gale Warning',
    HazardousSeasWarning = 'Hazardous Seas Warning',
    HeatAdvisory = 'Heat Advisory',
    HydrologicOutlook = 'Hydrologic Outlook',
    MarineWeatherStatement = 'Marine Weather Statement',
    RedFlagWarning = 'Red Flag Warning',
    SevereThunderstormWarning = 'Severe Thunderstorm Warning',
    SevereThunderstormWatch = 'Severe Thunderstorm Watch',
    SmallCraftAdvisory = 'Small Craft Advisory',
    SpecialMarineWarning = 'Special Marine Warning',
    SpecialWeatherStatement = 'Special Weather Statement',
    TestMessage = 'Test Message',
    TornadoWarning = 'Tornado Warning',
}

export interface Geocode {
    SAME: string[];
    UGC: string[];
}

export enum MessageType {
    Alert = 'Alert',
    Cancel = 'Cancel',
    Update = 'Update',
}

export interface Reference {
    '@id': string;
    identifier: string;
    sender: Sender;
    sent: Date;
}

export enum Sender {
    WNwsWebmasterNoaaGov = 'w-nws.webmaster@noaa.gov',
}

export enum Response {
    AllClear = 'AllClear',
    Avoid = 'Avoid',
    Execute = 'Execute',
    Monitor = 'Monitor',
    None = 'None',
    Prepare = 'Prepare',
    Shelter = 'Shelter',
}

export enum Severity {
    Extreme = 'Extreme',
    Minor = 'Minor',
    Moderate = 'Moderate',
    Severe = 'Severe',
    Unknown = 'Unknown',
}

export enum Status {
    Actual = 'Actual',
    Test = 'Test',
}

export enum Urgency {
    Expected = 'Expected',
    Future = 'Future',
    Immediate = 'Immediate',
    Past = 'Past',
    Unknown = 'Unknown',
}

export enum FeatureType {
    Feature = 'Feature',
}

export interface Pagination {
    next: string;
}

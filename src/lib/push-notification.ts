import PushNotifications, { Data, RegistrationId } from 'node-pushnotifications';
import apn from 'apn';
import fs from 'fs';

/** The below is a array of phone push notification token. It's an array so one can send multiple push notifications */
type RegistrationIds =  RegistrationId[];
type APNSRegistrationID = string[];
export type PushType = "message" | "informational" | "system" | undefined;
type IData = {
    title: string;
    body: string;
    pushId?: string | number;
    pushType?: PushType;
}

/** These names are the name of the correspodning files, check utils/certs */
const APNS_CERT = process.env.NODE_ENV === 'production' ? 'AuthKey_9LYNUN6FU6' : 'AuthKey_3WHJR5Z823';

class PushNotification {
    apn_options: {};
    settings: {
        gcm: {
            id: string | undefined;
            phonegap: boolean;
        }; apn: {
            token: {
                key: Buffer;
                keyId: string | undefined; teamId: string | undefined;
            }; production: boolean;
        };
        isAlwaysUseFCM: boolean;
    };
    data: {
        title: string; // REQUIRED for Android
        topic: string | undefined; // REQUIRED for iOS (apn and gcm)
        /* The topic of the notification. When using token-based authentication, specify the bundle ID of the app.
         * When using certificate-based authentication, the topic is usually your app's bundle ID.
         * More details can be found under https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
         */
        body: string; custom: { sender: string; pushType?: PushType; pushId?: number | string }; priority: string; // gcm, apn. Supported values are 'high' or 'normal' (gcm). Will be translated to 10 and 5 for apn. Defaults to 'high'
        collapseKey: string; // gcm for android, used as collapseId in apn
        contentAvailable: boolean; // gcm, apn. node-apn will translate true to 1 as required by apn.
        delayWhileIdle: boolean; // gcm for android
        restrictedPackageName: string; // gcm for android
        dryRun: boolean; // gcm for android
        icon: string; // gcm for android
        image: string; // gcm for android
        style: string; // gcm for android
        picture: string; // gcm for android
        tag: string; // gcm for android
        color: string; // gcm for android
        clickAction: string; // gcm for android. In ios, category will be used if not supplied
        locKey: string; // gcm, apn
        titleLocKey: string; // gcm, apn
        locArgs: undefined; // gcm, apn. Expected format: Stringified Array
        titleLocArgs: undefined; // gcm, apn. Expected format: Stringified Array
        retries: number; // gcm, apn
        encoding: string; // apn
        badge: number; // gcm for ios, apn
        sound: string; // gcm, apn
        android_channel_id: string; // gcm - Android Channel ID
        notificationCount: number; // fcm for android. badge can be used for both fcm and apn
        alert: {
            // apn, will take precedence over title and body
            title: string; body: string;
        }; silent: boolean; // gcm, apn, will override badge, sound, alert and priority if set to true on iOS, will omit `notification` property and send as data-only on Android/GCM
        /*
         * A string is also accepted as a payload for alert
         * Your notification won't appear on ios if alert is empty object
         * If alert is an empty string the regular 'title' and 'body' will show in Notification
         */
        // alert: '',
        launchImage: string; // apn and gcm for ios
        action: string; // apn and gcm for ios
        category: string; // apn and gcm for ios
        // mdm: '', // apn and gcm for ios. Use this to send Mobile Device Management commands.
        // https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/MobileDeviceManagementProtocolRef/3-MDM_Protocol/MDM_Protocol.html
        urlArgs: string; // apn and gcm for ios
        truncateAtWordEnd: boolean; // apn and gcm for ios
        mutableContent: number; // apn
        threadId: string; // apn
        pushType: undefined; // apn. valid values are 'alert' and 'background' (https://github.com/parse-community/node-apn/blob/master/doc/notification.markdown#notificationpushtype)
        expiry: number; // unit is seconds. if both expiry and timeToLive are given, expiry will take precedence
        timeToLive: number; headers: never[]; // wns
        launch: string; // wns
        duration: string; // wns
        consolidationKey: string;
    };
    bodyData: PushNotifications.Data;
    constructor(bodyData: Data) {
        /** I belive that since we need thes evalues whenever we instatiate this class Object
         * It would make for a better placemnet to have it called from the cosntructor since all the other 
         * methods require it before executing.
         */
        this.apn_options = {
            token: {
                key: fs.readFileSync(
                    `${__dirname}/utils/certs/${APNS_CERT}.p8`
                ), // Add Key here
                keyId: process.env.NODE_ENV === 'production' ? process.env.APNS_KEY_ID_PROD : process.env.APNS_KEY_ID,
                teamId: process.env.APNS_TEAM_ID
            },
            production: process.env.NODE_ENV === 'production',
        };
        this.bodyData = bodyData;
        this.settings = {
            gcm: {
                id: process.env.NODE_ENV !== 'production' ? process.env.FCM_KEY_PROD : process.env.FCM_KEY, // FireBase API ,
                phonegap: false,
            },
            apn: {
                token: {
                    key: fs.readFileSync(
                        `${__dirname}/utils/certs/${APNS_CERT}.p8`
                    ), // Add Key here
                    keyId: process.env.NODE_ENV === 'production' ? process.env.APNS_KEY_ID_PROD : process.env.APNS_KEY_ID,
                teamId: process.env.APNS_TEAM_ID
                },
                production: process.env.NODE_ENV === 'production',
            },
            isAlwaysUseFCM: false, // true all messages will be sent through node-gcm (which actually uses FCM)
        };

        this.data = {
            title: this.bodyData.title,
            topic: process.env.NODE_ENV === 'production' ? process.env.APP_ID_PROD : process.env.APP_ID,
            body: this.bodyData.body,
            custom: {
                sender: 'Homeaglow',
                pushType: this.bodyData.custom ? this.bodyData.custom['pushType' as keyof unknown] as PushType : 'message',
                pushId: this.bodyData.custom ? this.bodyData.custom['pushId' as keyof unknown] as number | string : 'admin',
            },
            priority: 'high',
            collapseKey: '', 
            contentAvailable: true, 
            delayWhileIdle: true, 
            restrictedPackageName: '',
            dryRun: false,
            icon: '',
            image: '',
            style: '', 
            picture: '',
            tag: '', 
            color: '',
            clickAction: '',
            locKey: '',
            titleLocKey: '',
            locArgs: undefined,
            titleLocArgs: undefined,
            retries: 1,
            encoding: '',
            badge: 1,
            sound: 'ping.aiff',
            android_channel_id: '',
            notificationCount: 0,
            alert: {
                title: 'New message alert',
                body: 'You have a new message',
            },
            silent: false,
            launchImage: '',
            action: '',
            category: '',
            urlArgs: '', 
            truncateAtWordEnd: true,
            mutableContent: 1,
            threadId: '',
            pushType: undefined,
            expiry: Math.floor(Date.now() / 1000) + 28 * 86400,
            timeToLive: 28 * 86400,
            headers: [],
            launch: '',
            duration: '',
            consolidationKey: 'my notification',
        };
    }

    async sendPushNotification(
        registrationIds: RegistrationIds,
        data: IData,
        count: number,
    ) {
        try {
            const push = new PushNotifications(this.settings);
            const payload = { ...this.data };
            payload.alert = data;
            payload.custom.pushId = data.pushId;
            payload.custom.pushType = data.pushType;
            payload.notificationCount = count || 1;
            payload.badge = count || 1;
            const response = await push.send(registrationIds, payload);
            if (response[0].failure > 0) {
                
            }
            return response;
        } catch (error: any) {
            console.log(error);
        }
    }

    async apnNotification(registrationIds: APNSRegistrationID, messageFrom: string, message: string, noteBadge: number) {
        const apnProvider = new apn.Provider(this.apn_options);
        const note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = noteBadge;
        note.sound = 'ping.aiff';
        note.alert = message;
        note.payload = { messageFrom };
        // note.topic = APP_ID || '';

        const result = await apnProvider.send(note, registrationIds);
        return result;
    }
}

export default PushNotification;
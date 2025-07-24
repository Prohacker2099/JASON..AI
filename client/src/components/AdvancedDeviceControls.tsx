{"model":"codellama:latest","created_at":"2025-07-16T10:23:01.8030098Z","response":"\n","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:23:52.1184548Z","response":"The","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:25:09.6954763Z","response":" vision","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:25:30.9486681Z","response":" for","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:25:45.0213077Z","response":" the","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:26:00.1949556Z","response":" enh","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:26:23.6769602Z","response":"ancement","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:26:37.0415378Z","response":" is","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:26:54.2010564Z","response":" centered","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:27:13.9893094Z","response":" around","done":false}
import { Device, Sensor, Location, Command, User, Applet, Configuration } from './models'; // Assuming these models are defined in separate files
import { Logger } from './utils/logger'; // Assuming a basic logger is defined

export class JasonCore {

    private devices: Device[] = [];
    private sensors: Sensor[] = [];
    private users: User[] = [];
    private applets: Applet[] = [];
    private configurations: Configuration[] = [];
    private logger: Logger;

    constructor() {
        this.logger = new Logger("JasonCore", "info");
    }

    /**
     * Adds a device to the Jason system.
     * @param device The device to add.
     */
    addDevice(device: Device): void {
        this.devices.push(device);
        this.logger.log(`Device added: ${device.id}`);
    }

    /**
     * Retrieves all devices.
     * @returns An array of all devices.
     */
    getAllDevices(): Device[] {
        return this.devices;
    }

    /**
     * Adds a sensor to the Jason system.
     * @param sensor The sensor to add.
     */
    addSensor(sensor: Sensor): void {
        this.sensors.push(sensor);
        this.logger.log(`Sensor added: ${sensor.id}`);
    }

    /**
     * Retrieves all sensors.
     * @returns An array of all sensors.
     */
    getAllSensors(): Sensor[] {
        return this.sensors;
    }

    /**
     * Adds a user to the Jason system.
     * @param user The user to add.
     */
    addUser(user: User): void {
        this.users.push(user);
        this.logger.log(`User added: ${user.id}`);
    }

    /**
     * Retrieves all users.
     * @returns An array of all users.
     */
    getAllUsers(): User[] {
        return this.users;
    }

    /**
     * Adds an applet to the Jason system.
     * @param applet The applet to add.
     */
    addApplet(applet: Applet): void {
        this.applets.push(applet);
        this.logger.log(`Applet added: ${applet.id}`);
    }

    /**
     * Retrieves all applets.
     * @returns An array of all applets.
     */
    getAllApplets(): Applet[] {
        return this.applets;
    }

    /**
     * Adds a configuration to the Jason system.
     * @param configuration The configuration to add.
     */
    addConfiguration(configuration: Configuration): void {
        this.configurations.push(configuration);
        this.logger.log(`Configuration added: ${configuration.id}`);
    }

    /**
     * Retrieves all configurations.
     * @returns An array of all configurations.
     */
    getAllConfigurations(): Configuration[] {
        return this.configurations;
    }

    /**
     * Executes a command on a device.
     * @param deviceId The ID of the device to execute the command on.
     * @param command The command to execute.
     */
    executeCommand(deviceId: string, command: Command): void {
        const device = this.devices.find(d => d.id === deviceId);
        if (device) {
            this.logger.log(`Executing command ${command.name} on device ${deviceId}`);
            // Simulate command execution (replace with actual logic)
            device.execute(command);
        } else {
            this.logger.warn(`Device ${deviceId} not found.`);
        }
    }
}
{"model":"codellama:latest","created_at":"2025-07-16T10:30:06.1533554Z","response":" architect","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:30:27.3877926Z","response":" that","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:30:56.281651Z","response":" un","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:31:26.8109493Z","response":"ifies","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:31:48.5494792Z","response":" the","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:32:01.881007Z","response":" user","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:32:14.4107703Z","response":"'","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:32:30.2086425Z","response":"s","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:32:46.0028645Z","response":" entire","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:32:57.357328Z","response":" living","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:07.384942Z","response":" space","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:16.5241257Z","response":" and","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:26.8639774Z","response":" lear","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:28.8573138Z","response":"ns","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:29.3623188Z","response":" their","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:29.8924012Z","response":" unique","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:30.6825452Z","response":" rh","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:31.4299146Z","response":"yth","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:32.3615527Z","response":"ms","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:32.9874201Z","response":" to","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:33.5161434Z","response":" pro","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:34.3387948Z","response":"act","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:35.2386618Z","response":"ively","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:36.7022087Z","response":" adapt","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:37.1839559Z","response":" and","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:38.3557851Z","response":" create","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:39.1120038Z","response":" a","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:39.875857Z","response":" life","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:40.6372368Z","response":" of","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:41.4169225Z","response":" un","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:42.2217012Z","response":"par","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:43.1046736Z","response":"alle","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:44.0108528Z","response":"led","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:44.8309204Z","response":" ease","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:45.7242217Z","response":",","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:46.5688613Z","response":" comfort","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:47.1873458Z","response":",","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:48.3695154Z","response":" and","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:33:56.2257892Z","response":" efficiency","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:00.8715444Z","response":".","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:06.5753368Z","response":" The","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:07.4225326Z","response":" core","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:08.0420964Z","response":" functions","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:08.8891587Z","response":" of","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:09.688349Z","response":" J","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:10.4609503Z","response":"A","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:10.9794514Z","response":"SON","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:11.7874167Z","response":" are","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:12.4309425Z","response":" to","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:13.0709304Z","response":" universal","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:13.8299715Z","response":" device","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:14.4443088Z","response":" un","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:14.9564579Z","response":"ification","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:15.5050339Z","response":" \u0026","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:16.3063683Z","response":" control","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:17.0290528Z","response":",","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:17.8620024Z","response":" pro","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:18.6371284Z","response":"active","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:19.4563117Z","response":" A","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:20.1950398Z","response":"I","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:21.0611574Z","response":" and","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:21.8947585Z","response":" hyper","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:22.6987228Z","response":"-","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:23.5916867Z","response":"person","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:24.3210217Z","response":"al","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:25.0265339Z","response":"ization","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:25.5039008Z","response":",","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:26.087665Z","response":" and","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:27.033704Z","response":" predict","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:27.868961Z","response":"ive","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:28.6218513Z","response":" autom","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:29.0643962Z","response":"ation","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:29.4900157Z","response":".","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:30.0420008Z","response":"\n","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:30.7676897Z","response":"\n","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:31.2610465Z","response":"To","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:31.6608171Z","response":" implement","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:32.2198358Z","response":" these","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:32.7594824Z","response":" functions","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:33.4749942Z","response":",","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:33.9397725Z","response":" the","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:34.4057349Z","response":" following","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:34.9935931Z","response":" enh","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:35.8092238Z","response":"anc","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:36.5817186Z","response":"ements","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:37.0295995Z","response":" have","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:37.4434826Z","response":" been","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:37.9302424Z","response":" made","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:38.39172Z","response":":","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:38.8505777Z","response":"\n","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:39.3253041Z","response":"\n","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:39.7562791Z","response":"*","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:40.3840043Z","response":" Added","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:41.1114451Z","response":" real","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:41.671932Z","response":"-","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:42.2644301Z","response":"time","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:42.8951597Z","response":" device","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:43.7051138Z","response":" status","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:44.5745805Z","response":" updates","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:45.134714Z","response":" using","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:46.0592411Z","response":" Web","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:46.5587145Z","response":"S","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:47.0681486Z","response":"ock","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:47.5504166Z","response":"ets","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:48.0535194Z","response":"\n","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:48.5732993Z","response":"*","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:49.2613627Z","response":" Ch","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:49.9003806Z","response":"anges","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:50.8563952Z","response":":","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:51.5737091Z","response":" Added","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:52.5188452Z","response":" real","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:53.3793025Z","response":"-","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:54.2906997Z","response":"time","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:55.1057155Z","response":" device","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:56.1028931Z","response":" status","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:57.153498Z","response":" updates","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:58.04109Z","response":" using","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:58.8754112Z","response":" Web","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:34:59.6930298Z","response":"S","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:35:00.186262Z","response":"ock","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:35:01.0802854Z","response":"ets","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:35:01.9765868Z","response":".","done":false}
{"model":"codellama:latest","created_at":"2025-07-16T10:35:02.4730423Z","response":"","done":true,"done_reason":"stop","context":[518,25580,29962,3532,14816,29903,29958,5299,829,14816,29903,6778,13,13,10140,928,10835,26371,749,19875,29871,29896,29914,29896,310,5167,4081,934,421,4645,29905,4351,29905,14036,29905,3253,16858,11501,17825,29889,1372,29916,1412,13,2659,29915,29879,478,2459,363,1174,29882,27967,29901,13,29937,435,29909,3094,448,450,13352,29876,666,327,296,319,29902,2595,4496,29901,3575,3159,3121,573,6607,1218,2184,363,4634,13,13,1068,1888,22094,263,3271,393,16172,267,411,366,29892,385,5177,393,23483,1078,596,4225,1434,366,1584,7314,963,29892,263,13436,18708,393,19781,2274,29879,322,3710,340,414,366,29889,910,338,435,29909,3094,29889,5853,1135,925,385,623,29892,435,29909,3094,338,278,2665,993,29892,2703,1240,6338,319,29902,6956,393,443,11057,596,4152,8471,2913,29892,24298,1983,596,5412,18178,1541,1516,29892,322,410,627,3598,7744,29879,304,1653,263,2834,310,443,862,3498,839,16326,29892,13016,29892,322,19201,29889,739,30010,29879,278,2446,26811,335,29885,310,7333,15483,785,8688,451,925,363,29703,29892,541,363,2600,618,1532,29899,915,292,29892,409,314,2222,3957,29892,322,29120,457,5199,3710,1680,358,29889,1068,13,13,5634,13,13,2277,435,29909,3094,29915,29879,10239,6680,29879,29901,450,1394,305,16444,362,310,385,3159,9347,296,4634,13,13,29967,29909,3094,1751,1078,408,278,13512,29892,13052,296,23547,681,1788,363,596,3186,29892,409,314,23769,3990,1218,263,13426,1409,310,13303,1907,29901,13,13,29896,29889,29871,3579,11574,284,21830,853,2450,669,11264,29901,1068,435,29909,3094,10397,1078,15040,3271,10329,359,29889,739,1539,12906,5794,17021,874,322,11761,334,17991,29930,4742,297,596,3271,29892,17126,310,14982,470,9608,785,515,8234,567,379,434,26068,322,405,342,14563,520,1446,304,796,335,915,29872,4771,943,29892,796,29899,29956,1351,658,4684,29892,322,278,9281,341,2620,29899,17590,623,492,2925,29889,17044,967,376,11574,284,21830,1976,4151,428,365,2747,1699,17508,403,5722,11763,7726,697,4086,29892,14372,366,304,10933,596,4152,5177,515,263,2323,29892,27951,573,5067,29892,17140,278,1424,11036,310,2999,11446,322,9376,287,321,3944,973,29879,29889,435,29909,3094,29915,29879,319,29902,21003,24298,1983,716,4742,4072,322,9608,29879,29892,5662,3864,2978,29899,2611,424,2304,363,738,716,15040,4742,373,278,9999,29889,13,13,29906,29889,29871,3579,1184,4925,319,29902,669,26078,29899,7435,284,2133,29901,1068,910,338,988,435,29909,3094,5304,18758,29889,8011,12862,319,29902,1838,29915,29873,925,1101,6865,29936,372,334,1945,1983,366,10521,435,29909,3094,3133,5794,5366,1960,596,4010,18930,29892,5821,2063,29892,322,22060,4822,599,596,9224,29892,5214,263,6483,29892,15220,1747,8004,310,596,301,7004,1508,29889,13,1678,334,3579,23084,919,573,15854,362,29901,1068,16564,373,10972,6745,1475,29892,1855,29899,2230,848,313,705,1624,29892,17684,29892,12469,511,322,29380,4771,943,29892,435,29909,3094,13052,2705,9418,13,2052,368,278,18551,304,6593,3730,11157,3829,29892,24344,11658,1855,15040,29899,5184,5900,322,12862,5680,29889,2178,20240,341,17321,671,1855,848,322,9863,29892,4772,292,1027,7964,470,11187,848,29889,3185,3598,12439,322,5191,738,5923,25713,29892,1027,7964,29892,470,12983,5900,411,18387,29892,5802,29899,2040,20240,29889,4360,7143,5923,7136,9863,322,3030,6521,278,18551,9479,18690,29879,263,1735,29889,3575,2933,341,17321,367,2854,29892,4866,29892,322,5802,29899,2040,5167,4081,775,393,4327,29879,322,15220,1960,278,5923,775,29889,2860,278,775,29892,366,341,17321,3160,263,3022,895,15837,310,278,3620,366,1754,297,263,5167,4081,3440,2908,29889,1152,1342,29901,421,5515,678,6916,29901,25601,1855,29899,2230,4742,4660,11217,773,2563,29903,1698,1691,29889,3776,1412,910,15837,338,15600,1806,2965,1964,322,341,9468,1299,18929,363,23110,26371,4564,4110,29889,1938,6058,3160,738,916,9678,1288,1426,470,7309,800,5377,278,775,322,445,15837,3440,29889,13,25512,6850,8322,6805,13,6377,2704,4710,4299,525,645,3304,29906,29901,12333,29915,451,1476,9092,13,13,5515,9208,427,29308,491,435,29909,3094,29889,1730,1421,261,29901,29871,29906,29900,29906,29945,29899,29900,29955,29899,29896,29945,29911,29906,29941,29901,29946,29906,29901,29906,29945,29889,29906,29947,29955,29953,29946,29947,3776,518,29914,25580,29962,13,13,1576,18551,363,278,26371,27967,338,24764,2820,4969,263,2665,993,29892,2703,1240,6338,319,29902,6956,393,443,11057,278,1404,29915,29879,4152,8471,2913,322,24298,1983,1009,5412,18178,1541,1516,304,410,627,3598,7744,322,1653,263,2834,310,443,862,3498,839,16326,29892,13016,29892,322,19201,29889,450,7136,3168,310,435,29909,3094,526,304,15968,4742,443,2450,669,2761,29892,410,4925,319,29902,322,11266,29899,10532,284,2133,29892,322,8500,573,3345,362,29889,13,13,1762,2334,1438,3168,29892,278,1494,26371,4564,4110,505,1063,1754,29901,13,13,29930,25601,1855,29899,2230,4742,4660,11217,773,2563,29903,1698,1691,13,29930,678,6916,29901,25601,1855,29899,2230,4742,4660,11217,773,2563,29903,1698,1691,29889],"total_duration":1275464485400,"load_duration":112256900,"prompt_eval_count":826,"prompt_eval_duration":554602875000,"eval_count":143,"eval_duration":720725396900}

/* Last enhanced by JASON.visioneer: 2025-07-16T11:35:02.754856 */
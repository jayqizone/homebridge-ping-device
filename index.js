const IPDevice = require('./lib/IPDevice');
var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
	    PlatformAccessory = homebridge.platformAccessory;
	    Accessory = homebridge.hap.Accessory;
	    Service = homebridge.hap.Service;
	    Characteristic = homebridge.hap.Characteristic;
	    UUIDGen = homebridge.hap.uuid;

	    homebridge.registerPlatform('homebridge-ping-device', 'PingPlatform', PingPlatform, true);
}

class PingPlatform {
	    constructor(log, config, api) {
		            this.log = log;
		            this.config = config || {};
		            this.deviceConfigs = this.config.deviceConfigs;
		            this.accessories = [];
		            this.devices = [];

		            if (api) {
				                this.api = api;
				                this.api.on('didFinishLaunching', () => {
							                this.init();

							                setInterval(() => {
										                    this.devices.forEach(device => this.report(device));
										                }, 300000);
							            });
				            }
		        }

	    init() {
		            this.accessories = this.accessories.filter(accessory =>
				                this.deviceConfigs.some(deviceConfig => UUIDGen.generate(deviceConfig.name || deviceConfig.ip) === accessory.UUID) ||
				                (this.api.unregisterPlatformAccessories('homebridge-ping-device', 'PingPlatform', [accessory]) && false)
				            );

		            this.deviceConfigs.forEach(deviceConfig => {
				                let name = deviceConfig.name || deviceConfig.ip;
				                let uuid = UUIDGen.generate(name);
				                let type = (deviceConfig.isPerson + '' === 'true' ? 'Occupancy' : 'Contact') + 'Sensor';

				                let accessory = this.accessories.find(acc => acc.UUID === uuid);
				                if (!accessory) {
							                accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
							                accessory.reachable = true;

							                accessory.addService(Service[type], name);
							                this.api.registerPlatformAccessories('homebridge-ping-device', 'PingPlatform', [accessory]);

							                this.accessories.push(accessory);
							            }

				                let device = new IPDevice(deviceConfig.ip, deviceConfig.interval, deviceConfig.succeedTimeout, accessory, this);
				                device.type = type;
				                device.watch();
				                this.devices.push(device);
				            });
		        }

	    configureAccessory(accessory) {
		            accessory.reachable = true;

		            this.accessories.push(accessory);
		        }

	    report(device) {
		            let character;

		            if (device.type === 'OccupancySensor') {
				                character = device.accessory.getService(Service.OccupancySensor).getCharacteristic(Characteristic.OccupancyDetected);
				                character.updateValue(device.state ? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
				            }
		            else if (device.type === 'ContactSensor') {
				                character = device.accessory.getService(Service.ContactSensor).getCharacteristic(Characteristic.ContactSensorState);
				                character.updateValue(device.state ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED);
				            }
		        }
}

const Exec = require('child_process').exec;
const Interval = 5;
const SucceedTimeout = 600;

module.exports = class IPDevice {
	    constructor(ip, interval, succeedTimeout, accessory, handler) {
		            this.ip = ip;
		            this.interval = (interval || Interval) * 1000;
		            this.succeedTimeout = (succeedTimeout || SucceedTimeout) * 1000;
		            this.accessory = accessory;
		            this.handler = handler;
		            this.state;
		            this.lastPingSucceedTime = 0;
		        }

	    watch() {
		            ping(this.ip, state => {
				                this.update(state);
				                setTimeout(this.watch.bind(this), this.interval);
				            });
		        }

	    update(state) {
		            let oldState = this.state;
		            if (Date.now() - this.lastPingSucceedTime > this.succeedTimeout) {
				                this.state = state;
				            }
		            state && (this.lastPingSucceedTime = Date.now());

		            if (this.state !== oldState) {
				                this.handler.report(this);
				            }
		        }

}

function ping(ip, callback) {
	    Exec('ping -c 1 -W 1 ' + ip, err => {
		            callback && callback(!err);
		        });
}

var Resource = require('deployd/lib/resource')  ,
    Script = require('deployd/lib/script') ,
    internalClient = require('deployd/lib/internal-client') ,
    schedule = require('node-schedule') ,
    util = require('util') ,
    path = require('path')  ,
    request = require('request'),
    fs = require("fs");

function Jobs() {
    Resource.apply(this, arguments);
    this.store = process.server.createStore(this.name + "jobs-log");
    this.initCron();

}
module.exports = Jobs;
util.inherits(Jobs, Resource);

Jobs.label = "Scheduled Job";

Jobs.dashboard = {
    path: path.join(__dirname, 'dashboard') ,
    scripts: [
        '/js/ui-ace.js'
    ],
    pages : [
        "config","code" , "logs"
    ]
}



//this.scheduledJob.stop();
Jobs.prototype.initCron = function() {
    if(!process.server.scheduledJobs) {
        process.server.scheduledJobs = {};
    }

    if(!process.server.scheduledJobs[this.name])  {
        if(this.config.cron){
            var self = this;
            this.scheduledJob = schedule.scheduleJob(this.config.cron, function(){
                self.runScript(self.name);
            });
            console.log(this.scheduledJob.nextInvocation())
            process.server.scheduledJobs[this.name] = this.scheduledJob;
        }
    }


}


Jobs.prototype.handle = function (ctx, next) {
    if(ctx.req.isRoot) {
        switch(ctx.method) {
            case "POST":
                var file = ctx.body.file;
                if(!file){
                    file = this.name;
                }

                this.runScript(file, ctx.done);
                break;
            case "GET":
                this.store.find(ctx.query, function(err, result) {
                    ctx.done(err, result);
                })
                break;
        }
    }
}

Jobs.prototype.runScript = function(file, callback) {
    var self = this;
    var configPath = this.options.configPath;
    var script;
    script = Script.load(this.options.configPath + "/" + file + ".js", function (err, script) {
        var domain = {};
        domain.console = {};
        domain.console.log = function (message) {
            self.log(message, file, "log");
        };
        domain.console.info = function (message) {
            self.log(message, file, "info");
        };
        domain.console.warn = function (message) {
            self.log(message, file, "warn");
        };
        domain.console.error = function (message) {
            self.log(message, file, "error");
        };
        domain.request = request;


        var ctx = {};

        ctx.dpd = internalClient.build(process.server);

        script.run(ctx, domain, function (error, result) {
            if (error) {
                self.log(error.message, file, "error");
            }
            if (callback) {
                callback(error, result);
            }

        });
    });
}

Jobs.prototype.configChanged = function(config, fn) {
    var store = this.store;
    var configPath =  this.options.configPath;
    var name = this.name;

    var properties = config && config.properties;
         console.log(config.id)
    if(config.id && config.id !== this.name) {
        console.log("rename store")
        store.rename(config.id.replace('/', '')  + "jobs-log", function (err) {
            console.log(err);
            fs.rename(configPath + "/" + name + ".js", configPath + "/" + config.id.replace('/', '') + ".js", function(err){
                console.log(err)
                fn(err)
            });


        });
        return;
    }

    fn(null);
};


Jobs.prototype.log = function(message, source, type) {
    var item = {
        message: message,
        date: (new Date()).getTime(),
        source: source,
        type: type
    }
    this.store.insert(item, function() {
    })
}



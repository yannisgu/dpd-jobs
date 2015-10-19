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
    this.initCron(this.name, this.config.cron);

}
module.exports = Jobs;
util.inherits(Jobs, Resource);

Jobs.label = "Scheduled Job";
Jobs.prototype.clientGeneration = true;

Jobs.dashboard = {
    path: path.join(__dirname, 'dashboard') ,
    scripts: [
        '/js/angular.min.js',
        '/js/ui-ace.js'
    ],
    pages : [
        "config","code" , "logs"
    ]
}



//this.scheduledJob.stop();
Jobs.prototype.initCron = function(name, cron) {
    if(!process.server.scheduledJobs) {
        process.server.scheduledJobs = {};
    }

    if(!process.server.scheduledJobs[name])  {
        if(cron){
            this.scheduledJob = schedule.scheduleJob(cron, function(){

                var resources =     process.server.resources;
                if(resources) {
                    for(var i = 0; i < resources.length; i++){
                        if(resources[i].name == name) {
                            var resource = resources[i];
                            resource.runScript(name, function() {

                             });
                        }
                    }
                }
            });
            this.setScheduledJob(this.scheduledJob);
        }
    }


}

Jobs.prototype.getScheduledJob = function() {
    return process.server.scheduledJobs[this.name];
}

Jobs.prototype.setScheduledJob = function(job) {
    process.server.scheduledJobs[this.name] = this.scheduledJob;
}

Jobs.prototype.getNextInvocation = function() {
    var job = this.getScheduledJob();
    if(job){
        return job.nextInvocation();
    }
}


Jobs.prototype.handle = function (ctx, next) {
    if(ctx.req.isRoot) {
        var command = ctx.url.split('/').filter(function(p) { return p; })[0];
        switch(ctx.method) {
            case "POST":
                var file = ctx.body.file;
                if(!file){
                    file = this.name;
                }

                this.runScript(file, ctx.done);
                break;
            case "GET":
                switch (command) {
                    case "logs":
                        this.store.find(ctx.query, function(err, result) {
                            ctx.done(err, result);
                        })
                        break;
                    default:
                        ctx.done(null,{
                            nextInvocation: this.getNextInvocation()
                        });
                        break;
                }
                 break;
        }
    }
    else {
        ctx.done("You have to be root.")
    }
}

Jobs.prototype.runScript = function(file, callback) {
    var self = this;
    var configPath = this.options.configPath;
    var script;
    script = Script.load(this.options.configPath + "/" + file + ".js", function (err, script) {
        if(!err) {
            var domain = {};
            domain.out = {};
            domain.out.log = function (message) {
                self.log(message, file, "log");
            };
            domain.out.info = function (message) {
                self.log(message, file, "info");
            };
            domain.out.warn = function (message) {
                self.log(message, file, "warn");
            };
            domain.out.error = function (message) {
                self.log(message, file, "error");
            };

            domain.require = function(module) {
				return require(module);
			};

            var ctx = { req:{session:{isRoot:true}, isRoot:true} };

            ctx.dpd = internalClient.build(process.server, ctx.req.session);

            script.run(ctx, domain, function (error, result) {
                if (error) {
                    console.log(error);
                    var message = "Error in job '"  + self.name + "': \n";
                    message = error.message;
                    if(error.stack){
                        message += "\n\n =============\n\n" + error.stack;
                    }
                    console.log(error);
                    self.log(error, file, "error");
                }
                if (callback) {
                    callback(error, result);
                }

            });
        }
        else {
            self.log(err, "system", "error");
        }
    });
}

Jobs.prototype.configChanged = function(config, fn) {
    var store = this.store;
    var configPath =  this.options.configPath;
    var name = this.name;

    var properties = config && config.properties;
    if(config.id && config.id !== this.name) {
        console.log("rename store")
        store.rename(config.id.replace('/', '')  + "jobs-log", function (err) {
            fs.rename(configPath + "/" + name + ".js", configPath + "/" + config.id.replace('/', '') + ".js", function(err){
                fn(err)
            });


        });
        return;
    }

    if(config.cron !== this.config.cron) {
        var job = this.getScheduledJob();
        if(job) {
            job.cancel();
            this.setScheduledJob(null);
            this.initCron(this.name, config.cron)  ;
        }
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

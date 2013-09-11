var Resource = require('deployd/lib/resource')  ,
    Script = require('deployd/lib/script')
  , util = require('util')
  , path = require('path')
    ,fs = require("fs")
  , log = function() {}

function Jobs() {
    Resource.apply(this, arguments);
    this.store = process.server.createStore(this.name + "jobs-log");
}
module.exports = Jobs;
util.inherits(Jobs, Resource);

Jobs.label = "Scheduled Jobs";

Jobs.dashboard = {
    path: path.join(__dirname, 'dashboard') ,
    scripts: [
        '/js/ui-ace.js'
    ],
    pages : [
        "config","code"
    ]
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
    var script = Script.load(this.options.configPath  + "/" + file + ".js", function(err, script) {
        var domain = {};
        domain.console = console;
        domain.console.log = function(message) {
            self.log(message, file, "log");
        };
        domain.console.info = function(message) {
            self.log(message, file, "info");
        };
        domain.console.warn = function(message) {
            self.log(message, file, "warn");
        };
        domain.console.error = function(message) {
            self.log(message, file, "error");
        };

        //console.log("here");
        script.run({}, {},function(err, result) {
            if(err) {
                self.log(err, file, "error") ;
            }
            callback(err, result);

        });
    });
}

Jobs.prototype.log = function(message, source, type) {
    var item = {
        message: message,
        date: new Date(),
        source: source,
        type: type
    }
    this.store.insert(item, function() {
    })
}



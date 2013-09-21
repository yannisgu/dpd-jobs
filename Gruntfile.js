module.exports = function(grunt) {
    grunt.initConfig({
        publish: {
            config: {username: 'yannisgu', password: process.env.NPM_PASSWORD, email: "me@yannisguedel.ch"},
        }
    });

    grunt.registerMultiTask('publish', 'Publish the latest version of this plugin', function() {
            var done = this.async(),
                me = this,
                npm = require('npm');
                npm.load({}, function(err) {
                npm.registry.adduser(me.data.username, me.data.password, me.data.email, function(err) {
                    if (err) {
                        console.log(err);
                        done(false);
                    } else {
                        npm.config.set("email", me.data.email, "user");
                        npm.commands.publish([], function(err) {
                            console.log(err || "Published to registry");
                            done(!err);
                        });
                    }
                });
            });
        });
}
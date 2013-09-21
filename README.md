## dpd-jobs [![Build Status](https://travis-ci.org/yannisgu/dpd-jobs.png?branch=master)](https://travis-ci.org/yannisgu/dpd-jobs)

provides functionality to create and manage scheduled jobs in a deployd app

### about

This is a **deployd module** that allows you to create and manage scheduled jobs in a deployd app. Each job is represented by a resource. You can can write custom code which will be executed regularly based on a cron-expression
### usage

Create a project. Then install the dpd-jobs module.

    dpd create my-app
    cd my-app
    mkdir node_modules
    npm install dpd-jobs
    dpd -d

Click the green new resource and choose **Scheduled Job**.

In the config tab you can provide a cron-expression, which indicates when the code will be executed.

In the code tab you can write your code, which should be executed.

### use with caution

This is alpha software. Please use with caution and report any issues or feature requests.

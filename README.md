Automate a slow scaledown of an AWS ASG in Asgard
===================================================

With this CLI tool, you can automate a slow scaledown of an AWS ASG in Asgard.
If your server has long lived connections, you might want to terminate the
instance one a time to allow time to redistribute the load across the cluster.

How to use
----------

By default, the tool will scale down an existing ASG to 0 instance with a 5
minute pause between ASG resize requests

    npm install
    node index.js --asgardHost <your-asgard-hostname> realtime-ASG-CARFGI70UCAL-v524

To stop multiple instances on each scaledown request, a `rate` options can be used:


    node index.js --asgardHost <your-asgard-hostname> --rate 2 realtime-ASG-CARFGI70UCAL-v524

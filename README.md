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

Not yet implemented
-------------------

I haven't impelmented some things, because I don't yet need them. I'm happy to
take pull requests if you'd like to see something get added

 1. Allow HTTPS communication to Asgard
 2. Allow authentication with Asgard
 3. Allow different slowdown period (other than 5 minutes)
 4. Reading a default configuration file for settings that don't change often
    like asgardHost

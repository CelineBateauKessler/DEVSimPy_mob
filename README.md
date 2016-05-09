# What is DEVSimPy-mob
DEVSimPy-mob is a hybrid mobile application allowing the simulation of [DEVSimPy](https://github.com/capocchi/DEVSimPy) models from a mobile phone.
The idea is to allow users of DEVSimPy simulate their models from a mobile phone. This way, they can add real data from the mobile phone (temperature, photo, etc) in the simulation models.
DEVSimPy-mob is a part of a client/server solution and must be coupled with a [DEVSimPy-rest](https://github.com/capocchi/DEVSimPy_rest) server which is in charge to simulate DEVSimPy models. DEVSimPy-mob does not contain a simulation kernel and all simulations are invoked from DEVsimPy-mob to DEVSimPy-rest server.

#Tech
DEVSimPy-mob uses a number of open source projects to work properly:
* [Apache Cordova](https://cordova.apache.org/) - open-source mobile development framework.
* [JQuery-mobile](https://jquerymobile.com/) - HTML5-based user interface system designed to make responsive web sites and apps that are accessible on all smartphone, tablet and desktop devices.
* [Ratchet](http://goratchet.com/) - front-end framework for building mobile web apps in HTML, CSS, and JavaScript. 
* [FusionCharts](http://www.fusioncharts.com/) - JavaScript Graphics library built on top of raphaeljs.
* [Joint.js](http://jointjs.com/) - a diagramming library that focuses on rendering and interacting with diagrams.

# Installation
DEVSimPy-mob is a hybrid application which can be integrated into an Apache Cordova project using [Eclipse](https://eclipse.org/), [Visual studio](https://www.visualstudio.com/fr-fr/features/cordova-vs.aspx) or [PhoneGap](http://phonegap.com/) environment.

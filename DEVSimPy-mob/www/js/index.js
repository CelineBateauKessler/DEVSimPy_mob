var key = "";

var add_server = function (ip) {
    var servers = JSON.parse(localStorage["servers"]);
    if ($.inArray(ip, servers) < 0) {
        servers.push(ip);
        localStorage.setItem('servers', JSON.stringify(servers));
    }
}

var getFromServer = function(url) {
    
    // var promise = $.getJSON(url);
    // $.getJSON does not (always) set the Accept field of the request header to application/json
    // which is expected by the web service
    console.log('%c' + url + ' fetched via AJAX', 'color: orange');
    var promise = $.ajax({
        type: 'GET',
        dataType: "json",
        url: url,
        beforeSend: function (request) {
            request.setRequestHeader("Accept", 'application/json');
        }
    }).done(function (data) {
        localStorage.setItem(url, JSON.stringify(data));
    });

    return promise;
}

var getFromStorage = function (url) {
    
    return JSON.parse(localStorage.getItem(url));
}

var getUrl = function(url) {
    // Return a promise
    // whenever data is retrieved from server or from local storage

    //var supportsLocalStorage = 'localStorage' in window; should be useless

    var storedData = getFromStorage(url);

    if (storedData) {
        // Turn to a promise
        console.log('%c' + url + ' fetched via localStorage', 'color: blue');
        var storageDfd = new $.Deferred();

        setTimeout(function () {
            storageDfd.resolveWith(null, [storedData]);
        });

        return storageDfd.promise();
    }
    else {
        // Retrieve data from server - returns a promise
        return getFromServer(url);
    }
}

var postUrl = function (url, payload) {
    
    var promise = $.ajax({
        type: 'POST',
        contentType:'application/json;charset=UTF-8',
        url  : url,
        data : JSON.stringify(payload)});

    console.log('%c' + url + ' posted via AJAX', 'color: orange');

    return promise;
}

var update_simulation_status = function (simu_name) {
    var simu_url = sessionStorage.ip + "simulations/" + simu_name;
    getFromServer(simu_url)
    .done(function (response) {
        parse_simulation_status(response['info']);
        localStorage.setItem(simu_url, JSON.stringify(response['info']));
        // TODO redondant avec le storage au niveau du getFromServer
        // mais structure simulation info dans reponse JSON différente : POST(creation)/ GET
        window.location = "index.html?view=simulation&simu_name=" + simu_name;
    });
}

function isValidURL(url) {
    var isValid = false;

    $.ajax({
        url: url + "info",
        type: "GET",
        async: false,
        dataType: "json",
        success: function (data) {
            isValid = data != null;
        },
        error: function () {
            isValid = false;
        }
    });

    return isValid;
};

function isNumeric(obj) {
    return obj - parseFloat(obj) >= 0;
};

function alert_dial(info, redirect) {
    $("<header class=\"bar bar-nav\">\
                    <a class=\"icon icon-close pull-right\" onClick=\"window.location='index.html?view=" + redirect + "'\"></a>\
                    <h1 class=\"title\">Information</h1>\
                    </header>\
                    <div class=\"content\">"
                    + info +
                    "</div>").appendTo("#info");
    $("#info").addClass("active");
};

function session_reg(ip) {
    if (sessionStorage !== null) {
        sessionStorage.setItem('ip', ip);
        connect();
        //if (is_connected()) {
        //    alert("Well connected!");
        //}
    } else {
        alert('Session storage not supported!');
    }
};

function is_connected() {
    return sessionStorage.getItem('ip') !== null;
};

function session_get() {
    if (sessionStorage.ip !== "") {
        var session_ip = sessionStorage.getItem('ip');
        var session_host = session_ip
    } else {
        alert('Session storage not supported!');
    }
};

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        console.log("*** event " + id)
        if (parentElement) {
            var listeningElement = parentElement.querySelector('.listening');
            var receivedElement = parentElement.querySelector('.received');

            listeningElement.setAttribute('style', 'display:none;');
            receivedElement.setAttribute('style', 'display:block;');
        }
    }
};

app.initialize();

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);

    } else if (typeof XDomainRequest != "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

    } else {

        // Otherwise, CORS is not supported by the browser.
        xhr = null;

    }
    return xhr;
}


function getParameterByName(param) {
    var results = new RegExp('[\?&]' + param + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return "";
    } else {
        return results[1] || 0; // TODO ??
    }
}

function renderView(controller, callback) {

    if (!controller) {
        controller = getParameterByName("view");
    }

    if (controller) {
        $("#container").load("views/modules/" + controller + ".html", function () {
            //$(this).trigger('document_change'); change philosophy, use callback on renderView instead
            callback();
        });
    }
    else {
        renderView("home");
    }
};


function list_models(data) {

    $('#spinnerM').hide();
    $("#list_models").empty()
    var items = [];
    var stored_model_list = getFromStorage(sessionStorage.ip + "models")['models'];

    // display models names with last modified date and size 
    $.each(data['models'], function (model_name, info) {

        // delete stored model if it exists and is outdated
        if (stored_model_list[model_name] && stored_model_list[model_name]['last_modified'] !== info['last_modified']) {
            localStorage.removeItem(sessionStorage.ip + "models/" + model_name);
        }

        items.push(
            "<li class='table-view-cell media'>\
                <a class='navigate-right' onClick=\"document.location.href='index.html?view=model&model_name="+ model_name + "'\" data-transition='slide-in'>\
                    <span class=\"media-object pull-left icon icon-pages\"></span>\
                    <div class='media-body'>\
                    " + model_name +
                    "<p>" + info["last_modified"] + "<br />" + info["size"] + "</p>\
                    </div>\
                </a>\
            </li>" );
    });

    $("<ul/>", {
        "class": "table-view",
        html: items.join("")
    }).appendTo("#list_models");
};

function list_simulations(data) {

    var items = [];
    console.log("list simu")
    console.log(data)
    $('#spinnerS').hide();
    $("#list_simulations").empty();
    //id=\"delete\" simu_name=\"" + simu_name +"
    // display models names with last modified date and size 
    $.each(data, function (simu_name, info) {
                    
        items.push(
            "<li class='table-view-cell media'>\
                 <a class='navigate-right' onClick=\"document.location.href='index.html?view=simulation&simu_name="+ simu_name + "'\" data-transition='slide-in'>\
                    <div class='media-body'>\
                    " + info['model_name'] +
                    "<p>" + info["date"] + "<br />" + info["simulated_duration"] + "<br />" +
                    "<span class=\"badge\">" + info['status'] +
                    "</span></p></div></a>" +
                "<span class=\"pull-left icon icon-trash\" id=\"delete_simu\" simu_name=\"" + simu_name +"\"></span>"+
            "</li>");
    });

    $("<ul/>", {
        "class": "table-view",
        html: items.join("")
    }).appendTo("#list_simulations");
};


function draw(json) {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: $('#paper'),
        width: $(document).width() - 30,
        height: $(document).height() - ($("#head2").height() + $("header").height() + 50),
        gridSize: 1,
        model: graph,
        perpendicularLinks: true
    });

    //   PreventGhostClick("#paper");

    //   $("#paper").hammer().bind("doubletap", function (ev) {
    //       console.log('test');
    //   });

    // double click on model
    paper.on('cell:pointerdblclick',
     function (cellView, evt, x, y) {
         var dsp = $('#dsp').text();
         var m = cellView.model
         //var data = m.attributes.prop.data;

         window.location = "index.html?view=model_param&block_label=" + m.id + "&model_name=" + json['model_name'];
     });

    graph.fromJSON(json);
    paper.scaleContentToFit();
    paper.setOrigin(paper.options.origin["x"], 50);
    // console.log(paper.options.origin);
}

function list_labels(data, model_name, simu_name) {

    // insert the first separator before populate the list of blocks
    var code = "<li class=\"table-view-cell table-view-divider\">Model blocks</li>"
    $("<ul/>", {
        "class": "table-view",
        html: code
    }).appendTo("#setting");

    //populate the list
    var items = [];
    var cells = data['model']['cells'];

    for (item in cells) {
        var elem = cells[item];
        if (elem.type == 'devs.Atomic') {
            items.push(
                "<li class='table-view-cell'>\
                <a class='navigate-right' onClick=\"document.location.href='index.html?view=block_param&model_name=" + model_name +
                    "&block_label=" + elem.id + "&simu_name=" + simu_name + "'\" data-transition='slide-in'> \
                    <div class='media-body'>\
                    " + elem.id + "</div>\
                </a>\
            </li>" )
        };
    };
    
    $("<ul/>", {
        "class": "table-view",
        html: items.join("")
    }).appendTo("#setting");

    // close the list by inserting the simulation options
    if (simu_name === "") {
        // Simulation is NOT in progress
        // set TIME input and SIMULATE button
        var code = "<li class=\"table-view-cell table-view-divider\">Simulation settings</li> \
            <li class=\"table-view-cell\"> \
               <form class=\"input-group\"> \
                    <div class=\"input-row\"> \
                        <label>Time</label> \
                            <input id=\"time\" type=\"text\" value=\"10\" maxlength=\"6\"> \
                        </div> \
                    </form> \
            </li> ";

        $("<ul/>", {
            "class": "table-view",
            html: code
        }).appendTo("#setting");
        $('#simulation').append('<button id="simulate" class="btn btn-primary btn-block">SIMULATE</button>');
    }
    else {
        $('#simulation').append('<button id="resume" class="btn btn-primary btn-block">RESUME</button>');
    }
    

}

function parse_model(data, model_name, simu_name) {
    
    var obj = data['model'];

    // Update each segment : diagram / description / simulate

    // diagram segment
    draw(obj);
    $('#spinner1').hide();

    // description segment
    var description = obj['description'] != "" ? obj['description'] : "No description for this model.";
    $("<p>" + description + "</p>").appendTo("#description");

    // simulate segment
    list_labels(data, model_name, simu_name);
    $('#spinner2').hide();
};

function parse_prop(data, block_label) {

    var cells = data['model']['cells'];

    for (item in cells) {
        var elem = cells[item];

        if (elem.type == 'devs.Atomic' && elem.id == block_label) {
            var prop = elem.prop.data;
            var items = [];

            $.each(prop, function (key, val) {
                items.push(
                    "<div class=\"input-row\">" +
                    "<label>" + key + "</label>" +
                    "<input name=\"" + key + "\" id=\"" + key + "\" type=\"text\" value=\"" + val + "\" />" +
                    "</div>");
            });

            $("<form/>", {
                "class": "input-group",
                html: items.join("")
            }).appendTo("#param");
        };
    };
};

function parse_simulation_status(data) {
    
    /*"simulation_data":       {
         "username": "celinebateaukessler",
         "status": "RUNNING",
         "socket_id": "celinebateaukessler.570f4a6b2156f658bd895f51",
         "log_filename": "570f4a6b2156f658bd895f51.log",
         "pid": 23459,
         "output_filename": "570f4a6b2156f658bd895f51.out",
         "model_filename": "Numerous_Parameters.yaml",
         "date": "2016-04-14 09:44:43",
         "simulated_duration": "100",
         "model_name": "Numerous_Parameters"*/

    $("#spinner").hide();
    
    var items = [];
    var meaningful_keys = ['status', 'simulated_duration', 'date']; 
    $.each(data, function (key, val) {
        if (meaningful_keys.indexOf(key) >= 0) {
            items.push("<li class=\"table-view-cell\">" + key + "<span class=\"badge\">" + val + "</span></li>");
        }
        
            /*if (key == 'output') {
            items.push(
                "<li class=\"table-view-divider\">Generated files</li>"
            );
            // list output .dat files
            $.each(val, function (index, v) {
                items.push(
                    "<li class='table-view-cell media'>\
                    <a class='navigate-right' onClick=\"document.location.href='index.html?view=plot&name="+ v['name'] + "&time=" + time + "&filename=" + filename + "'\" data-transition='slide-in'>\
                        <div class='media-body'>\
                        <p>" + v['name'] + "</p>\
                        </div>\
                    </a>\
                </li>"
                );
            });
        }*/
    });

    $("<ul/>", {
        "class": "table-view",
        html: items.join("")
    }).appendTo("#status");
}

function plot(filename, data) {
    /*FusionCharts.ready(function () {
        var salesChart = new FusionCharts({
            type: 'scrollline2d',
            dataFormat: 'json',
            renderAt: 'plot',
            width: $(document).width() - 30,
            height: $(document).height() - ($("#head2").height() + $("header").height() + 50),
            dataSource: data
        }).render();
    });*/
}

function discon() {
    // disconnect();
    delete sessionStorage.ip;
    sessionStorage.clear();
};


function onConnect(k) {
    console.log('Established connection with ', k);
    key = k;
};

function stub(d) {
    console.log(d);
};

function connect() {
    window.tlantic.plugins.socket.connect(onConnect, stub, sessionStorage.getItem('ip'), 80);
    //window.tlantic.plugins.socket.connect(stub, stub, host, 18004);
};

function send(data) {
    window.tlantic.plugins.socket.send(stub, stub, key, data);
};

function disconnect() {
    window.tlantic.plugins.socket.disconnect(stub, stub, sessionStorage.getItem('ip') + ':80');
};

function disconnectAll() {
    window.tlantic.plugins.socket.disconnectAll(stub, stub);
};

function isConnected() {
    window.tlantic.plugins.socket.isConnected(key, stub, stub);
};

function hidePopover() {
    var popovers = $('.popover');
    $(popovers).removeClass('visible');
    $(popovers).removeClass('active');
    $(popovers).hide();
    $("div.backdrop").remove();
}

$(document).ready(function () {

    // $.ajaxSetup({ cache: false });

    /*    $.ajaxSetup({
        beforeSend: function () {
            $('#spinner').show();
        },
        complete: function () {
            $('#spinner').hide();
        },
        success: function () {
            $('#spinner').hide();
        }
        });
    */

    //$('body').on('click', 'a', renderView());

    if (is_connected()) {

        session_get();

        $("body").on('click', '#disconnect', function (event) {
            function onConfirm(buttonIndex) {
                //alert('You selected button ' + buttonIndex);
                if (buttonIndex == '1') {
                    discon();
                    window.location = "index.html";
                }
            }

            navigator.notification.confirm(
                'Are you sure you want to quit DEVSimPy-mob?', // message
                 onConfirm,            // callback to invoke with index of button pressed
                'Warning',           // title
                ['Yes', 'No']     // buttonLabels
            );

        });

        $("body").on('click', '#list', function (event) {
            hidePopover();
            // remove diagram from localstorage (for getUrl)
            window.location = "index.html?view=lists";
        });

        var controller = getParameterByName("view");

        if (controller == "lists") {
            renderView(controller, function () {

                // Information menu has been clicked
                $("body").on('click', '#information', function (event) {
                    hidePopover();
                    getFromServer(sessionStorage.ip + "info")
                    .done(function (data) {
                        alert_dial("<p class=\"content-padded\">DEVSimPy-mob is a mobile app which aims to simulate DEVSimPy models from mobile environement.</p><br />" +
                                "<p><b>DEVSimPy-mob specifications:</b></p> <ul>" +
                                   "<li> <p><b>DEVSimPy version:</b> " + data['devsimpy-version'] + "</p></li>" +
                                   "<li> <p><b>DEVSimPy libs:</b> " + data['devsimpy-libraries'] + "</p></li>" +
                                   "<li> <p><b>DEVSimPy plugins:</b> " + data['devsimpy-plugins'] + "</p></li>" +
                                   "</ul>" +
                                   "<p><b> RestFull Server specification </b></p>" +
                                   "<ul>" +
                                   "<li><p>URL: " + data['url-server'] + "</p></li>" +
                                   "<li><p>Python version: " + data['python-version'] + "</p></li>" +
                                   "<li><p>Machine: " + data['machine-server'] + "</p></li>" +
                                   "<li><p>OS: " + data['os-server'] + "</p></li>" +
                                   "</ul>"

                                );
                    })
                    .fail(function (jqxhr, textStatus, error) {
                        var err = textStatus + ", " + error;
                        console.log("Request Failed: " + err);
                    });
                });

                // Models list update
                var updateModelList = function () {
                    getFromServer(sessionStorage.ip + "models")
                    .done(function (data) {
                        list_models(data);
                    })
                    .fail(function (jqxhr, textStatus, error) {
                        var err = textStatus + ", " + error;
                        console.log("Request Failed: " + err);
                    });
                };

                // Simulations list update
                var updateSimuList = function () {
                    getFromServer(sessionStorage.ip + "simulations")
                    .done(function (data) {
                        list_simulations(data);
                    })
                    .fail(function (jqxhr, textStatus, error) {
                        var err = textStatus + ", " + error;
                        console.log("Request Failed: " + err);
                    });
                };

                // populate the lists
                updateModelList();
                updateSimuList();

                // Refresh button has been clicked
                $("body").on('click', '#refresh', function (event) {
                    hidePopover();
                    updateModelList();
                    updateSimuList();
                });

                $("body").on('click', '#delete_simu', function (event) {
                    simu_name = $(this).attr("simu_name");
                    console.log("DELETE simu " + simu_name);
                    $.ajax({
                        type: 'DELETE',
                        url: sessionStorage.ip + "simulations/" + simu_name,
                        dataType: 'json'
                    })
                    .done(function (response) {
                        updateSimuList(simu_name);
                    });
                });

            });

        }
        else if (controller == "model") {
            renderView(controller, function () {
                var model_name = getParameterByName("model_name");
                var simu_name = getParameterByName("simu_name"); // only set if the model is linked to a simulation
                console.log('PARSE MODEL, simu=' + simu_name + '*');

                // Set title
                $("<h1 id=\"dsp\" class=\"title\">" + model_name + "</h1>").appendTo('header');

                // BACK button click
                $("body").on('click', '#back_list', function (event) {
                    window.location = "index.html?view=lists";
                });

                // INFORMATION item menu click
                $("body").on('click', '#information', function (event) {
                    hidePopover();
                    alert_dial("<p class=\"content-padded\"> Edit or Simulate the current model.</p>",
                        "model&model_name=" + model_name + "&simu_name=" + simu_name);
                });

                // GET model description as JSON
                var url1 = sessionStorage.ip + "models/" + model_name;
                getUrl(url1).then(function (data) {
                    // Display model diagram and description
                    parse_model(data, model_name, simu_name);

                    // Handle the click on "SIMULATE" button
                    $('body').on('click', '#simulate', function (event) {
                        var simulated_duration = $('#time').val();

                        if (isNumeric(simulated_duration)) {
                            // performing simulation
                            var url = sessionStorage.ip + "simulations";
                            var payload = { 'model_name': model_name, 'simulated_duration': simulated_duration };

                            postUrl(url, payload)
                                .done(function (data) {
                                    if (data['success'] === true) {
                                        var simu_name = data['simulation']['simulation_name'];
                                        var simu_url = sessionStorage.ip + "simulations/" + simu_name;
                                        localStorage.setItem(simu_url, JSON.stringify(data['simulation']['simulation_data']));
                                        window.location = "index.html?view=simulation&simu_name=" + simu_name;
                                    }
                                })
                                .fail(function (jqxhr, textStatus, error) {
                                    var err = textStatus + ", " + error;
                                    console.log("Request Failed: " + err);
                                });

                        } else {
                            alert_dial("<p class=\"content-padded\"> Time must be digit value.</p>",
                                "model&model_name=" + model_name);
                        }
                    });

                    // Handle the click on "RESUME" button
                    $("body").on('click', '#resume', function (event) {
                        console.log("RESUME simu=" + simu_name);
                        // Send RESUME as a PUT request
                        $.ajax({
                            type: 'PUT',
                            url: sessionStorage.ip + "simulations/" + simu_name + "/resume",
                            dataType: 'json'
                        })
                        .done(function (response) {
                            update_simulation_status(simu_name);
                        });
                    });

                });
            });
        }
        else if (controller == "block_param") {
            renderView(controller, function () {

                var model_name = getParameterByName("model_name");
                var block_label = getParameterByName("block_label");
                var simu_name = getParameterByName("simu_name");
                console.log("BlockParam simu=" + simu_name + "*");
                
                $("<h1 id='model_name' class=\"title\">" + block_label + "</h1>").appendTo('header');

                // back button has been cliked
                $("body").on('click', '#back_model', function (event) {
                    window.location = "index.html?view=model&model_name=" + model_name + "&simu_name=" + simu_name;
                });

                // save button has been clicked
                $("body").on('click', '#save_yaml', function (event) {
                    var getModelJSON = getUrl(sessionStorage.ip + "models/" + model_name)
                    .done(function (data) {
                        // Read parameters names from JSON representation of model --> read directly from form TODO
                        // Read parameters values from user input through mobile app
                        var cells = data['model']['cells'];
                        for (var i = 1; i < cells.length; ++i) {
                            if (cells[i]['id'] == block_label) {
                                var args = cells[i]['prop']['data'];
                                var new_args = {}
                                for (name in args) {
                                    // get input value from form of the mobile app
                                    var new_val = $("#" + name).val();
                                    new_args[name] = new_val;
                                }
                            }
                        }

                        // PUT new args
                        if (simu_name === "") {
                            // If simu_name is undefined then save new parameters in YAML file
                            console.log("save YAML");
                            $.ajax({
                                type: 'PUT',
                                url: sessionStorage.ip + "models/" + model_name + "/atomics/" + block_label + "/params",
                                data: JSON.stringify(new_args),
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json'
                            })
                            .done(function (data) {
                                //console.log(data);
                                if (data['success'] === true) {
                                    parse_prop(data, block_label);
                                }
                                else {
                                    $("#param").html('Unable to save parameters');
                                }
                            })
                            .fail(function (jqxhr, textStatus, error) {
                                $("#param").html('Unable to save parameters');
                                console.log("Request Failed: " + textStatus + ", " + error);
                            });
                        } else {
                            // Modification of parameters for simulation in progress only
                            console.log('MODIFY parameters');
                            $.ajax({
                                type: 'PUT',
                                url: sessionStorage.ip + "simulations/" + simu_name + "/atomics/" + block_label + "/params",
                                data: JSON.stringify(new_args),
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json'
                            })
                            .done(function (data) {
                                console.log(data);
                                if (data['success'] !== true || data['status'] !== 'OK') {
                                    //alert...TODO
                                    $("#param").html('Unable to modify parameters');
                                }
                            })
                            .fail(function (jqxhr, textStatus, error) {
                                $("#param").html('Unable to modify parameters');
                                console.log("Request Failed: " + textStatus + ", " + error);
                            });
                        }
                        
                    });
                });

                // Get model description from server TBC
                getUrl(sessionStorage.ip + "models/" + model_name)
                    .done(function (data) {
                        $('#spinner').show();
                        parse_prop(data, block_label);
                        $('#spinner').hide();
                    })
                    .fail(function (jqxhr, textStatus, error) {
                        var err = textStatus + ", " + error;
                        console.log("Request Failed: " + err);
                    });
            });
        }
        else if (controller == "simulation") {
            renderView(controller, function () {
                var simu_name = getParameterByName("simu_name");
                var simu_url = sessionStorage.ip + "simulations/" + simu_name;
                var simu_report = getFromStorage(simu_url);
                parse_simulation_status(simu_report);

                // BACK button has been clicked
                $("body").on('click', '#back_sim', function (event) {
                    window.location = "index.html?view=model&model_name=" + simu_report['model_name'] + "&simu_name=" + simu_name;
                });
                
                $("body").on('click', '#update', function (event) {
                    update_simulation_status(simu_name);
                });

                // PAUSE button
                $("body").on('click', '#pause', function (event) {
                    console.log("PAUSE simu=" + simu_name);
                    // Send PAUSE as a PUT request
                    $.ajax({
                        type: 'PUT',
                        url: simu_url + "/pause",
                        dataType: 'json'
                    })
                    .done(function (response) {
                        update_simulation_status(simu_name);
                    });
                });

                // RESUME button
                $("body").on('click', '#resume', function (event) {
                    console.log("RESUME simu=" + simu_name);
                    // Send RESUME as a PUT request
                    $.ajax({
                        type: 'PUT',
                        url: simu_url + "/resume",
                        dataType: 'json'
                    })
                    .done(function (response) {
                        update_simulation_status(simu_name);
                    });
                });

                // MODIFY button
                $("body").on('click', '#modify', function (event) {
                    console.log("MODIFY simu=" + simu_name);
                    window.location = "index.html?view=model&model_name=" + simu_report['model_name'] + "&simu_name=" + simu_name;
                });

                // KILL button
                $("body").on('click', '#kill', function (event) {
                    console.log("KILL simu=" + simu_name);
                    // Send RESUME as a PUT request
                    $.ajax({
                        type: 'PUT',
                        url: simu_url + "/kill",
                        dataType: 'json'
                    })
                    .done(function (response) {
                        update_simulation_status(simu_name);
                    });
                });

            });
        }
        else if (controller == "plot") {
            renderView(controller, function () { });

            /*var name = getParameterByName("name");
            var model_name = getParameterByName("model_name");
            var time = getParameterByName("time");
            var url = sessionStorage.ip + "plot?name=" + name;
    
            // document_change event is triggered by the renderView function in order to be sure that the page is loaded
            $(document).on('document_change', function () {
                $("<h1 class=\"title\">" + name + "</h1>").appendTo('header');
            });
    
            // back_result button has been clicked
            $("body").on('click', '#back_result', function (event) {
                window.location = "index.html?view=simulation&model_name=" + model_name + "&time=" + time;
            });
    
            // Ajax call for plotting simulation results
            var jqxhr = getFromServer(url)
                .done(function (data) {
                    plot(name, data);
                })
                .fail(function (jqxhr, textStatus, error) {
                    var err = textStatus + ", " + error;
                    console.log("Request Failed: " + err);
                });*/

        }

        else {
            window.location = "index.html?view=lists";
        }

    } else {
        // connect view Home

        renderView("home", function () {
            if ($('#datalist')) {
                try {
                    //console.log(localStorage.getItem("urls"));
                    // restore urls list from localstorage and populate the datalist
                    $.each(JSON.parse(localStorage.getItem("servers")), function (index, value) {
                        $("<option value='" + value + "'>").appendTo($('#datalist'));
                    });
                } catch (e) {
                    localStorage.setItem('servers', JSON.stringify([]));
                }
            }
            $('body').on('submit', '#connection', function (event) {
                var ip = $("#ip").val();
                var username = $("#username").val();
                var password = $("#password").val();
                var address = 'http://';

                // devsimpy rest server need authentication ?
                if (username != "" && password != "") {
                    address += username + ":" + password + "@" + ip + '/';
                } else {
                    address += ip + '/';
                }

                // if URL is valid
                if (isValidURL(address)) {
                    // store the address in urls list object in the localstorage
                    add_server(ip);
                    session_reg(address);
                } else {
                    alert_dial(" <p class=\"content-padded\"> Please enter correct url and check first if you have network and second if the devsimpy rest server needs authentication.</p>", "home");
                    event.preventDefault();
                }
            });
        });

        // document_change event is triggered by the renderView function in order to be sure that the page is loaded
        //$(document).on('document_change', function () {// sure that datalist element exist});
    }
});
// Vars
var selected_message = -1;
var new_message_type = "blank";
var new_message_colour = "TOPAZ";
var new_message_text = "";

var columns = [
    {
        canSort: false,
        header: "message",
        ratioWidth: 9
    },
    {
        canSort: false,
        header: "image",
        ratioWidth: 1
    }
]

// Enums

var parkmessages = [];
var monthnames = ["March", "April", "May", "June", "July", "August", "September", "October"];
var messagetypes = ["attraction", "peep_on_attraction", "peep", "money", "blank", "research", "guests", "award", "chart"]
var messagecolours = ["BLACK", "GREY", "WHITE", "RED", "GREEN", "YELLOW", "TOPAZ", "CELADON", "BABYBLUE", "PALELAVENDER", "PALEGOLD", "LIGHTPINK", "PEARLAQUA", "PALESILVER"];

// Functions
function delete_all_messages() {
    for (var pm = park.messages.length; pm > 0; pm--) {
        delete_message(pm - 1);
    }
}

function delete_message(id) {
    park.messages[id].remove();
}

function add_message() {
    var MessageDesc = {
        type: new_message_type,
        text: ("{" + new_message_colour + "}" + new_message_text)
    }

    park.postMessage(MessageDesc);
}

function update_parkmessages() {
    // Clear first
    parkmessages = [];
    for (var pm = 0; pm < park.messages.length; pm++) {
        // Create a seperator with the date of the message
        var date = calculate_date(park.messages[pm].day, park.messages[pm].month);
        if (selected_message == pm) {
            date = "[SELECTED] " + date
        }
        parkmessages.push({
            id: pm,
            message: {
                type: "seperator",
                text: date
            }
        }
        )

        // Check if the message has an image
        var hasimage = false;
        var spritenum = get_message_type_image(park.messages[pm].type);
        var imagestring = "";
        if (spritenum > 0) {
            hasimage = true;
            imagestring = get_image_formatting(spritenum);
        }

        // Add the text
        var messagetexts = park.messages[pm].text.split("{NEWLINE}").join("{NEWLINE_SMALLER}").split(("{NEWLINE_SMALLER}"));
        var openformatting = "";

        for (var m = 0; m < messagetexts.length; m++) {
            var istring = "";
            if (m == 0) {
                istring = imagestring;
            }
            parkmessages.push({
                id: pm,
                message: [
                    openformatting + messagetexts[m],
                    istring
                ]
            });
            var matches = messagetexts[m].match(/{(.*?)}/g);
            if (matches) {
                for (var ma = 0; ma < matches.length; ma++) {
                    // Check if the formatting code is a colour, if so add it to the next line
                    for (var c = 0; c < messagecolours.length; c++) {
                        if (matches[ma] == ("{" + messagecolours[c] + "}")) {
                            openformatting += matches[ma];
                        }
                    }
                }
            }
        }

        if (hasimage && messagetexts.length < 2) {
            parkmessages.push({
                id: pm,
                message: [
                    "",
                    ""
                ]
            });
        }
    }
}

function get_image_formatting(spritenum) {
    var hexStr = spritenum.toString(16);
    var hexarray = [];

    while (hexStr.length > 0) {
        var val = hexStr.substring(hexStr.length - 2, hexStr.length);
        if (val.length < 2) {
            val = "0" + val;
        }
        hexarray.push("{" + parseInt(val, 16) + "}");
        hexStr = hexStr.substring(0, hexStr.length - 2);
    }

    // Add the remaining 0's
    while (hexarray.length < 4) {
        hexarray.push("{00}");
    }

    return ("{INLINE_SPRITE}" + hexarray.join(""));
}

function get_message_type_image(messagetype) {
    switch (messagetype) {
        case "attraction":
            return 5187;
            break;
        case "money":
            return 5190;
            break;
        case "research":
            return 5189;
            break;
        case "guests":
            return 5193;
            break;
        case "award":
            return 5194;
            break;
        case "chart":
            return 5195;
            break;
        default:
            return -1;
            break;
    }
}

function calculate_date(day, months) {
    // The year goes from march until october
    var year = ((months) / 8 | 0) + 1;
    var month = (months) - ((year - 1) * 8);
    return (day + get_day_suffix(day) + " " + monthnames[month] + " " + year)
}

function get_day_suffix(day) {
    switch (day) {
        case 1:
            return "st"
            break;
        case 2:
            return "nd"
            break;
        case 3:
            return "rd"
            break;
        default:
            return "th"
            break;
    }
}

function update_widget_messagelist() {
    update_parkmessages();
    var listwindow = ui.getWindow("Park Messages")
    var messagelist = listwindow.findWidget("list_messages");

    messagelist.items = parkmessages.map(function (message) {
        return message.message;
    });
}

function update_widget_previewimage(imagetype) {
    var spritenum = get_message_type_image(imagetype);
    var addwindow = ui.getWindow("Add Park Messages")
    var previewimage = addwindow.findWidget("previewimage");
    if (spritenum > 0) {
        previewimage.text = get_image_formatting(spritenum);
    }
    else {
        previewimage.text = "";
    }
}

function validate_selection() {
    if (selected_message == -1) {
        ui.showError("Park Message Manager:", "Select a message to delete first by clicking on it.")
        return false;
    }

    return true;
}

function add_message_window() {
    widgets = []

    widgets.push({
        type: "dropdown",
        name: "message_type_dropdown",
        x: 10,
        y: 20,
        width: 200,
        height: 15,
        items: messagetypes,
        selectedIndex: 4,
        onChange: function onChange(e) {
            new_message_type = messagetypes[e];
            update_widget_previewimage(messagetypes[e]);
        }
    });

    widgets.push({
        type: "dropdown",
        name: "message_colour_dropdown",
        x: 10,
        y: 45,
        width: 200,
        height: 15,
        items: messagecolours.map(function (colour) {
            return ("{" + colour + "}" + colour);
        }),
        selectedIndex: 6,
        onChange: function onChange(e) {
            new_message_colour = messagecolours[e];
        }
    });

    widgets.push({
        type: 'label',
        name: 'previewimage',
        x: 220,
        y: 20,
        width: 80,
        height: 80,
        text: ""
    });

    widgets.push({
        type: 'label',
        name: 'label',
        x: 10,
        y: 70,
        width: 390,
        height: 80,
        text: "Enter the message text. Use NEWLINE in between curly brackets{NEWLINE}to make the text after it start on a new line.{NEWLINE}Select the type of message and colour in the dropdown boxes above."
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox",
        x: 5,
        y: 105,
        width: 390,
        height: 40,
        maxLength: 100,
        onChange: function onChange(e) {
            new_message_text = e;
        }
    });

    widgets.push({
        type: 'button',
        name: "Add-messagetext-button",
        x: 5,
        y: 150,
        width: 390,
        height: 20,
        text: "Add the new message.",
        onClick: function onClick() {
            add_message();
            window.close();
            update_widget_messagelist();
        }
    });

    window = ui.openWindow({
        classification: 'Add Park Messages',
        title: "Add a park message",
        width: 400,
        height: 175,
        x: 100,
        y: 100,
        colours: [12, 12], //12
        widgets: widgets
    });
}

function messages_window() {
    widgets = []
    // Message Selection
    widgets.push({
        type: 'listview',
        name: 'list_messages',
        x: 5,
        y: 20,
        width: 490,
        height: 275,
        scrollbars: "vertical",
        isStriped: false,
        showColumnHeaders: false,
        columns: columns,
        items: parkmessages.map(function (message) {
            return message.message;
        }),
        selectedCell: 0,
        canSelect: false,
        onClick: function onClick(item, column) {
            selected_message = parkmessages[item].id;
            update_widget_messagelist();
        }
    });

    // Operators
    widgets.push({
        type: 'button',
        name: "Remove-selected-button",
        x: 5,
        y: 300,
        width: 150,
        height: 20,
        text: "Delete Selected Message",
        onClick: function onClick() {
            if (validate_selection()) {
                delete_message(selected_message);
                selected_message = -1;
                update_widget_messagelist();
            }
        }
    });

    widgets.push({
        type: 'button',
        name: "Remove-all-button",
        x: 175,
        y: 300,
        width: 150,
        height: 20,
        text: "Delete All Message",
        onClick: function onClick() {
            delete_all_messages();
            selected_message = -1;
            update_widget_messagelist();
        }
    });

    widgets.push({
        type: 'button',
        name: "Add-message-button",
        x: 345,
        y: 300,
        width: 150,
        height: 20,
        text: "Add new Message",
        onClick: function onClick() {
            add_message_window();
        }
    });

    window = ui.openWindow({
        classification: 'Park Messages',
        title: "Park Message Manager 1.0 (by Levis)",
        width: 500,
        height: 325,
        x: 20,
        y: 50,
        colours: [12, 12], //12
        widgets: widgets
    });
}

var main = function () {
    // Add a menu item under the map icon on the top toolbar
    ui.registerMenuItem("Manage Park Messages", function () {
        update_parkmessages();
        messages_window();
    });
};

registerPlugin({
    name: 'Park Message Manager',
    version: '1.0',
    authors: ['AutoSysOps (Levis)'],
    type: 'remote',
    licence: 'MIT',
    main: main
});
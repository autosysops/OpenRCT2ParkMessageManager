// Settings
var MAX_LINE_LENGTH = 52;

// Vars
var selected_message = -1;
var new_message_type = "attraction";
var new_subject_type = "";
var new_message_colour = "TOPAZ";
var new_message_text = "";
var new_subject = -1;
var message_refresh = 0;
var filter_archived = true;
var filter_top = 25;

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
var messagetypes = [
    { name: "attraction", select: "ride" },
    { name: "peep_on_attraction", select: "guest" },
    { name: "peep", select: "guest" },
    { name: "money", select: "" },
    { name: "blank", select: "guest" },
    { name: "research", select: "" },
    { name: "guests", select: "" },
    { name: "award", select: "" },
    { name: "chart", select: "" }
]

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
    var subject = null;
    if (new_subject_type === "guest" || new_subject_type === "ride") {
        subject = new_subject;
    }
    var MessageDesc = {
        type: new_message_type,
        text: ("{" + new_message_colour + "}" + new_message_text),
        subject: subject
    }

    park.postMessage(MessageDesc);
}

function update_parkmessages() {
    // Clear first
    parkmessages = [];
    var start = 0;
    if(filter_top > 0) {
        start = park.messages.length-filter_top;
        if(start < 0) {
            start = 0;
        }
    }
    for (var pm = start; pm < park.messages.length; pm++) {
        if (park.messages[pm].isArchived || filter_archived == false) {
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
                // Check if message is to long and if so break it up in parts.
                var mts = [];
                if (get_message_actual_length(messagetexts[m], true) > MAX_LINE_LENGTH) {
                    var start = 0;
                    do {
                        var substring = get_message_substring(messagetexts[m], MAX_LINE_LENGTH, start);
                        start += MAX_LINE_LENGTH;
                        if (substring != "") {
                            mts.push(substring);
                        }
                    } while (substring != "")
                }
                else {
                    mts.push(messagetexts[m]);
                }
                for (var ms = 0; ms < mts.length; ms++) {
                    var istring = "";
                    if (m == 0 && ms == 0) {
                        istring = imagestring;
                    }
                    parkmessages.push({
                        id: pm,
                        message: [
                            openformatting + mts[ms],
                            istring
                        ]
                    });
                    var matches = mts[ms].match(/{(.*?)}/g);
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
}

function get_message_actual_length(text, casesensitive) {
    var opensigns = 0;
    var count = 0;
    for (var i = 0; i < text.length; i++) {
        switch (text[i]) {
            case "{":
                opensigns++;
                break;

            case "}":
                opensigns--;
                break;

            default:
                if (opensigns == 0) {
                    //lowercase letters are smaller then upper case letter so if we count them as 0,8125 the length
                    if (text[i].match(/[a-z]+/g) && casesensitive) {
                        count += 0.8125;
                    }
                    else {
                        if (text[i].match(/[A-Z]+/g) && casesensitive) {
                            count += 1;
                        }
                        else {
                            count += 0.2;
                        }
                    }
                }
                break;
        }
    }
    return count;
}

function get_message_substring(text, length, start) {
    var opensigns = 0;
    var count = 0;
    var substring = ""
    var openword = "";
    var backupword = "";
    for (var i = 0; i < text.length; i++) {
        var addtosubstring = false;

        // Store a backupword incase it's to long to fit on 1 line and has to be cut anyways.
        if (count >= start) {
            backupword += text[i]
        }

        switch (text[i]) {
            case "{":
                opensigns++;
                addtosubstring = true;
                break;

            case "}":
                opensigns--;
                addtosubstring = true;
                break;

            default:
                if (opensigns == 0) {
                    //lowercase letters are smaller then upper case letter so if we count them as 0,8125 the length
                    if (text[i].match(/[a-z]+/g)) {
                        count += 0.8125;
                    }
                    else {
                        if (text[i].match(/[A-Z]+/g)) {
                            count += 1;
                        }
                        else {
                            count += 0.2;
                            addtosubstring = true;
                        }
                    }
                }
                else {
                    addtosubstring = true;
                }
                break;
        }

        openword += text[i];

        if (addtosubstring) {
            if (count >= start) {
                substring += openword;
            }
            openword = "";
        }


        if (count >= (start + length)) {
            // Check if there are any actual signs in the message, if not add the openword to it.
            if (get_message_actual_length(substring, false) == 0) {
                substring += backupword;
            }
            break;
        }
    }
    return substring;
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
        case "peep_on_attraction":
            return -1; //Should be 6414 but the allignment is not right
            break;
        case "peep":
            return -1; //Should be 6414 but the allignment is not right
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
    var addwindow = ui.getWindow("Add Park Messages");
    var previewimage = addwindow.findWidget("previewimage");
    if (spritenum > 0) {
        previewimage.text = get_image_formatting(spritenum);
    }
    else {
        previewimage.text = "";
    }
}

function update_filter_top(amount) {
    var widget = ui.getWindow("Park Messages").findWidget("filter_top_spinner");
    filter_top = filter_top + amount
    
    if(filter_top < 0) {
        filter_top = 0;
    }

    widget.text = ""+filter_top;
}

function update_window_selectsubject(subjecttype) {
    var addwindow = ui.getWindow("Add Park Messages");
    // Set everything to invisible first
    addwindow.findWidget("label_guest").isVisible = false;
    addwindow.findWidget("guestid_textbox").isVisible = false;
    addwindow.findWidget("label_ride").isVisible = false;
    addwindow.findWidget("rideid_dropdown").isVisible = false;
    switch (subjecttype) {
        case "ride":
            addwindow.findWidget("label_ride").isVisible = true;
            addwindow.findWidget("rideid_dropdown").isVisible = true;
            break;
        case "guest":
            addwindow.findWidget("label_guest").isVisible = true;
            addwindow.findWidget("guestid_textbox").isVisible = true;
            break;
        default:
            break;
    }
}

function validate_selection() {
    if (selected_message == -1) {
        ui.showError("Park Message Manager:", "Select a message to delete first by clicking on it.")
        return false;
    }

    return true;
}

function validate_message() {
    if (new_subject_type === "guest") {
        if (map.getEntity(new_subject)) {
            if (map.getEntity(new_subject).peepType !== "guest") {
                ui.showError("Park Message Manager:", "Entity with id " + new_subject + " is not a guest so can't be selected.");
                return false;
            }
        }
        else {
            if (new_subject !== -1) {
                ui.showError("Park Message Manager:", "Couldn't find entity with id " + new_subject + " please enter a valid id.");
                return false;
            }
        }
    }
    if (get_message_actual_length(new_message_text, false) > 248) {
        ui.showError("Park Message Manager:", "Message is to long.");
        return false;
    }

    return true;
}

function add_image_window() {
    widgets = []

    window = ui.openWindow({
        classification: 'Add Image',
        title: "Select the image to add",
        width: 400,
        height: 175,
        x: 200,
        y: 100,
        colours: [12, 12], //12
        widgets: widgets
    });
}

function update_edit_message(edit_line) {
    var listwindow = ui.getWindow("Add Park Messages");
    var numlines = 7

    // Get all lines
    var activeline = 1;
    var line = "";
    var textbox = null;
    new_message_text = ""
    for (var i = 1; i <= numlines; i++) {
        textbox = listwindow.findWidget("message_textbox_line" + i);
        line = textbox.text;
        new_message_text += line.replace("{_NEWLINE}", "{NEWLINE}");

        if (line.length >= 70) {
            activeline++;

            // Move text which is to much to the next line
            if (i < numlines) {
                textbox.text = line.substring(0,70)
                listwindow.findWidget("message_textbox_line" + (i+1)).text = line.substring(70,line.length) + listwindow.findWidget("message_textbox_line" + (i+1)).text
            }
        }

    }

    // Check if current line is reduced to 0 length
    if (activeline == edit_line && listwindow.findWidget("message_textbox_line" + activeline).text.length == 0) {
        activeline--;
        if (activeline == 0) {
            activeline = 1
        }
    }

    // Check if activeline is not to big
    if (activeline > numlines) {
        activeline = numlines;
    }

    // Set the right line active
    for (i = 1; i <= numlines; i++) {
        if (i == activeline) {
            listwindow.findWidget("message_textbox_line" + i).isDisabled = false
            listwindow.findWidget("line_label" + i).text = ">"
        }
        else {
            listwindow.findWidget("message_textbox_line" + i).isDisabled = true
            listwindow.findWidget("line_label" + i).text = ""
        }
    }

    var preview = listwindow.findWidget("preview_message");
    preview.text = new_message_text;

    return activeline;
}

function add_message_window() {
    widgets = []

    var curline = 1;

    widgets.push({
        type: 'groupbox',
        name: 'box1',
        x: 5,
        y: 15,
        width: 590,
        height: 60,
        text: "Type"
    });

    widgets.push({
        type: "dropdown",
        name: "message_type_dropdown",
        x: 10,
        y: 30,
        width: 200,
        height: 15,
        items: messagetypes.map(function (type) {
            return type.name;
        }),
        selectedIndex: 0,
        onChange: function onChange(e) {
            new_message_type = messagetypes[e].name;
            new_subject_type = messagetypes[e].select;
            update_widget_previewimage(new_message_type);
            update_window_selectsubject(new_subject_type);
        }
    });

    widgets.push({
        type: "dropdown",
        name: "message_colour_dropdown",
        x: 10,
        y: 50,
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
        width: 25,
        height: 25,
        text: "{INLINE_SPRITE}{67}{20}{00}{00}"
    });

    widgets.push({
        type: 'label',
        name: 'label_guest',
        x: 250,
        y: 30,
        width: 145,
        height: 15,
        text: "Enter guest id (Sprite id)",
        isVisible: false
    });

    widgets.push({
        type: 'textbox',
        name: "guestid_textbox",
        x: 220,
        y: 50,
        width: 170,
        height: 15,
        maxLength: 100,
        onChange: function onChange(e) {
            new_subject = parseInt(e);
        },
        isVisible: false
    });

    widgets.push({
        type: 'label',
        name: 'label_ride',
        x: 250,
        y: 30,
        width: 145,
        height: 15,
        text: "Select the ride.",
        isVisible: true
    });

    widgets.push({
        type: 'dropdown',
        name: "rideid_dropdown",
        x: 220,
        y: 50,
        width: 170,
        height: 15,
        isVisible: true,
        items: map.rides.map(function (ride) {
            return [ride.id, ride.name].join(" - ");
        }),
        selectedIndex: -1,
        onChange: function onChange(e) {
            new_subject = parseInt(map.rides[e].id);
        }
    });

    widgets.push({
        type: 'button',
        name: "tinyfont",
        x: 5,
        y: 80,
        width: 20,
        height: 20,
        text: "{TINYFONT}A",
        onClick: function onClick() {
            var listwindow = ui.getWindow("Add Park Messages")
            var textbox = listwindow.findWidget("message_textbox_line" + curline);
            textbox.text = textbox.text + "{TINYFONT}"
        }
    });

    widgets.push({
        type: 'button',
        name: "SMALLFONT",
        x: 30,
        y: 80,
        width: 20,
        height: 20,
        text: "{SMALLFONT}A",
        onClick: function onClick() {
            var listwindow = ui.getWindow("Add Park Messages")
            var textbox = listwindow.findWidget("message_textbox_line" + curline);
            textbox.text = textbox.text + "{SMALLFONT}"
        }
    });

    widgets.push({
        type: 'button',
        name: "MEDIUMFONT",
        x: 55,
        y: 80,
        width: 20,
        height: 20,
        text: "{MEDIUMFONT}A",
        onClick: function onClick() {
            var listwindow = ui.getWindow("Add Park Messages")
            var textbox = listwindow.findWidget("message_textbox_line" + curline);
            textbox.text = textbox.text + "{MEDIUMFONT}"
        }
    });

    widgets.push({
        type: 'button',
        name: "NEWLINE",
        x: 80,
        y: 80,
        width: 20,
        height: 20,
        text: "/nr",
        onClick: function onClick() {
            var listwindow = ui.getWindow("Add Park Messages")
            var textbox = listwindow.findWidget("message_textbox_line" + curline);
            textbox.text = textbox.text + "{_NEWLINE}"
        }
    });

    widgets.push({
        type: 'button',
        name: "NEWLINE_SMALLER",
        x: 105,
        y: 80,
        width: 20,
        height: 20,
        text: "/n",
        onClick: function onClick() {
            var listwindow = ui.getWindow("Add Park Messages")
            var textbox = listwindow.findWidget("message_textbox_line" + curline);
            textbox.text = textbox.text + "{NEWLINE_SMALLER}"
        }
    });

    widgets.push({
        type: "dropdown",
        name: "colour_edit",
        x: 130,
        y: 80,
        width: 200,
        height: 20,
        items: messagecolours.map(function (colour) {
            return ("{" + colour + "}" + colour);
        }),
        selectedIndex: 6,
        onChange: function onChange(e) {
            var listwindow = ui.getWindow("Add Park Messages")
            var textbox = listwindow.findWidget("message_textbox_line" + curline);
            textbox.text = textbox.text + "{" + messagecolours[e] + "}"
        }
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox_line1",
        x: 15,
        y: 105,
        width: 580,
        height: 15,
        maxLength: 2000,
        isDisabled: false,
        onChange: function onChange(e) {
            curline = update_edit_message(1)
        }
    });

    widgets.push({
        type: 'label',
        name: 'line_label1',
        x: 5,
        y: 105,
        width: 10,
        height: 15,
        text: ">"
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox_line2",
        x: 15,
        y: 120,
        width: 580,
        height: 15,
        maxLength: 2000,
        isDisabled: true,
        onChange: function onChange(e) {
            curline = update_edit_message(2)
        }
    });

    widgets.push({
        type: 'label',
        name: 'line_label2',
        x: 5,
        y: 120,
        width: 10,
        height: 15,
        text: ""
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox_line3",
        x: 15,
        y: 135,
        width: 580,
        height: 15,
        maxLength: 2000,
        isDisabled: true,
        onChange: function onChange(e) {
            curline = update_edit_message(3)
        }
    });

    widgets.push({
        type: 'label',
        name: 'line_label3',
        x: 5,
        y: 135,
        width: 10,
        height: 15,
        text: ""
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox_line4",
        x: 15,
        y: 150,
        width: 580,
        height: 15,
        maxLength: 2000,
        isDisabled: true,
        onChange: function onChange(e) {
            curline = update_edit_message(4)
        }
    });

    widgets.push({
        type: 'label',
        name: 'line_label4',
        x: 5,
        y: 150,
        width: 10,
        height: 15,
        text: ""
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox_line5",
        x: 15,
        y: 165,
        width: 580,
        height: 15,
        maxLength: 2000,
        isDisabled: true,
        onChange: function onChange(e) {
            curline = update_edit_message(5)
        }
    });

    widgets.push({
        type: 'label',
        name: 'line_label5',
        x: 5,
        y: 165,
        width: 10,
        height: 15,
        text: ""
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox_line6",
        x: 15,
        y: 180,
        width: 580,
        height: 15,
        maxLength: 2000,
        isDisabled: true,
        onChange: function onChange(e) {
            curline = update_edit_message(6)
        }
    });

    widgets.push({
        type: 'label',
        name: 'line_label6',
        x: 5,
        y: 180,
        width: 10,
        height: 15,
        text: ""
    });

    widgets.push({
        type: 'textbox',
        name: "message_textbox_line7",
        x: 15,
        y: 195,
        width: 580,
        height: 15,
        maxLength: 2000,
        isDisabled: true,
        onChange: function onChange(e) {
            curline = update_edit_message(7)
        }
    });

    widgets.push({
        type: 'label',
        name: 'line_label7',
        x: 5,
        y: 195,
        width: 10,
        height: 15,
        text: ""
    });

    widgets.push({
        type: 'label',
        name: 'preview_label',
        x: 5,
        y: 213,
        width: 100,
        height: 15,
        text: "Preview:"
    });

    widgets.push({
        type: 'label',
        name: 'preview_message',
        x: 5,
        y: 225,
        width: 590,
        height: 50,
        text: "..."
    });

    widgets.push({
        type: 'button',
        name: "Add-messagetext-button",
        x: 5,
        y: 275,
        width: 390,
        height: 20,
        text: "Add the new message.",
        onClick: function onClick() {
            if (validate_message()) {
                add_message();
                window.close();
                update_widget_messagelist();
            }
        }
    });

    window = ui.openWindow({
        classification: 'Add Park Messages',
        title: "Add a park message",
        width: 600,
        height: 300,
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
        y: 40,
        width: 490,
        height: 280,
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

    // Filter
    widgets.push({
        type: 'checkbox',
        name: 'filter_archived',
        x: 5,
        y: 20,
        width: 200,
        height: 15,
        isChecked: true,
        text: "Only show archived messages.",
        onChange: function onChange(e) {
            filter_archived = !filter_archived
            update_widget_messagelist();
        }
    });

    widgets.push({
        type: 'label',
        name: 'filter_top_label',
        x: 360,
        y: 20,
        width: 35,
        height: 15,
        text: "Top:"
    });

    widgets.push({
        type: "spinner",
        name: "filter_top_spinner",
        x: 395,
        y: 20,
        width: 100,
        height: 15,
        text: ""+filter_top,
        onDecrement: function onDecrement(e) {
            update_filter_top(-1)
        },
        onIncrement: function onIncrement(e) {
            update_filter_top(1)
        }
    });

    // Operators
    widgets.push({
        type: 'button',
        name: "Remove-selected-button",
        x: 5,
        y: 325,
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
        y: 325,
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
        y: 325,
        width: 150,
        height: 20,
        text: "Add new Message",
        onClick: function onClick() {
            add_message_window();
        }
    });

    window = ui.openWindow({
        classification: 'Park Messages',
        title: "Park Message Manager 1.4 (by Levis)",
        width: 500,
        height: 350,
        x: 20,
        y: 50,
        colours: [12, 12], //12
        widgets: widgets,
        onClose: function onClose() {
            context.clearInterval(message_refresh);
        }
    });
}

var main = function () {
    // Add a menu item under the map icon on the top toolbar
    ui.registerMenuItem("Manage Park Messages", function () {
        message_refresh = context.setInterval(update_widget_messagelist, 1000);
        messages_window();
        update_widget_messagelist();
    });
};

registerPlugin({
    name: 'Park Message Manager',
    version: '1.3',
    authors: ['AutoSysOps (Levis)'],
    type: 'remote',
    licence: 'MIT',
    targetApiVersion: 34,
    main: main
});
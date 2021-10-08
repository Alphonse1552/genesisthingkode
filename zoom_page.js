var random_string = function(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
};

var pad = function (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// get around Zoom.US tracking via sendUserBehavior
var btnCopyForGenesisClassName = random_string(12);
var btnCopyForGenesisID = random_string(12);
var btnOpenMostRecentID = random_string(12);
var btnDataAttendeesWrapperClass = random_string(12);

// get around zoom locking us out from too many requests(???)
var zoom_url = "https://us02web.zoom.us/account/my/report/participants/list?meetingId=";
var zoom_urls = ["https://us02web.zoom.us/account/my/report/participants/list?meetingId=",
                 "https://zoom.us/account/my/report/participants/list?meetingId="];
//var zoom_url = "https://zoom.us/account/my/report/participants/list?meetingId=";
//var zoom_urls = ["https://zoom.us/account/my/report/participants/list?meetingId=","https://us02web.zoom.us/account/my/report/participants/list?meetingId="];
var zoom_url_index = 0;
var zoom_url_tries = 0;

$("#searchMyButton").parent().append("<button id=\""+btnOpenMostRecentID+"\" class=\"btn btn-primary\" onclick='return false;' style='display:none;'>Open Most Recent Meeting</button>");
$("#"+btnOpenMostRecentID).toggle("highlight");

$("#"+btnOpenMostRecentID).on('click',function(e){
  $("#meeting_list").find("tr").last().find("a")[0].click();
  console.log("clicked");
});
$("a[data-attendees]").on('click',function(){
  setTimeout(function(){
    $("#attendees-dialog-container").animate({top:$("div.content-body").offset().top},'slow');
  },100);
});


var toggleDisplay = false;
var deBounce = false;

var updateContent = function(){
  //$("#withMeetingHeaderDiv").find("input").click();
  //$("#selectUniqueDiv").find("input").click();
  //$("#attendees-dialog-container").find(".modal-header").find("h3").parent().append("<h4>"+meeting_data[1].param_value+"</h4>");

  $("#attendees-dialog-container").find(".modal-header").find("h3").parent().append();

  if ($("#"+btnCopyForGenesisID).length == 0) {
    $("#attendees-dialog-container").find("div.ta-right").eq(0).prepend("<button id=\""+btnCopyForGenesisID+"\" class=\"btn btn-primary\" style='min-width:156px;display:none;'>Copy For Genesis</button>");
    $("#attendees-dialog-container").find("div.ta-right").eq(0).prepend("<span id=\"confirmCopyForGenesis\" style='display:none;margin-right:5px;font-size:20px;font-weight:bold;vertical-align:middle;'>Attendance Copied for Genesis!</span>");
    $("#"+btnCopyForGenesisID).toggle("highlight");

  }
  else if ($("#"+btnCopyForGenesisID).css("display") == "none") {
    $("#"+btnCopyForGenesisID).toggle("highlight");
    $("#confirmCopyForGenesis").toggle("highlight");
  }

  //if ($("#btnTest").length == 0) {
  //  $("#attendees-dialog-container").find("div.ta-right").eq(0).prepend("<button id=\"btnTest\" class=\"btn btn-primary\">Test</button>");
  //}
  var meeting_data = [];
  $("#attendees-dialog-container").find("div#meetingInfo").children().each(function(){
    var param_name = $(this).children().eq(0).text().trim();
    var param_value = $(this).children().eq(1).text().trim();
    meeting_data.push({param_name:param_name,param_value:param_value});
  });
  console.log(meeting_data);

  var attendee_data = [];
  $("#attendees-dialog-container").find("tr").each(function(){
    var name = $(this).children().eq(0).text().trim();
    var email = $(this).children().eq(1).text().trim();
    var join_time = $(this).children().eq(2).text().trim();
    var leave_time = $(this).children().eq(3).text().trim();
    var duration = $(this).children().eq(4).text().trim();
    attendee_data.push({name:name,email:email,join_time:join_time,leave_time:leave_time,duration:duration});
  });
  attendee_data.shift(); // remove the first header column
  console.log(attendee_data);

  // process data for pasting later, consolidate similar results.
  var attendee_data_trunc = [];
  var attendee_uniquenames = [];
  for (var i = 0; i < attendee_data.length; i++) {
    if (attendee_uniquenames.indexOf(attendee_data[i].name) == -1) {
      attendee_uniquenames.push(attendee_data[i].name);
    }
  }
  console.log("Unique Names:");
  attendee_uniquenames.sort();
  console.log(attendee_uniquenames);

  var attendee_data_compressed = [];
  for (var i = 0; i < attendee_uniquenames.length; i++) {
    var entry_indexes = [];
    var duration = 0;
    var join_time = "";
    var leave_time = "";
    var email = "";
    for (var j = 0; j < attendee_data.length; j++) {
      //console.log(attendee_data[j].name + " vs. " + attendee_uniquenames[i]);
      if (attendee_data[j].name == attendee_uniquenames[i]) {
        entry_indexes.push(j);
      }
    }
    //console.log("entry indexes for " + attendee_uniquenames[i]);
    //console.log(entry_indexes);
    for (var j = 0; j < entry_indexes.length; j++) {
      var date1 = new Date(attendee_data[entry_indexes[j]].join_time);
      var date2 = new Date(join_time);
      if (date1 < date2) { join_time = date1.toLocaleString(); }
      date1 = new Date(attendee_data[entry_indexes[j]].leave_time);
      date2 = new Date(leave_time);
      if (date1 > date2) { leave_time = date1.toLocaleString(); }
      if (attendee_data[entry_indexes[j]].email.length > email.length) { email = attendee_data[entry_indexes[j]].email; }
      duration += parseInt(attendee_data[entry_indexes[j]].duration);
    }
    attendee_data_compressed.push({
      name:attendee_uniquenames[i],
      email:email,
      join_time:join_time,
      leave_time:leave_time,
      duration:duration.toString()
    });
  }
  console.log("Truncated Data:");
  console.log(attendee_data_compressed);


  var zoom_data = {status:"valid",meeting_data:meeting_data,attendee_data:attendee_data,attendee_data_filtered:attendee_data_compressed};
  $("#"+btnCopyForGenesisID).off('click').on('click',function(){
    $(this).html("Copying...");
    setTimeout(function(){
      chrome.storage.local.set({'CopyForGenesisData':zoom_data}, function() {
        $("#"+btnCopyForGenesisID).html("Data copied!");
        setTimeout(function(){
          $("#"+btnCopyForGenesisID).html("Copy For Genesis");
          setTimeout(function(){
            $("#"+btnCopyForGenesisID).toggle("highlight");

            $("#confirmCopyForGenesis").toggle("highlight");
            // also, grey out the main page button corresponding to this open modal.
            var start_time = meeting_data[4].param_value; // match the start time to find it.
            $("#meeting_list").find("tr:contains('"+start_time+"')").find("."+btnCopyForGenesisClassName)

            $("#meeting_list").find("tr:contains('"+start_time+"')").find("."+btnCopyForGenesisClassName).removeClass("btn-primary");
            $("#meeting_list").find("tr:contains('"+start_time+"')").find("."+btnCopyForGenesisClassName).prop("disabled",true);
            $("#meeting_list").find("tr:contains('"+start_time+"')").find("."+btnCopyForGenesisClassName).html("Attendance Copied!");
            $("."+btnCopyForGenesisClassName).not($("#meeting_list").find("tr:contains('"+start_time+"')").find("."+btnCopyForGenesisClassName)[0]).prop("disabled",false);
            $("."+btnCopyForGenesisClassName).not($("#meeting_list").find("tr:contains('"+start_time+"')").find("."+btnCopyForGenesisClassName)[0]).addClass("btn-primary");
            $("."+btnCopyForGenesisClassName).not($("#meeting_list").find("tr:contains('"+start_time+"')").find("."+btnCopyForGenesisClassName)[0]).html("Copy For Genesis");
          },250);
        },650);
      });
    },350);


  });
  $("#btnTest").off('click').on('click',function(){
    // set fake data for testing purposes.
    chrome.storage.local.set({'CopyForGenesisData':{
      status:"valid",
      meeting_data:{
        0:{param_name: "Meeting ID", param_value: "828 2506 6693"},
        1:{param_name: "Topic", param_value: "Physics CPC Period 1"},
        2:{param_name: "User Email", param_value: "ahogan@bernardsboe.com"},
        3:{param_name: "Duration (Minutes)", param_value: "10"},
        4:{param_name: "Start Time", param_value: "09/04/2020 06:55:35 AM"},
        5:{param_name: "End Time", param_value: "09/04/2020 07:05:16 AM"},
        6:{param_name: "Participants", param_value: "2"}
      },
      attendee_data:{}
    }}, function() {});
  });
};

$("body").bind("DOMSubtreeModified", function() {
    //console.log("tree changed");
    //console.log("Length: " + $("#attendees-dialog-container").length);
    if (toggleDisplay == false && $("#attendees_list_body").length == 1 && !deBounce) {
      toggleDisplay = true;
      deBounce = true;
      setTimeout(function(){deBounce = false;updateContent();},250);

    }
    else if (toggleDisplay == true && $("#attendees_list_body").length == 0) {
      toggleDisplay = false;
    }
});

$(window).focus(function(){
  if ($("#confirmCopyForGenesis").is(":visible")) {
    // check if copied data has been invalidated by chrome, if so re-enable the copy button.
    chrome.storage.local.get('CopyForGenesisData',function(data) {
      // 1. Get Stored Zoom data.
      if (Object.entries(data).length == 0) {
        $("#"+btnCopyForGenesisID).toggle("highlight");
        $("#confirmCopyForGenesis").toggle("highlight");
      }
    });
  }
});


//// new code here

/// ZOOM.US WILL BLOCK YOU FOR DOING THIS
/// ZOOM.US sends a "COMPLETELY INNOCENT, FOR DEVELOPERS ONLY WE PROMISE!!" packet of data to /sendUserBehavior
/// I named my buttons with a class of "btnCopyForGenesis" (so I could do .btnCopyForGenesis to apply the click to all of them)
/// it worked! BUT within 10 MINUTES I was getting an error that the request was NOT ALLOWED

/// so I changed the class to a chinese phrase that means "Voice for America": 美国之音
/// see this: https://citizenlab.ca/2014/12/repository-censored-sensitive-chinese-keywords-13-lists-9054-terms/
/// hopefully it means that phrase, thus that data, will not reach the human in china who will then block my extension.
/// LOL

$("#meeting_list").find("tr").each(function(index,value){
  if (index == 0) {
    $(this).children().eq(0).after("<th scope=\"col\" class=\"colue\" data-column=\"table.cp\">Copy</th>");
  }
  else {
    $(this).children().eq(0).after("<td style='min-width:278px;'><button class=\"btn btn-primary "+btnCopyForGenesisClassName+"\" style='min-width:156px;display:none;transition:background 0.5s ease-in-out;'>Copy For Genesis</button></td>");
  }

});
$("."+btnCopyForGenesisClassName).toggle("highlight");
$("."+btnCopyForGenesisClassName).on('click',function(){
  var self = this;
  var data_id = $(this).parent().parent().find("a").attr("data-id");
  var data_accountid = $(this).parent().parent().find("a").attr("data-accountid");
  $(this).html("Copying...");
  $.ajax(zoom_url+encodeURIComponent(data_id)+"&accountId="+encodeURIComponent(data_accountid)).done(function(json){
    console.log(json);
    var meeting_data = [];
    meeting_data.push({param_name:"Meeting ID",param_value:json['meetingReport'].formattedNumber});
    meeting_data.push({param_name:"Topic",param_value:json['meetingReport'].topic});
    meeting_data.push({param_name:"User Email",param_value:json['meetingReport'].email});
    meeting_data.push({param_name:"Duration (Minutes)",param_value:json['meetingReport'].duration});
    meeting_data.push({param_name:"Start Time",param_value:json['meetingReport'].startTimeStr});
    meeting_data.push({param_name:"End Time",param_value:json['meetingReport'].endTimeStr});
    meeting_data.push({param_name:"Participants",param_value:json['meetingReport'].attendeeCount});
    /// done with meeting_data
    // next, translate attendee data....
    var attendee_data = [];
    for (var i = 0; i < json['attendees'].length; i++) {
      attendee_data.push({name:json['attendees'][i].name,email:(json['attendees'][i].email==null?"":json['attendees'][i].email),join_time:json['attendees'][i].joinTimeStr,leave_time:json['attendees'][i].leaveTimeStr,duration:json['attendees'][i].duration});
    }
    var attendee_uniquenames = [];
    for (var i = 0; i < attendee_data.length; i++) {
      if (attendee_uniquenames.indexOf(attendee_data[i].name) == -1) {
        attendee_uniquenames.push(attendee_data[i].name);
      }
    }
    console.log("Attendee Data:",attendee_data);
    console.log("Unique Names: ",attendee_uniquenames);
    var attendee_data_compressed = [];
    for (var i = 0; i < attendee_uniquenames.length; i++) {
      var entry_indexes = [];
      var duration = 0;
      var join_time = "";
      var leave_time = "";
      var email = "";
      for (var j = 0; j < attendee_data.length; j++) {
        //console.log(attendee_data[j].name + " vs. " + attendee_uniquenames[i]);
        if (attendee_data[j].name == attendee_uniquenames[i]) {
          entry_indexes.push(j);
        }
      }
      //console.log("entry indexes for " + attendee_uniquenames[i]);
      //console.log(entry_indexes);
      for (var j = 0; j < entry_indexes.length; j++) {
        var date1 = new Date(attendee_data[entry_indexes[j]].join_time);
        var date2 = new Date(join_time);
        if (date1 < date2) { join_time = date1.toLocaleString(); }
        date1 = new Date(attendee_data[entry_indexes[j]].leave_time);
        date2 = new Date(leave_time);
        if (date1 > date2) { leave_time = date1.toLocaleString(); }
        if (typeof attendee_data[entry_indexes[j]].email == 'undefined') { attendee_data[entry_indexes[j]].email = ""; }
        if (attendee_data[entry_indexes[j]].email.length > email.length) { email = attendee_data[entry_indexes[j]].email; }
        duration += parseInt(attendee_data[entry_indexes[j]].duration);
      }
      attendee_data_compressed.push({
        name:attendee_uniquenames[i],
        email:email,
        join_time:join_time,
        leave_time:leave_time,
        duration:duration.toString()
      });
    }
    console.log("Compressed Data: ",attendee_data_compressed);
    var zoom_data = {status:"valid",meeting_data:meeting_data,attendee_data:attendee_data,attendee_data_filtered:attendee_data_compressed};
    chrome.storage.local.set({'CopyForGenesisData':zoom_data}, function() {
      console.log("Data has been set...");
      console.log(zoom_data);
      setTimeout(function(){
        $(self).html("Success!");
        setTimeout(function(){
          $(self).html("Attendance Copied!");
          setTimeout(function(){
            $(self).removeClass("btn-primary");
            $(self).prop("disabled",true);
            $("."+btnCopyForGenesisClassName).not(self).prop("disabled",false);
            $("."+btnCopyForGenesisClassName).not(self).addClass("btn-primary");
            $("."+btnCopyForGenesisClassName).not(self).html("Copy For Genesis");
          },250);
        },650);
      },350);

    });


  }).fail(function(){
    // Zoom locked us out because of too many requests in a short period of time.

    // swap zoom url to get around server lock
    //for (var i = 0; i < zoom_urls.length; i++) {
    //  if (zoom_url != zoom_urls[i]) { zoom_url = zoom_urls[i]; break; }
    //}
    zoom_url_index++;
    if (zoom_url_index >= zoom_urls.length) { zoom_url_index = 0; }
    if (zoom_url_tries > 5) {
      // don't try more than 5 times per page load.
      setTimeout(function(){
        $(self).html("Too Many Requests. Try Again.");
        zoom_url_tries = 0;
      },250);
    }
    else {
      zoom_url = zoom_urls[zoom_url_index];
      $(self).click();
    }
    zoom_url_tries++;
    console.log("Zoom link changed to: " + zoom_url);
  }).always();
});

/// quality of life improvements....


// hide all the useless things NO ONE cares about...
$("[data-column='table.st'],[data-column='table.ue'],[data-column='table.mi'],[data-column='table.un'],[data-column='table.dept'],[data-column='table.group'],[data-column='table.ut'],[data-column='table.ct'],[data-column='table.et'],[data-column='table.s']").hide();

// add in human readable time.

$("#meeting_list").find("tr").each(function(index,value){
  if (index == 0) {
    $(this).children().eq(1).after("<th scope=\"col\" class=\"colue\" data-column=\"table.cp\">Start Time</th>");
  }
  else {
    var hr_text = "";
    var old_text = $(this).find("[data-column='table.st']").text().trim();
    var date = new Date(old_text);
    hr_text = (date.getHours() > 12?date.getHours()-12:date.getHours()) + ":" + pad(date.getMinutes(),2) + (date.getHours() > 12?"pm":"am") + " on " + (date.getMonth()+1)+"/"+date.getDate();
    $(this).children().eq(1).after("<td style='min-width:278px;'><div class='ellipsis'>"+hr_text+"</div></td>");
  }

});


//// add in period number or Advisory
$("#meeting_list").find("tr").each(function(index,value){
  if (index == 0) {
    $(this).children().eq(1).after("<th scope=\"col\" class=\"colue\" data-column=\"table.cp\">Period</th>");
  }
  else {
    var hr_text = "";
    var old_text = $(this).find("[data-column='table.st']").text().trim();
    var date = new Date(old_text);

    //hr_text = (date.getHours() > 12?date.getHours()-12:date.getHours()) + ":" + pad(date.getMinutes(),2) + (date.getHours() > 12?"pm":"am") + " on " + (date.getMonth()+1)+"/"+date.getDate();
    var min_of_day = date.getHours()*60+date.getMinutes();
    if (date.getDay() == 1 || date.getDay() == 4) {
      var counts = [455, 510, 565, 620, 675],
        goal = min_of_day;

      var closest = counts.reduce(function(prev, curr) {
        return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
      });
      if (closest == 455) { hr_text = "1"; } else if (closest == 510) { hr_text = "2"; } else if (closest == 565) { hr_text = "3"; } else if (closest == 620) { hr_text = "4"; } else if (closest == 675) { hr_text = "A"; }
    }
    else if (date.getDay() == 2 || date.getDay() == 5) {
      var counts = [455, 510, 565, 620, 675],
        goal = min_of_day;

      var closest = counts.reduce(function(prev, curr) {
        return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
      });
      if (closest == 455) { hr_text = "5"; } else if (closest == 510) { hr_text = "6"; } else if (closest == 565) { hr_text = "7"; } else if (closest == 620) { hr_text = "8"; } else if (closest == 675) { hr_text = "9"; }
    }
    else if (date.getDay() == 3) {
      var counts = [480, 520, 560, 600, 640, 680, 720, 760, 800],
        goal = min_of_day;

      var closest = counts.reduce(function(prev, curr) {
        return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
      });
      if (closest == 480) { hr_text = "1"; } else if (closest == 520) {hr_text="2";} else if (closest == 560) {hr_text="3";} else if (closest == 600) {hr_text="4";}
       else if (closest == 640) {hr_text="5";} else if (closest == 680) {hr_text="6";} else if (closest == 720) {hr_text="7";}
        else if (closest == 760) {hr_text="8";} else if (closest == 800) {hr_text="9";}
    }

    $(this).children().eq(1).after("<td style=''><div class='ellipsis'>"+hr_text+"</div></td>");
  }

});

/// change the anchor links to attendance to be bigger and easier to read.
$("a[data-attendees]").wrap("<button class='"+btnDataAttendeesWrapperClass+"' style='min-width:47px;padding-top:3px;padding-bottom:3px;padding-right:7px;padding-left:7px;'></button>");
$("a[data-attendees]").css("font-weight","bold");
$("a[data-attendees]").css("font-size","16px");
$("."+btnDataAttendeesWrapperClass).on('click',function(){
 $(this).find("a")[0].click();
});


/// change the Topic column to be easier to read..
$(".ellipsis").css("font-size","18px");
$(".ellipsis").css("font-weight","bold");

/// get rid of toggle columns dropdown because it's not needed anymore.
$("#meetingDropdownMenu").parent().hide();

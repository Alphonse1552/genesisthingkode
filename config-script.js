window.onload = function() {
  document.querySelector("#GC_allowNonReturnedGrades").addEventListener('click',function(){
    var state = document.querySelector("#GC_allowNonReturnedGrades").checked;
    //chrome.runtime.sendMessage({message:'GC_opt_allowNonReturnedGrades',state:state},function(response){
      //console.log("Sent Opt1");
    //});
    saveSettings();
  });
  chrome.storage.sync.get(["GGC-options"],function(data) {
    console.log("Result of Sync Get GCC-options in config screen:",data);
    var options = data["GGC-options"] || {};
    if (typeof options.allowNonReturnedGrades != 'undefined') {
      document.querySelector("#GC_allowNonReturnedGrades").checked = options.allowNonReturnedGrades;
    }
    if (typeof options.numShowCoursework != 'undefined') {
      $("#GC_numShowCoursework").val(options.numShowCoursework);
    }
    if (typeof options.letterRanges != 'undefined') {

    }
    else { $("#GC_numShowCoursework").val(40); }
  });
};

$(document).ready(function(){
  $("#version").html(chrome.runtime.getManifest().version);
  idleStart();
  chrome.runtime.sendMessage({message:'list_courses_raw'},function(response){
    //console.log("Sent message 'list_courses', Got response: ", response);
  });
  $("#deleteMem").on('click',function(){

    areYouSure("Are you sure you want to reset all your Genesis: Google Chrome settings? All your settings will be lost.",function(result){
      if (result == "yes") {
        chrome.storage.sync.remove(['GGC-options'],function(){
          console.log("Removed GGC-options from Memory");
          location.reload();
        });
      }
    });
  });
  $("#GC_numShowCoursework").spinner({min:5,max:100,step:5});
  $("#GC_numShowCoursework").on('spinstop',function(){
    if (parseInt($(this).val()) < 1) { $(this).val("1"); }
    if (parseInt($(this).val()) > 100) { $(this).val("100"); }
    saveSettings();
  });

  /*
  var range = [
    {
      id:1,
      startValue:10,
      endValue:20,
      color:"#ff0000",
      name: "B"
    },
    {
      id:2,
      startValue:30,
      endValue:40,
      color:"#00ff00",
      name:"A"
    }
    ,
    {
      id:3,
      startValue:50,
      endValue:60,
      color:"#00ff00",
      name:"A"
    }
    ,
    {
      id:4,
      startValue:70,
      endValue:75,
      color:"#00ff00",
      name:"A"
    }
    ,
    {
      id:5,
      startValue:80,
      endValue:85,
      color:"#00ff00",
      name:"A"
    }
    ,
    {
      id:6,
      startValue:90,
      endValue:96,
      color:"#00ff00",
      name:"A"
    }
  ];
  var vals = [10,20,30,40,50,60,70,80,90];
  $("#slider-alpha").rangeSlider({
    min: 0,
    max: 100,
    sections:12,
    ranges:range,
    vals:vals,
    overlap:false,
    color1:"#ffff00"
  });
  */
  $("button").button();
  $("input[type='checkbox']").checkboxradio();
});



var saveSettings = function() {
  var info = $("#tblCourses tr").has("td").map(function(a){return {id:$(this).attr('courseId'),index:($(this).index()-1),name:$(this).text(),show:$(this).find("input[id^='showCourse']").is(":checked")};}).toArray();
  var opt_allowNonReturnedGrades = document.querySelector("#GC_allowNonReturnedGrades").checked;
  var opt_numShowCoursework = $("#GC_numShowCoursework").val();
  //console.log("Config info:",info);
  //console.log("allowNonReturnedGrades:",opt_allowNonReturnedGrades);
  var newOpts = {
    allowNonReturnedGrades: opt_allowNonReturnedGrades,
    course_info:info,
    numShowCoursework: parseInt(opt_numShowCoursework)
  };
  console.log("Request to update settings to: ",newOpts);
  var data = {};
  data['GGC-options'] = newOpts;
  chrome.storage.sync.set(data, function() {
    console.log("Saved options:",data);
  });
};

var displayCourses = function(courses) {
  // course_info is null on initial setting.
  var buf = '';
  buf += "<legend>My Courses (Drag and Drop to re-order in Genesis)</legend><table id='tblCourses' style='width:60%;margin:auto;border:1px solid #222;border-radius:5px;padding-bottom:5px;background-color:rgba(255,255,255,0.7);margin-top:10px;margin-bottom:10px;'>";
  buf += "<thead>";
  buf += "<tr>";
  buf += "<th></th>";
  buf += "<th>Course Name</th><th>Show in Genesis?</th>";
  buf += "</tr>";
  buf += "</thead>";
  buf += "<tbody>";

  for (var i = 0; i < courses.length; i++) {
    buf += "<tr courseId='"+courses[i].id+"'>";
    buf += "<td><span class='ui-icon ui-icon-arrowthick-2-n-s'></span></td>";
    var statusFlag = "";
    if (courses[i].courseState == "ARCHIVED") { statusFlag = "<b>(archived)</b>"; }
    buf += "<td style='cursor:pointer;'>" + courses[i].name + " " + (typeof courses[i].section == 'undefined'?"":courses[i].section) + " " + statusFlag + "</td>";
    checkFlag = "";
    if (typeof courses[i].show != 'undefined') {
      if (courses[i].show == true) { checkFlag = "checked"; }
    }
    buf += "<td style='text-align:center;'>" + "<label for='showCourse-"+courses[i].id+"'></label><input type='checkbox' id='showCourse-"+courses[i].id+"' "+checkFlag+">" + "</td>";
    buf += "</tr>";
  }
  buf += "</tbody></table>";
  $("#fieldCourses").html(buf);
  $("#tblCourses tbody").sortable({update:function(){
    saveSettings();
  }});
  $("#tblCourses input[type='checkbox']").checkboxradio();
  $("#tblCourses input[type='checkbox']").on('change',function(){
    saveSettings();
  });

};

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  if (request.message == "payload_courses") {
    chrome.storage.sync.get(["GGC-options"],function(data) {
      console.log("Result of Sync Get GCC-options in config screen:",data);
      var options = data["GGC-options"] || {};
      if (typeof options.course_info == 'undefined') {
        // IF there is no settings saved, evaluate the default and set them.
        for (var i = 0; i < request.courses.length; i++) {
          if (request.courses[i].courseState == "ACTIVE") { request.courses[i].show = true; }
          else { request.courses[i].show = false; }
          request.courses[i].index = i;
        }
      }
      console.log("Got courses:",request.courses);
      idleStop();
      displayCourses(request.courses);

    });

    sendResponse("success");
  }

  return true;
});

var areYouSure = function(text,callbackFn) {
  var buf = '';
  buf += "<div id='GC_areYouSure' style='z-index:3;position:fixed;left:0px;top:0px;width:100%;height:100%;overflow:auto;background-color:rgba(0,0,0,0.4);'>";
  buf += "<div style='z-index:4;user-select:none;font-weight:bold;font-size:22px;color:rgba(100,18,18,1.0);text-align:center;line-height:100%;background:rgba(255,255,255,1.0);border:1px solid #000;border-radius:25px;position:fixed;left:30%;top:30%;width:35%;height:30%;transition:transform 0.25s ease-in-out;transofrm: scale(0);' id=''>";

  buf += "<div class='GC_errorMsg' style='padding:15px;display:inline-block;'>" + text + "</div>";
  buf += "<div style='padding-top:30px;'>";
  buf += "<button value='yes' id='aYS_Yes' style='min-width:120px;padding:9px;margin-right:18px;'>Yes, I am sure.</button>";
  buf += "<button value='no' id='aYS_No' style='min-width:120px;padding:9px;'>No.</button>";
  buf += "</div>";
  buf += "</div>";
  buf += "</div>";
  $("body").append(buf);
  setTimeout(function(){$("#GC_areYouSure").css("transform","scale(1)");},100);
  $("#aYS_Yes,#aYS_No").on('click',function(){
    callbackFn($(this).val());
    $("#GC_areYouSure").remove();
  });
};

var timerIdle = null;

var idleStart = function() {
  // begin idling while gapi loads things...
  if (timerIdle != null) { clearInterval(timerIdle); }
  var idleChar = "~";
  $("#coursesLoading").html(idleChar);
  timerIdle = setInterval(function(){
    $("#coursesLoading").append(idleChar);
    if ($("#coursesLoading").text() == idleChar.repeat(9)) {
      $("#coursesLoading").html("");
    }
  },150);
};
var idleStop = function() {
  // stop idling.
  clearInterval(timerIdle);
  timerIdle = null;
  $("#coursesLoading").html("");
};

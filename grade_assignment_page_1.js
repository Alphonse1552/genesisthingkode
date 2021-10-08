// things to cache into chrome.storage.local ...
// email addresses from Genesis, email -> Name connection
// google user IDs to email connection.
var search = location.search.substring(1);
var qs = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
var ident = qs.courseCode + "/" + qs.courseSection;
//console.log("IDENT: " + ident);

var students = [];
//$(".listroweven,.listrowodd").not("[id]").not(":last-child").each(function(){
//  var id = $(this).children().eq(0).text().trim();
//});

var pastingCourseWork;

var timerIdle = null;

var idleStart = function() {
  // begin idling while gapi loads things...
  if (timerIdle != null) { clearInterval(timerIdle); }
  var idleChar = "•";
  $("#PasteFromGoogleClassroom").html(idleChar);
  timerIdle = setInterval(function(){
    $("#PasteFromGoogleClassroom").append(idleChar);
    if ($("#PasteFromGoogleClassroom").text() == idleChar.repeat(9)) {
      $("#PasteFromGoogleClassroom").html("");
    }
  },150);
};
var idleStop = function() {
  // stop idling.
  clearInterval(timerIdle);
  timerIdle = null;
  $("#PasteFromGoogleClassroom").html("Google<br>Classroom");
};

$("<td><button id='PasteFromGoogleClassroom' style='min-width:85px;margin-right:4px;display:flex,table-cell;float:left;height:35px;transition: opacity 0.5s ease-in-out;' class='formButton'>Google Classroom</button></td>").insertBefore($("#__submit1__").parent().parent().parent().parent().children().eq(1));

$("#PasteFromGoogleClassroom").off('click').on('click',function(){
  idleStart();
  chrome.runtime.sendMessage({message:'list_courses'},function(response){
    //console.log("Sent message 'list_courses', Got response: ", response);
  });
  return false;
});

/// lock out Google Classroom button until student emails are loaded.
chrome.storage.local.get(["GGC-" + ident],function(data) {
  // check stored data. if it exists, and each student name appears in it, and the length is the same, keep the data and enable GC.
  // if not a match, reload student emails then store the result for later.
  //console.log("Contents of stored key GCC-"+ident,data);
  var students_on_page = $("table.list").find("tr.listroweven,tr.listrowodd").not("[id],:last-child").map(function(){return {btid:$(this).children().eq(0).text().trim(),name:$(this).children().eq(1).text().trim(),email:"",loaded:false,id:""};}).toArray();
  var students_in_storage = [];
  if (Object.keys(data).length > 0) {
    students_in_storage = data['GGC-'+ident];
  }
  // check to make sure every name on the page exists in storage. if not, reload all emails.
  var students_on_page_names = $.map(students_on_page,function(a){return a.name;});
  var students_in_storage_names = $.map(students_in_storage,function(a){return a.name;});
  if (students_on_page.length == students_in_storage.length) {
    // first, length has to match. next, names have to match. someone could of added and dropped.
    var differences = [];
    for (var i = 0; i < students_on_page_names; i++) {
      if (students_in_storage_names.indexOf(students_on_page_names[i]) != -1) { differences.push(students_on_page_names[i]); }
    }
    if (differences.length == 0) {
      // the students in storage MATCH COMPLETELY the students on the page. use what you got.
      students = students_in_storage;
      //console.log("Students in Storage PASSED check:",students);
      return;
    }
  }
  // if we got here, then the students in storage did NOT match what's on the page. so students need to be reloaded.
  students = students_on_page; // this sets up the array, with loaded = false, blank emails, blank google id, etc.
  //console.log("Students in Storage FAILED check:",students);
  // disable GC until they are all loaded.
  $("#PasteFromGoogleClassroom").css("opacity","0.3");
  $("#PasteFromGoogleClassroom").prop("disabled",true);
  loadStudentEmails(function(){
    // one student was loaded. use this to update visually if needed.
    var nLoaded = 0;
    for (var i = 0; i < students.length; i++) { if (students[i].loaded == true) { nLoaded++; }}
    $("#PasteFromGoogleClassroom").html(nLoaded+"/"+students.length+"<br>Loaded");
  },function(){
    // all students are loaded. enable GC
    //console.log("Loaded All student Emails",students);
    $("#PasteFromGoogleClassroom").html("Google<br>Classroom");
    $("#PasteFromGoogleClassroom").css("opacity","1.0");
    $("#PasteFromGoogleClassroom").prop("disabled",false);
    var data4 = {};
    data4["GGC-" + ident] = students;
    chrome.storage.local.set(data4, function() {
      if(!chrome.runtime.lastError){
        //console.log('Saved', data4);
      }
      else {
        //console.log("Not Saved",data4);
      }
    });
  });

});


$("head").append(`<style>
  .grayOnHover:hover {
    background:rgba(100,0,255,0.2);
  }
  .stayGray {
    background:rgba(100,0,255,0.2);
  }
  img.top-img,img.bot-img {
    position:absolute; transition: opacity 0.4s ease-in-out;
  }
  img.top-img { z-index:27; opacity: 0; }
  img.bot-img { }
  .GC_errorMsg:before {
    content: "";
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  }
  #advOptions:hover {
    text-decoration: underline;
  }
  </style>`);

var popupCoursesDropdown = function(courses) {

  var buf = "<div style='background:rgba(255,255,255,1.0); display:none;transition:opacity 0.4s ease-in-out;z-index:22;position:absolute;border:1px solid #000;border-radius:5px;' id='dropDown_GC'>";
  buf += "<div id='dropDown_GC_UL' style='margin-top:0px;margin-bottom:0px;'>";
  for (var i = 0; i < courses.length; i++) {
    buf += "<div course_id='"+courses[i].id+"' class='GC_menuitem grayOnHover' style='user-select:none;cursor:pointer;padding-left:7px;padding-right:7px;padding-top:4px;padding-bottom:4px;font-size:16px;font-weight:bold;' icourse='"+i+"'>";
    buf += "<table width=100%><tr><td>";
    buf += courses[i].name;
    buf += "</td><td width=28><div style='height:28px;'><img class='bot-img' src='"+chrome.extension.getURL("caret1.png")+"'><img class='top-img' src='"+chrome.extension.getURL("caret2.png")+"'></div></td>";
    buf += "</tr></table>";
    buf += "<div>";
    if (typeof courses[i].section != 'undefined') {
      buf += "<span style='text-align:right;font-size:11px;padding-left:25px;'>" + courses[i].section + "</span>";
    }
    buf += "</div>";
    buf += "</div>";
  }
  // add in div to go to config screen.
    buf += "<div class='' style='user-select:none;cursor:pointer;padding-left:17px;padding-right:7px;padding-top:0px;padding-bottom:8px;font-size:16px;font-weight:bold;'>";
    buf += "<a style='font-size:11px;font-style:italic;color:#0000ff;' id='advOptions' href=''>" + "Configure this menu..." + "</a>";
    buf += "</div>";
  buf += "</div>";
  buf += "</div>";
  $("body").append(buf);
  $("#dropDown_GC").css("left",$("#PasteFromGoogleClassroom").offset().left);
  $("#dropDown_GC").css("top",$("#PasteFromGoogleClassroom").offset().top+$("#PasteFromGoogleClassroom").height()+3);
  $("#dropDown_GC").show();
  var h = $("#dropDown_GC")[0].scrollHeight;
  $("#dropDown_GC").height(0);
  $("#dropDown_GC").animate({height: h}, 400 ,function() { $(this).height('auto'); });
  $(".GC_menuitem").off('click').on('click',function(){
    idleStart();
    $("#dropDown_GC2").remove(); // remove old popup if one exists...
    $("#dropDown_GC").find("div[course_id]").removeClass("stayGray");
    $("#dropDown_GC").find("div[course_id]").find("img.top-img").css("opacity","0.0");
    var id = $(this).attr('course_id');
    chrome.runtime.sendMessage({message:'list_coursework',course_id:id},function(response){
      //console.log("Sent message 'list_courses', Got response: ", response);
    });
  });
  $("#advOptions").off('click').on('click',function(){
    window.open(chrome.extension.getURL("config.html"));
    return false;
  });
  idleStop();
};

var popupCourseWorkDropdown = function(courseWork) {
  $("#dropDown_GC").find("div[course_id='"+courseWork[0].courseId+"']").addClass("stayGray");
  $("#dropDown_GC").find("div[course_id='"+courseWork[0].courseId+"']").find("img.top-img").css("opacity","1.0");
  var buf = "<div style='background:rgba(255,255,255,1.0); display:none;transition:opacity 0.4s ease-in-out;z-index:23;position:absolute;border:1px solid #000;border-radius:5px;' id='dropDown_GC2'>";
  buf += "<div id='dropDown_GC_UL' style='margin-top:0px;margin-bottom:0px;'>";
  for (var i = 0; i < courseWork.length; i++) {
    if (typeof courseWork[i].maxPoints == 'undefined') { continue; }
    buf += "<div course_id='"+courseWork[i].courseId+"' courseWork_id='"+courseWork[i].id+"' courseWork_maxPoints='"+courseWork[i].maxPoints+"' class='GC_menuitem2 grayOnHover' style='user-select:none;cursor:pointer;padding-left:7px;padding-right:7px;padding-top:4px;padding-bottom:4px;font-size:16px;font-weight:bold;' icourse='"+i+"'>";
    buf += "<table width=100%><tr><td>";
    buf += courseWork[i].title;
    buf += "</td><td style='text-align:right;'>"+courseWork[i].maxPoints+" pts.</td></tr></table>";
    buf += "</div>";
  }
  buf += "</div>";
  buf += "</div>";
  $("body").append(buf);
  $("#dropDown_GC2").css("left",$("#dropDown_GC").offset().left+$("#dropDown_GC").width());
  $("#dropDown_GC2").css("top",$("#dropDown_GC").find("div[course_id='"+courseWork[0].courseId+"']").offset().top);
  $("#dropDown_GC2").show();
  var h = $("#dropDown_GC2")[0].scrollHeight,w = $("#dropDown_GC2")[0].scrollWidth;
  $("#dropDown_GC2").width(0);
  $("#dropDown_GC2").animate({width: w}, 150 ,function() { $(this).width('auto'); });
  $("#dropDown_GC2").height(2);
  $("#dropDown_GC2").animate({height: h+28}, 250 ,function() { $(this).height('auto'); });

  $(".GC_menuitem2").off('click').on('click',function(){
    idleStart();
    var id = $(this).attr('course_id');
    var cwid = $(this).attr('coursework_id');
    var cwmaxPoints = $(this).attr('courseWork_maxPoints');
    pastingCourseWork = {course_id:id,courseWork_id:cwid,maxPoints:cwmaxPoints};
    chrome.runtime.sendMessage({message:'list_courseworkSubmissions',course_id:id,courseWork_id:cwid},function(response){
      //console.log("Sent message 'list_courses', Got response: ", response);
    });
  });
  idleStop();
};

$(document).mouseup(function(e)
{
    var container = $("#dropDown_GC,#dropDown_GC2");

    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0)
    {
        container.remove();
    }
});

var parseStudentIds = function(subs,done) {
  // each sub has a google ID in it but NOT a name or an email ...
  // attach email address from memory if it exists in chrome storage.
  // otherwise, load from gapi
  var scores = $.map(subs,function(val,i){
    return {id:val.userId,assignedGrade:val.assignedGrade,draftGrade:val.draftGrade};
  });
  var rns = [];
  for (var i = 0; i < subs.length; i++) {
    rns.push("people/"+subs[i].userId);
  }
  chrome.runtime.sendMessage({message:'parse_emails',ids:rns,scores:scores},function(response){
    //console.log("Sent message 'list_courses', Got response: ", response);
  });
};
var doneParsingIds = function(list,allowNonReturnedGrades) {
  // list is a simple array, elements relating google id to email.
  // this is triggered after loading submission data. So after we have the emails, and if emails are related to Genesis, we can pop data.
  // list has everything needed, to match email to grade.
  // asyncronously, we might be loading student emails/ student ids/ student NAMES in the background.
  // once BOTH are done (this one is quicker...)
  // allow the pasting.

  // check if the first student exists on the student record. if not, the wrong class was selected.
  //console.log("Beginning to do the pasting logic, here is students and the grades array list:",students,list);

  var isClassCorrect = false;
  for (var i = 0; i < students.length; i++) {
    if (students[i].email.toUpperCase() == list[0].email.toUpperCase()) { isClassCorrect = true; break; }
  }
  if (!isClassCorrect) {
    //console.log("INCORRECT CLASS was selected. No match in student record.");
    displayError("The class selected does not match the class on this page.");
  }
  else {
    // now, in addition, if the class is correct, take the opportunity to put GOOGLE IDs in the student data and re-store it.
    for (var i = 0; i < list.length; i++) {
      for (var j = 0; j < students.length; j++) {
        if (students[j].email.toUpperCase() == list[i].email.toUpperCase()) {
          students[j].id = list[i].id;
          list[i].btid = students[j].btid;
        }
      }
    }
    //console.log("Students array has been updated with google IDs:",students);
    var data = {};
    data['GGC-' + ident] = students;
    chrome.storage.local.set(data, function() {});
    // if the class is correct, check to make sure it isn't a "blank" assignment with no grades in it.
    var isAssignmentGraded = false;
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i].assignedGrade != 'undefined' && !allowNonReturnedGrades) { isAssignmentGraded = true; break; }
      else if (typeof list[i].draftGrade != 'undefined' && allowNonReturnedGrades) { isAssignmentGraded = true; break; }
    }
    if (!isAssignmentGraded) {
      //console.log("ASSIGNMENT WAS NOT GRADED. No student has a grade for this assignment on record. Remember to hand back work.");
      displayError("The selected assignment has no returned grades.");
    }
    else {
      // next make sure it's numeric mode.
      if (gradeType() != "numeric") {
        if (gradeType() == "alpha") {
          areYouSure("The current assignment is alphabetical graded, but Google Classroom uses numeric grades. Are you sure you want to interpret these grades as alphabetical?",function(answer){
            if (answer == "yes") {
              var maxPoints = pastingCourseWork.maxPoints;
              $("table.list").find("tr.listroweven,tr.listrowodd").not("[id],:last-child").each(function(){
                var current_grade = $(this).find("select").val();
                var student_btid = $(this).children().eq(0).text().trim();
                var new_grade = "";
                if (!allowNonReturnedGrades) {
                  new_grade = $.map(list,function(s){
                    if (s.btid == student_btid) { return s.assignedGrade; }
                  })[0];
                }
                else {
                  new_grade = $.map(list,function(s){
                    if (s.btid == student_btid) { return s.draftGrade; }
                  })[0];
                }

                if (typeof new_grade == 'undefined') { new_grade = ""; }
                //console.log("For student " + student_btid + ": old="+current_grade+" new="+new_grade);
                var percent = new_grade / maxPoints * 100;
                if (percent == 0) { new_grade = "ZER"; }
                if (percent > 0 && percent < 59.5) { new_grade = "E"; }
                if (percent >= 59.5 && percent < 62.5) { new_grade = "D-"; }
                if (percent >= 62.5 && percent < 66.5) { new_grade = "D"; }
                if (percent >= 66.5 && percent < 69.5) { new_grade = "D+"; }
                if (percent >= 69.5 && percent < 72.5) { new_grade = "C-"; }
                if (percent >= 72.5 && percent < 76.5) { new_grade = "C"; }
                if (percent >= 76.5 && percent < 79.5) { new_grade = "C+"; }
                if (percent >= 79.5 && percent < 82.5) { new_grade = "B-"; }
                if (percent >= 82.5 && percent < 86.5) { new_grade = "B"; }
                if (percent >= 86.5 && percent < 89.5) { new_grade = "B+"; }
                if (percent >= 89.5 && percent < 92.5) { new_grade = "A-"; }
                if (percent >= 92.5 && percent < 96.5) { new_grade = "A"; }
                if (percent >= 96.5) { new_grade = "A+"; }
                if (new_grade != current_grade) {
                  // only if the grade will change, put it in and update.
                  $(this).find("select").val(new_grade);
                  $(this).find("select")[0].dispatchEvent(new Event("change"));
                }
              });
              displaySuccess();
            }
            else {
              displayError("Alphabetical Grades not converted.");
            }

          });
        }
      }
      else {
        // if the class is correct and at least 1 person has a grade assigned, then allow the pasting of the assignedGrades.
        //console.log("Everything checks out! Pasting the grades in...");
        $("table.list").find("tr.listroweven,tr.listrowodd").not("[id],:last-child").each(function(){
          var current_grade = $(this).children().eq(6).find("input[type='text']").val();
          var student_btid = $(this).children().eq(0).text().trim();
          var new_grade = "";
          if (!allowNonReturnedGrades) {
            new_grade = $.map(list,function(s){
              if (s.btid == student_btid) { return s.assignedGrade; }
            })[0];
          }
          else {
            new_grade = $.map(list,function(s){
              if (s.btid == student_btid) { return s.draftGrade; }
            })[0];
          }

          if (typeof new_grade == 'undefined') { new_grade = ""; }
          //console.log("For student " + student_btid + ": old="+current_grade+" new="+new_grade);
          if (new_grade != current_grade) {
            // only if the grade will change, put it in and update.
            $(this).find("input[type='text']").val(new_grade);
            $(this).find("input[type='text']")[0].dispatchEvent(new Event("change"));
          }
        });
        displaySuccess();
      }
    }

  }
  idleStop();
  $("#dropDown_GC,#dropDown_GC2").remove();
};

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  if (request.message == "payload_courses") {
    //console.log("Got Payload: Courses");
    console.log(request.courses);
    popupCoursesDropdown(request.courses);
    sendResponse("success");
  }
  if (request.message == "payload_courseWork") {
    //console.log("Got Payload: CourseWork");
    //console.log(request.courseWork);
    popupCourseWorkDropdown(request.courseWork);
    sendResponse("success");
  }
  if (request.message == "payload_courseWorkSubmissions") {
    //console.log("Got Payload: CourseWorkSubmissions");
    //console.log(request.courseWorkSubmissions);
    parseStudentIds(request.courseWorkSubmissions.result.studentSubmissions,function(){

    });
    //popupCourseWorkDropdown(request.courseWork);
    sendResponse("success");
  }
  if (request.message == "payload_emails") {
    //console.log("Got Payload:Emails");
    //console.log(request.emails);
    var scores = request.scores;
    var newa = $.map(request.emails.result.responses,function(val,i){
      var draftGrade = "",assignedGrade = "";
      if (val.person.emailAddresses.length == 0) {
        console.log("WARNING: Student does not have a valid response to PeopleAPI (emailAddresses[] has length zero)",val);
        return; // continue on to the next student.
      }
      for (var j = 0; j < scores.length; j++) {

          if (scores[j].id == val.person.emailAddresses[0].metadata.source.id) {// this messed up.... some people don't have emailAddresses[] populated. fix is above. Check with Frank
            draftGrade = scores[j].draftGrade; assignedGrade = scores[j].assignedGrade;
          }

      }
      return {id:val.person.emailAddresses[0].metadata.source.id,email:val.person.emailAddresses[0].value,draftGrade:draftGrade,assignedGrade:assignedGrade};
    });

    //console.log(newa);
    chrome.storage.sync.get(["GGC-options"],function(data) {
      console.log("Result of Sync Get GCC-options in popupupup:",data);
      var options = data["GGC-options"];
      doneParsingIds(newa,options.allowNonReturnedGrades);
    });

    sendResponse("success");
  }
  return true;
});


//// handle email loading
var loadStudentEmails = function(callbackLoadedOneStudent,callbackAllStudentsLoaded) {
  var index = 0; var all_loaded = true;
  for (index = 0; index < students.length; index++) {
    if (students[index].loaded == false) { all_loaded = false; break; }
  }
  if (all_loaded) { callbackAllStudentsLoaded(); return false; }
  else { callbackLoadedOneStudent(); }
  //console.log("Loading email for " + students[index].name);
  $.ajax("https://genesis.genesisedu.com/bernardsboe/sis/view?module=gradebook&category=gradebook&tab1=student&tab2=information&action=form&studentid=" + students[index].btid).done(function(html){
    students[index].loaded = true;
    var email = $(html).find("input#fldGradebookStudentEmail").val();
    students[index].email = email;
  }).fail(function(){

  }).always(function(){
    loadStudentEmails(callbackLoadedOneStudent,callbackAllStudentsLoaded);
  });
};




/// handle user errors

var displayError = function(error) {
  clearPrompts();
  var buf = "<div style='user-select:none;font-weight:bold;font-size:24px;color:rgba(70,0,0,1.0);text-align:center;line-height:100%;background:rgba(255,255,255,1.0);border:1px solid #000;border-radius:25px;position:fixed;left:10%;top:3%;width:80%;height:10%;' id='GC_errorDiv'>";
  buf += "<div style='display: inline-block;height: 100%;vertical-align: middle;'>&nbsp;</div>";
  buf += "<div class='GC_errorMsg' style='display:inline-block;'>" + error + "</div>";
  buf += "</div>";
  $("body").append(buf);
  var h = $("#GC_errorDiv")[0].scrollHeight;
  var t = $("#GC_errorDiv").offset().top;
  var l = $("#GC_errorDiv").offset().left;
  $("#GC_errorDiv").css("top","0px");
  $("#GC_errorDiv").height(0);
  $("#GC_errorDiv").animate({height: h}, 400 ,function() {  }).delay(2000).animate({height: 0}, 400 ,function() { $("#GC_errorDiv").remove();  });
};

var displaySuccess = function() {
  clearPrompts();
  var buf = "<div style='user-select:none;font-weight:bold;font-size:24px;color:rgba(0,180,0,1.0);text-align:center;line-height:100%;background:rgba(255,255,255,1.0);border:1px solid #000;border-radius:25px;position:fixed;left:10%;top:3%;width:80%;height:10%;' id='GC_successDiv'>";
  buf += "<div style='display: inline-block;height: 100%;vertical-align: middle;'>&nbsp;</div>";
  buf += "<div class='GC_errorMsg' style='display:inline-block;'>" + "Success!" + "</div>";
  buf += "</div>";
  $("body").append(buf);
  var h = $("#GC_successDiv")[0].scrollHeight;
  var t = $("#GC_successDiv").offset().top;
  var l = $("#GC_successDiv").offset().left;
  $("#GC_successDiv").css("top","0px");
  $("#GC_successDiv").height(0);
  $("#GC_successDiv").animate({height: h}, 400 ,function() {  }).delay(1500).animate({height: 0}, 400 ,function() { $("#GC_successDiv").remove();  });
};

var clearPrompts = function() {
  $("#GC_errorDiv,#GC_successDiv").remove();
};

// check for alphabetical grades, update in preferences for that district if they are different.



var gradeType = function() {
  var test1 = $("table.list").find("select").length;
  var test3 = $("table.list").find("select option:contains('Pass')").length;
  if (test1 != 0) {
    if (test3 != 0) { return "passfail"; }
    return "alpha";
  }
  var test2 = $("table.list").find("td[onclick*='rotateChecks']").length;
  if (test2 != 0) { return "checks"; }
  return "numeric";
};

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

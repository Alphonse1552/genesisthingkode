var inComboBox = false;

$("<div style='float:left;padding-right: 4px;padding-left:3px;'><button id='PasteFromGoogleClassroom' style='min-height:23.33333px;min-width:115px;padding-left:2px;padding:3px;margin-right:4px;display:flex,table-cell;float:left;transition: opacity 0.5s ease-in-out;' class='formButton'>Google Classroom</button></div>").insertBefore($(".dropdown3").parent());
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
  .ui-icon {background-image:url(`+chrome.extension.getURL("icons_black.png")+`);}
  #advOptions:hover {
    text-decoration: underline;
  }

  </style>`);


$("#PasteFromGoogleClassroom").off('click').on('click',function(){
  idleStart();
  chrome.runtime.sendMessage({message:'list_courses'},function(response){
    //console.log("Sent message 'list_courses', Got response: ", response);
  });
  return false;
});

var popupCreateAssignment = function(createParams) {
  createParams.colTitle = createParams.title.substring(0,15);
  var buf = "<div id='GC_createAssignment' style='font-size:14px;font-weight:bold;background:rgba(255, 253, 237,1.0);width:86%;top:5%;left:7%;border:1px solid #000;border-radius:15px;margin:25px;z-index:150;transition:transform 0.25s ease-in-out;transform:scale(0.0);position:absolute;'>";
  buf += "<div id='GC_assignmentTitle' style='width:100%;padding-right:0px;padding-left:0px;font-size:28px;font-weight:bold;text-align:center;padding-top:0px;margin-top:15px;'>";
  buf += "<span id='GC_assignmentTitleData' contenteditable='true' style='border:1px solid #000;border-radius:3px;padding:3px;padding-right:7px;padding-left:7px;background:rgba(255,255,255,0.9);padding-bottom:5px;'>" + createParams.title + "</span>";
  buf += "</div>";
  buf += "<div style='width:100%;padding-right:30px;padding-left:30px;font-size:14px;font-weight:bold;text-align:center;padding-top:12px;'>";
  buf += "Column Title: <span contenteditable='true' id='GC_colTitle' style='border:1px solid #000;border-radius:3px;padding:3px;padding-right:7px;padding-left:7px;background:rgba(255,255,255,0.9);padding-bottom:5px;'>" + createParams.colTitle + "</span>";
  buf += "</div>";
  buf += "<div style='height:1px;border-bottom:1px dashed #444;width:80%;margin:0 auto;padding-top:15px;margin-bottom:15px;'>&nbsp;</div>";
  buf += "<table style='margin:0 auto;'>";
    buf += "<tr>";
      buf += "<td>Assigned Date:";
      buf += "</td>";
      var a = new Date(createParams.updateTime);
      buf += "<td><input style='min-width:230px' type='text' id='GC_aDate' value='"+(a.getMonth()+1)+"/"+a.getDate()+"/"+a.getFullYear()+"'>";
      buf += "</td>";

    buf += "</tr>";
    buf += "<tr>";
      buf += "<td>Due Date:";
      buf += "</td>";
      buf += "<td><input style='min-width:230px' type='text' id='GC_dDate' value='"+createParams.dueMonth+"/"+createParams.dueDay+"/"+createParams.dueYear+"'>";
      buf += "</td>";

    buf += "</tr>";
    buf += "<tr>";
      buf += "<td>Max Points:";
      buf += "</td>";
      buf += "<td><input style='min-width:198px' type='text' id='GC_maxPoints' value='"+createParams.maxPoints+"'>";
      buf += "</td>";

    buf += "</tr>";
    buf += "<tr>";
      buf += "<td>Category:";
      buf += "</td>";
      buf += "<td>";
      buf += "<select name='GC_category' id='GC_category'>";
      buf += "<option value='"+createParams.myCategories[0].val+"' selected='selected'>" + createParams.myCategories[0].text + "</option>";
      for (var i = 1; i < createParams.myCategories.length; i++) {
        buf += "<option value='"+createParams.myCategories[i].val+"'>" + createParams.myCategories[i].text + "</option>";
      }
      buf += "</select>";
      buf += "</td>";

    buf += "</tr>";
    buf += "<tr>";
      buf += "<td>Marking Period:";
      buf += "</td>";
      buf += "<td>";
      buf += "<select name='GC_category' id='GC_semester'>";
      //buf += "<option value='"+createParams.myCategories[0].val+"' selected='selected'>" + createParams.myCategories[0].text + "</option>";
      for (var i = 0; i < createParams.semesters.length; i++) {
        buf += "<option value='"+createParams.semesters[i].val+"' "+(createParams.defaultSemester==createParams.semesters[i].val?"selected='selected'":"")+">" + createParams.semesters[i].text + "</option>";
      }
      buf += "</select>";
      buf += "</td>";

    buf += "</tr>";

  buf += "</table>";
  buf += "<div style='height:1px;border-bottom:1px dashed #444;width:80%;margin:0 auto;padding-top:15px;padding-bottom:15px;margin-bottom:15px;'>&nbsp;</div>";
  buf += "<fieldset style='margin:0 auto;width:80%;padding-bottom:15px;'><legend>Description:</legend>";
  buf += "<div id='GC_description' contenteditable='true' style='background:rgba(255,255,255,0.9);font-weight:normal;border-radius:5px;width:80%;height:90px;margin:0 auto;padding:15px;border:1px solid #000;'>"+(createParams.description == 'undefined'?"":createParams.description)+"</div>";
  buf += "</fieldset>";
  buf += "<fieldset style='margin:0 auto;width:80%;padding-bottom:15px;'><legend>For Courses:</legend>";

    buf += "<table style='margin:0 auto; width:80%;'>";
    for (var j = 0; j < Math.ceil(createParams.myCourses.length/2); j++) {
      buf += "<tr>";
      buf += "<td>";
      buf += "<label for='GC_course-"+j*2+"'>"+createParams.myCourses[j*2].label+"</label>";
      buf += "<input fieldvalue='"+createParams.myCourses[j*2].name+"' type='checkbox' name='GC_course-"+j*2+"' id='GC_course-"+j*2+"' "+(j==0?'checked disabled':'')+">";
      buf += "</td>";
      if (j*2+1 < createParams.myCourses.length) {
        buf += "<td>";
        buf += "<label for='GC_course-"+(j*2+1)+"'>"+createParams.myCourses[j*2+1].label+"</label>";
        buf += "<input fieldvalue='"+createParams.myCourses[j*2+1].name+"' type='checkbox' name='GC_course-"+(j*2+1)+"' id='GC_course-"+(j*2+1)+"'>";
        buf += "</td>";
      }
      else { buf += "<td></td>"; }
      buf += "</tr>";
    }
    buf += "</table>"

  buf += "</fieldset>";
  buf += "<fieldset style='margin:0 auto;width:80%;padding-bottom:15px;'><legend>Options:</legend>";
  buf += "<label for='GC_forParents'>For Parents Module</label>";
  buf += "<input type='checkbox' name='GC_forParents' id='GC_forParents'>";
  buf += "<label for='GC_showInGradebook'>Show In Gradebook</label>";
  buf += "<input type='checkbox' name='GC_showInGradebook' id='GC_showInGradebook' checked>";
  buf += "<label for='GC_saveToLinked'>Save to Linked Courses</label>";
  buf += "<input type='checkbox' name='GC_saveToLinked' id='GC_saveToLinked' checked>";
  buf += "</fieldset>";

  buf += "<div style='width:100%;text-align:center;margin:0 auto;margin-top:20px;margin-bottom:30px;'>";
  buf += "<button style='background-position:10px;padding-left:32px;padding-right:10px;min-width:250px;min-height:45px;background-repeat:no-repeat;background-image: url(\"/bernardsboe/images/save.png\");' id='GC_submit'>Save Assignment</button>";
  buf += "</div>";
  buf += "<div id='GC_courseid' style='display:none;'>"+createParams.courseid+"</div>";
  buf += "</div>";
  $("body").append(buf);
  $("#GC_aDate").datepicker();$("#GC_dDate").datepicker();$("#GC_maxPoints").spinner();$("#GC_category").selectmenu();$("#GC_semester").selectmenu();
  $("input[id^='GC_course']").checkboxradio();$("#GC_submit").button();
  $("#GC_forParents").checkboxradio();$("#GC_showInGradebook").checkboxradio();$("#GC_saveToLinked").checkboxradio();
  setTimeout(function(){$("#GC_createAssignment").css("transform","scale(1)");},100);
  $("#GC_category-button,#GC_semester-button").on('click',function(){
    inComboBox = true;
    console.log("in combo box");
  });
  $("#GC_category,#GC_semester").on('change',function(){
    console.log("out of combo box");
    inComboBox = false;
  });
  $("#GC_submit").on('click',function(){
    var courseid = $("#GC_createAssignment").find("#GC_courseid").text().trim();
    var args = {
      fldExternalAssignmentid: "",
      fldAssignmentid: "0",
      fldSeq: "",
      fldGroupCode: "",
      fldUrlLabel1: "",
      fldUrlLink1: "",
      fldUrlLabel2: "",
      fldUrlLink2: "",
      fldUnitCode: "",
      fldRubricCode: "",
      fldAssignmentName : $("#GC_createAssignment").find("#GC_assignmentTitle").text().trim(),
      fldColumnHeader : $("#GC_createAssignment").find("#GC_colTitle").text().trim().substring(0,15),
      fldDescription : $("#GC_createAssignment").find("#GC_description").text().trim(),
      fldDateAssigned : $("#GC_createAssignment").find("#GC_aDate").val(),
      fldDateDue : $("#GC_createAssignment").find("#GC_dDate").val(),
      fldSemester : $("#GC_createAssignment").find("#GC_semester").val(),
      fldGradeType : "NUMERIC",
      fldCategoryCode : $("#GC_createAssignment").find("#GC_category").val(),
      fldAssignmentWeight : "1.0",
      fldMaxPossibleScore : $("#GC_createAssignment").find("#GC_maxPoints").val(),
      fldForParentModule : ($("#GC_createAssignment").find("#GC_forParents").is(":checked")?"YES":"NO"),
      fldForGradebook : ($("#GC_createAssignment").find("#GC_showInGradebook").is(":checked")?"YES":"NO"),
      fldSaveToLinkedCourses : ($("#GC_createAssignment").find("#GC_showInGradebook").is(":checked")?"checked":"")

    };
    $("input[id^='GC_course-']").each(function(i,val){
      if (i == 0) { return; }
      if ($(this).is(":checked")) {
        args[$(this).attr('fieldvalue')] = 'on';
      }
    });
    console.log("Created Args:",args);

    // https://genesis.genesisedu.com/bernardsboe/sis/view?module=gradebook&category=assignments2&tab1=singleAssignment&action=save&assignmentid=0&courseid=7535&mode=Create&addAnother=false&overrideMP=false&changeGrades=true
    //$.post( "https://genesis.genesisedu.com/bernardsboe/sis/view?module=gradebook&category=assignments2&tab1=singleAssignment&action=save&assignmentid=0&courseid="+courseid+"&mode=Create&addAnother=false&overrideMP=false&changeGrades=true", args, function(data) {
      //location.reload();
    //});
    $.ajax({
        url: "https://genesis.genesisedu.com/bernardsboe/sis/view?module=gradebook&category=assignments2&tab1=singleAssignment&action=save&assignmentid=0&courseid="+courseid+"&mode=Create&addAnother=false&overrideMP=false&changeGrades=true",
        type: 'post',
        data: args,
        headers: {
            "Upgrade-Insecure-Requests": "1"
        },
        dataType: 'json',
        complete: function (jq,status) {
            $("#GC_createAssignment").remove();
            location.reload();
        }
    });

  });
};

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
  console.log("Got coursework payload:",courseWork);
  $("#dropDown_GC").find("div[course_id='"+courseWork[0].courseId+"']").addClass("stayGray");
  $("#dropDown_GC").find("div[course_id='"+courseWork[0].courseId+"']").find("img.top-img").css("opacity","1.0");
  var buf = "<div style='background:rgba(255,255,255,1.0); display:none;transition:opacity 0.4s ease-in-out;z-index:23;position:absolute;border:1px solid #000;border-radius:5px;' id='dropDown_GC2'>";
  buf += "<div id='dropDown_GC_UL' style='margin-top:0px;margin-bottom:0px;'>";
  for (var i = 0; i < courseWork.length; i++) {
    if (typeof courseWork[i].maxPoints == 'undefined') { continue; }
    if (typeof courseWork[i].dueDate == 'undefined') {
      courseWork[i].dueDate = {day:'',month:'',year:''};
    }
    buf += "<div courseWork_updateTime='"+courseWork[i].updateTime+"' courseWork_title='"+encodeURIComponent(courseWork[i].title)+"' courseWork_dueDay='"+courseWork[i].dueDate.day+"' courseWork_dueMonth='"+courseWork[i].dueDate.month+"' courseWork_dueYear='"+courseWork[i].dueDate.year+"' courseWork_description='"+encodeURIComponent(courseWork[i].description)+"' courseWork_maxPoints='"+courseWork[i].maxPoints+"' course_id='"+courseWork[i].courseId+"' courseWork_id='"+courseWork[i].id+"' class='GC_menuitem2 grayOnHover' style='user-select:none;cursor:pointer;padding-left:7px;padding-right:7px;padding-top:4px;padding-bottom:4px;font-size:16px;font-weight:bold;' icourse='"+i+"'>";
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
    var self = this;
    //chrome.runtime.sendMessage({message:'list_courseworkSubmissions',course_id:id,courseWork_id:cwid},function(response){
      //console.log("Sent message 'list_courses', Got response: ", response);
    //});
    // to get couese IDs:
    // https://genesis.genesisedu.com/bernardsboe/sis/view?module=gradebook&category=home&tab1=summary&action=form

    $.ajax("https://genesis.genesisedu.com/bernardsboe/sis/view?module=gradebook&category=assignments2&tab1=Create&action=form").done(function(html){
      //console.log(html);
      var createTitle = $("div.dropdown2").find("a.account2").text().trim();
      var myCourses = [];
      //console.log($(html).find("div:contains('Switch Gradebook')").eq(0).parent().html());
      myCourses.push({
        name:"fldCourse"+$(html).find("div:contains('Switch Gradebook')").eq(0).parent().find("select.fieldvalue").val().replace(":",""),
        label:$("div.dropdown2").find("a.account2").text().trim()
      });
      $(html).find("input.fieldlabel[id^=fld]").each(function(){
        myCourses.push({name:$(this).attr('name'),label:$(this).next().text().trim()});
      });
      var courseid = $("script:contains('courseid=')").text().match(/&courseid=[0-9]*/)[0].replace("&courseid=",""); // this is the course ID for the current course.
      var myCategories = [];
      $(html).find("#fldCategoryCode").find("option").each(function(){
        myCategories.push({text:$(this).text(),val:$(this).val()});
      });
      myCategories.shift(); // remove the blank option no one wants.
      var defaultSemester = $(html).find("#fldSemester").val();
      var semesters = [];
      $(html).find("#fldSemester").find("option").each(function(){
        semesters.push({text:$(this).text().trim(),val:$(this).val()});
      });

      var createParams = {
        myCourses:myCourses,
        myCategories:myCategories,
        courseid:courseid,
        defaultSemester:defaultSemester,
        semesters:semesters,
        createTitle:createTitle,
        updateTime:$(self).attr('courseWork_updateTime'),
        title:decodeURIComponent($(self).attr('courseWork_title')),
        dueDay:$(self).attr('courseWork_dueDay'),
        dueMonth:$(self).attr('courseWork_dueMonth'),
        dueYear:$(self).attr('courseWork_dueYear'),
        description:decodeURIComponent($(self).attr('courseWork_description')),
        maxPoints:$(self).attr('courseWork_maxPoints')
      };
      console.log("create Course Params, without Categories::",createParams);
      // next, invoke a function to form the POST for making the assignment.
      $("#dropDown_GC,#dropDown_GC2,#GC_createAssignment").remove();
      popupCreateAssignment(createParams);

      idleStop();

    }).fail(function(){

    }).always(function(){

    });
  });
  idleStop();
};

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  if (request.message == "payload_courses") {
    popupCoursesDropdown(request.courses);
    sendResponse("success");
  }
  if (request.message == "payload_courseWork") {
    //console.log("Got Payload: CourseWork");
    //console.log(request.courseWork);
    popupCourseWorkDropdown(request.courseWork);
    sendResponse("success");
  }
  return true;
});


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
  $("#PasteFromGoogleClassroom").html("Google Classroom");
};

$(document).mouseup(function(e)
{
    var container = $("#dropDown_GC,#dropDown_GC2,#GC_createAssignment,.ui-selectmenu-menu");

    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0)
    {
        container.remove();
    }
});

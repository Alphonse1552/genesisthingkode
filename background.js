var userSignedIn = false;
var isUserSignedIn = function(){
  return userSignedIn;
};
const CLIENT_ID = "294577676913-b8o5loen9din55fgfetlhtk52gg450pm.apps.googleusercontent.com";
//const CLIENT_ID = "294577676913-mfnit2e6hnlubgh8ba23e8p68c1r9qdc.apps.googleusercontent.com";
const RESPONSE_TYPE = encodeURIComponent("id_token");
const REDIRECT_URI = encodeURIComponent("https://meafebpbddmdbfpgadfnkbfghccpbjgg.chromiumapp.org");
const STATE = encodeURIComponent("dfhoais");
const SCOPE = encodeURIComponent("openid");
const PROMPT = encodeURIComponent("consent");
const SECRET = "LjsunCKzAJ-cRG3qxSblVlLu";
const CHROME_ID = "meafebpbddmdbfpgadfnkbfghccpbjgg";
const PROJECT_ID = "sinuous-sled-289812";
const AUTH_URI = "https://accounts.google.com/o/oauth2/auth";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const AUTH_PROVIDER_X509_CERT_URL = "https://www.googleapis.com/oauth2/v1/certs";
//console.log(chrome.runtime.getManifest());
const API_KEY = chrome.runtime.getManifest().oauth2.api_key;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest","https://www.googleapis.com/discovery/v1/apis/people/v1/rest"];

/// need this scope to get grades info:
/// https://www.googleapis.com/auth/classroom.coursework.students.readonly

// this extensions key:::
// "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvTH2Uz1uHy8kHr/lUPUBBnw1ZTQ0TnUy3Fl46l5YTuyMMG+3Q9wGC0DRR5FnzF5sE436oQQe24rifycRZZZgy0HK53lEzzY+2i1crn9Q9dgmfShVkSykV3YKz/o0MadcC1FBgSVFjii+po4zFtEODBPiEPOUr42i7tgECaPyGJEraIUYpIfc4zlA0Lz77F+pOKux8iLGFzrkIvBWnTalGABJTbi1835HYL1pxUeZOhy3pFEZC5XFjEgad9kZAVEAFnCW6O1zmwNc915Fui4R4kzTLfqz0lDIOOfkJx/82MFSD/GKsi3AIznLFlwis6d79a6q7MxbqvXARtw8UkaQRwIDAQAB",

var access_token;
var user_id;

var myGoogleID;

// ex:
// https://zoom.us/oauth/authorize?response_type=code&client_id=7lstjK9NTyett_oeXtFiEQ&redirect_uri=https://yourapp.com


// installation URL from ZOOM:
// https://zoom.us/oauth/authorize?response_type=code&client_id=L8c7ketoSbqbQvKTQe_taA&redirect_uri=https%3A%2F%2Fjdodoceeemoobmfiknipajnjebnhcaim.chromiumapp.org

var create_oauth2_url = function() {
  var nonce = encodeURIComponent(Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15));
  //var url = "https://zoom.us/oauth/authorize?response_type="+RESPONSE_TYPE+"&client_id="+CLIENT_ID+"&redirect_uri="+REDIRECT_URI;
  var url = AUTH_URI + "?client_id="+CLIENT_ID + "&response_type="+RESPONSE_TYPE + "&redirect_uri="+REDIRECT_URI+ "&scope="+SCOPE+ "&prompt="+PROMPT + "&nonce="+nonce;
  return url;
};

var pad = function (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  if (request.message == "list_courses") {
    console.log("Got list_courses message in background");
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log('got the token', token);
      gapi.auth.setToken({
        'access_token': token,
      });
      gapi.client.classroom.courses.list({pageSize:100}).then(function(data){
        var courses = data.result.courses;
        var filtered_courses = [];
        //for (var i = 0; i < data.result.courses.length; i++) {
        //  if (data.result.courses[i].courseState == "ACTIVE" && data.result.courses[i].ownerId == myGoogleID) {
        //    courses.push(data.result.courses[i]);
        //  }
        //}
        chrome.storage.sync.get(["GGC-options"],function(data2) {
          //console.log("Result of Sync Get GCC-options in popupupup:",data);
          var options = data2["GGC-options"] || {};
          if (typeof options.course_info != 'undefined') {
            // filter courses according to user options.
            for (var i = 0; i < courses.length; i++) {
              var courseinfo_entry = $(options && options.course_info).toArray().find(function(a){return a.id==courses[i].id;});
              if (typeof courseinfo_entry != 'undefined') {
                courses[i].index = courseinfo_entry.index;
                courses[i].show = courseinfo_entry.show;
              }
            }
            courses.sort(function(a,b){
              if (a.index > b.index) { return 1;}
              else if (a.index < b.index) { return -1;}
              return 0;
            });
            for (var i = 0; i < courses.length; i++) {
              if (courses[i].show) {
                filtered_courses.push(courses[i]);
              }
            }
            courses = filtered_courses;
          }
          else {
            // default: show only courses which you are the owner of and are not archived.
            for (var i = 0; i < data.result.courses.length; i++) {
              if (data.result.courses[i].courseState == "ACTIVE") {
                filtered_courses.push(data.result.courses[i]);
              }
            }
            courses = filtered_courses;
          }
          console.log("Filtered courses:",courses);
          chrome.tabs.query(
              { currentWindow: true, active: true },
              function (tabArray) {chrome.tabs.sendMessage(tabArray[0].id,{message:'payload_courses',courses:courses},function(){
              });});
        });


      });
    });
    sendResponse("success");
  }
  if (request.message == "list_courses_raw") {
    console.log("Got list_courses message in background");
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log('got the token', token);
      gapi.auth.setToken({
        'access_token': token,
      });
      gapi.client.classroom.courses.list({pageSize:100}).then(function(data){
        var courses = data.result.courses;
        chrome.storage.sync.get(["GGC-options"],function(data2) {
          //console.log("Result of Sync Get GCC-options in popupupup:",data);
          var options = data2["GGC-options"];
          console.log("Retrived options:",options);
          // add options, if the were saved, for index and show flag
          for (var i = 0; i < courses.length; i++) {
            var courseinfo_entry = $(options && options.course_info).toArray().find(function(a){return a.id==courses[i].id;});
            if (typeof courseinfo_entry != 'undefined') {
              courses[i].index = courseinfo_entry.index;
              courses[i].show = courseinfo_entry.show;
            }
          }
          courses.sort(function(a,b){
            if (a.index > b.index) { return 1;}
            else if (a.index < b.index) { return -1;}
            return 0;
          });
          console.log("Got courses:",courses);
          chrome.tabs.query(
              { currentWindow: true, active: true },
              function (tabArray) {chrome.tabs.sendMessage(tabArray[0].id,{message:'payload_courses',courses:courses},function(){
              });});
        });


      });
    });
    sendResponse("success");
  }
  else if (request.message == "list_coursework") {
    chrome.storage.sync.get(["GGC-options"],function(data2) {
      //console.log("Result of Sync Get GCC-options in popupupup:",data);
      var options = data2["GGC-options"] || {};
      if (typeof options.numShowCoursework == 'undefined') { options.numShowCoursework = 40; }
      var id = request.course_id;
      chrome.identity.getAuthToken({interactive: true}, function(token) {
        console.log('got the token', token);
        gapi.auth.setToken({
          'access_token': token,
        });
        gapi.client.classroom.courses.courseWork.list({pageSize:options.numShowCoursework,courseId:id}).then(function(data){
          console.log("Got courseWork:",data);
          chrome.tabs.query(
              { currentWindow: true, active: true },
              function (tabArray) {chrome.tabs.sendMessage(tabArray[0].id,{message:'payload_courseWork',courseWork:data.result.courseWork},function(){
              });});
        });
      });
    });
    sendResponse("success");
  }
  else if (request.message == "list_courseworkSubmissions") {
    var id = request.course_id;
    var cwid = request.courseWork_id;
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log('got the token', token);
      gapi.auth.setToken({
        'access_token': token,
      });
      gapi.client.classroom.courses.courseWork.studentSubmissions.list({pageSize:40,courseId:id,courseWorkId:cwid}).then(function(data){
        console.log("Got courseWorkSubmissions:",data);
        chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabArray) {chrome.tabs.sendMessage(tabArray[0].id,{message:'payload_courseWorkSubmissions',courseWorkSubmissions:data},function(){
            });});
      });
    });
    sendResponse("success");
  }
  else if (request.message == "parse_emails") {
    var rns = request.ids;
    var scores = request.scores;
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log('got the token', token);
      gapi.auth.setToken({
        'access_token': token,
      });
      gapi.client.people.people.getBatchGet({resourceNames:rns,personFields:"emailAddresses"}).then(function(data){
        console.log("Got people data:",data);
        chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabArray) {chrome.tabs.sendMessage(tabArray[0].id,{message:'payload_emails',emails:data,scores:scores},function(){
            });});
      });
    });
    sendResponse("success");
  }
  else if (request.message == "GC_opt_allowNonReturnedGrades") {
    var state = request.state;
    console.log("Got state:",state);
    chrome.storage.sync.get(["GGC-options"],function(data) {
      console.log("Result of Sync Get GCC-options:",data);
      data["GGC-options"].allowNonReturnedGrades = state;
      chrome.storage.sync.set(data, function() {
        console.log("Saved options:",data);
      });
    });
    sendResponse("success");
  }
  return true;
});

window.onGAPILoad = function() {
  gapi.client.init({
    // Don't pass client nor scope as these will init auth2, which we don't want
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  }).then(function () {
    console.log('gapi initialized');
    /// testing
    // get userid name "116574449731615795233"
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log('got the token', token);
      gapi.auth.setToken({
        'access_token': token,
      });
      gapi.client.people.people.get({resourceName:"people/me",personFields:"emailAddresses"}).then(function(data){
        console.log("Got people/me data:",data);
        myGoogleID = data.result.resourceName.split("/")[1];
      });
    });
    //// testing
  }, function(error) {
    console.log('error', error);
  });
};

/*
chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  if (request.message == "list_courses") {
    chrome.identity.launchWebAuthFlow({
      url: create_oauth2_url(),
      interactive:true
    },function(redirect_url){
      console.log("Got back redirect URL from AUTH LAUNCH: ",redirect_url);
      var id_token = redirect_url.substring(redirect_url.indexOf("#id_token")+10,redirect_url.indexOf("&"));
      const user_info = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(id_token.split(".")[1]));
      console.log(user_info);
      console.log("Trying Classroom API ...");
      $.ajax({
        url: TOKEN_URI,
        type: 'post',
        contentType: 'application/x-www-form-urlencoded; charset=utf-8',
        crossDomain:true,
        cache : true,
        data: {
            grant_type:'authorization_code',redirect_uri:REDIRECT_URI,client_id:CLIENT_ID,client_secret:SECRET,code:encodeURIComponent(id_token)
        },
        dataType: 'json',
        success: function (token_data) {
          console.log("Got access token:",token_data);
        }
      });
    });
    sendResponse("success");
  }
});*/

chrome.storage.sync.get(["GGC-options"],function(data) {
  console.log("Result of Sync Get GCC-options:",data);
  if (typeof data["GGC-options"] ==  "undefined") {
    data["GGC-options"] = {};
  }
  chrome.storage.sync.set(data, function() {
    console.log("Saved options:",data);
  });
});

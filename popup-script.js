window.onload = function(){
  //$("#GC_onlyUseReturnedGrades").checkboxradio();
  /*document.querySelector("#GC_allowNonReturnedGrades").addEventListener('click',function(){
    var state = document.querySelector("#GC_allowNonReturnedGrades").checked;
    chrome.runtime.sendMessage({message:'GC_opt_allowNonReturnedGrades',state:state},function(response){
      //console.log("Sent Opt1");
    });
  });*/
  chrome.storage.sync.get(["GGC-options"],function(data) {
    console.log("Result of Sync Get GCC-options in popupupup:",data);
    var options = data["GGC-options"] || {};
    //document.querySelector("#GC_allowNonReturnedGrades").checked = options.allowNonReturnedGrades;
  });


  document.querySelector("#advOptions").addEventListener('click',function(){
    chrome.tabs.create({url: chrome.extension.getURL("config.html")});
  });
};

document.addEventListener('DOMContentLoaded', function() {
  // JavaScript code here
  //$("#GC_onlyUseReturnedGrades").checkboxradio();
});

$(document).ready(function(){
  $("#version").html(chrome.runtime.getManifest().version);
});

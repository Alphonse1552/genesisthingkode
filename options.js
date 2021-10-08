chrome.storage.sync.get(["GGC-options"],function(data) {
  console.log("Result of Sync Get GCC-options in config screen:",data);
  var options = data["GGC-options"];
  document.querySelector("#GC_allowNonReturnedGrades").checked = options.allowNonReturnedGrades;
});

function doGet(e) {
 
//  отдать параметры запроса (e.parameter) в виде json  
//  return  ContentService.createTextOutput(JSON.stringify(e.parameter)).setMimeType(ContentService.MimeType.JSON);

  var output = HtmlService.createTemplateFromFile('web').evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return output
  
}

function doPost(e) {
  var response = decodeURIComponent(e.postData.contents);
  
  var event = response.match(/(event=)(\w+)/i)[2];
  var contactID = parseInt(response.match(/\[ID\]=(\d+)/)[1]);
  
  bitrixContactHandler(event, contactID);
  
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

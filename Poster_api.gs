function posterMakeAction(action, data) { 
  var options = '';
  
  for (var i in data){
    options += '&' + i + '=' + data[i]
  }
  var token = config().poster_key;
  var url = "https://joinposter.com/api/" + action + "?token=" + token + options;
  
  var response = JSON.parse(UrlFetchApp.fetch(url));
  
  return response.response;
}

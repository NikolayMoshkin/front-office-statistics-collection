function getLastContacts(){
  var contactSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Контакты');
  var amountContacts = 7;
  var lastContacts = [];
  var lastContactsArray = contactSheet.getRange(contactSheet.getLastRow() - amountContacts + 1, 1, amountContacts, contactSheet.getLastColumn()).getValues();
  for (var i in lastContactsArray){
    var dateDiff = dateDiffFromNow(lastContactsArray[i][config().contactDateColumn-1]);
    lastContacts.push({
      'dateDiff' : dateDiff,
      'id' : lastContactsArray[i][config().contactIdColumn-1],
      'name' : lastContactsArray[i][config().contactNameColumn-1],
      'phone' : lastContactsArray[i][config().contactPhoneColumn-1],
      'email' : lastContactsArray[i][config().contactEmailColumn-1],
      'park' : lastContactsArray[i][config().contactParkColumn-1],
      'source' : lastContactsArray[i][config().contactSourceColumn-1],
    });
  }
  return lastContacts;
}


function getLastTransactionProducts(spot_id){
  
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "YYYY-MM-dd");
  var products = [];
  var spot = '';
   
  try{
    var lastTransaction = posterMakeAction('transactions.getTransactions', {
      'date_from' : today,
      'date_to' : today,
      'per_page' : 1,
      'page' : 1,
      'spot_id': spot_id
     }).data[0];
  
    switch(spot_id) {
      case '1': 
        spot = 'ВГ ПЛ'
        break;

      case '2':
        spot = 'Зебратут'
        break;
      
      case '3':
        spot = 'ВГ ГК'
        break;
    }

    var productsArray = lastTransaction.products;
 
    for (var i in productsArray){
       var productName = posterMakeAction('menu.getProduct', {
          'product_id' : productsArray[i].product_id
         }).product_name;
    
      products.push({
        'name': productName,
        'price': productsArray[i].product_sum,
        'num' : productsArray[i].num
      })
    
    }
  
    return {
      'status': true,
      'spot': spot,
      'products' : products
    }
  }
  
  catch(e){
    return {
      'status': false
    }
  }
  
}

function getCommonProducts(){
  var cache = CacheService.getDocumentCache();
  var cached = cache.get("common-products");
  
  if (cached != null) {
    return JSON.parse(cached);
  }
  var settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Настройки');
  var commonProducts = [];
  var commonProductsData = settingsSheet.getRange(2, 1, settingsSheet.getLastRow()-1, 1).getValues();
  for (var i in commonProductsData){
    commonProducts.push(commonProductsData[i][0])
  }
    
  cache.put("common-products", JSON.stringify(commonProducts), 2500); // cache for 25 minutes
  Logger.log(commonProducts)
  return commonProducts;
}

function getContactSources(){
  var sources = [];
  var cache = CacheService.getDocumentCache();
  var cached = cache.get("bitrix-contact-sources");
  
  if (cached != null) {
    Logger.log(cached);
    return JSON.parse(cached);
  }
  
  var sources = bitrixCallMakeAction('crm.status.list', { 
			"order": { "SORT": "ASC" },
			"filter": { "ENTITY_ID": "SOURCE" }
		});
  cache.put("bitrix-contact-sources", JSON.stringify(sources), 2500); // cache for 25 minutes
  
  Logger.log(sources)
  return sources;
}

function getAllProducts(){
  var cache = CacheService.getDocumentCache();
  var cached = cache.get("all-products-objects");
  
  if (cached != null) {
    return JSON.parse(cached);
  }
  
  var products = [];
  var start = 0;
  var response = {};

  do {
    response = bitrixCallGetRequest("crm.product.list", {
      'start': start
    })
    
    for (var i in response.result){
      products.push({
        'id' : response.result[i].ID,
        'name' : response.result[i].NAME,
        'price' : response.result[i].PRICE
      });
    }
    
    start = start + 50;
    
  } while (response.next)
  
  cache.put("all-products-objects", JSON.stringify(products), 2500); // cache for 25 minutes
  return products;
 
}

function searchContactsByName(name) {
  var contactSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Контакты');
  var contacts = [];
  var contactsData = contactSheet.getRange(2, 1, contactSheet.getLastRow()-1, contactSheet.getLastColumn()).getValues();
  var indexes = [];
 
  var regExpName = new RegExp(name.toString().match(/[a-яА-Я]+(\s[а-яА-Я]+)?/)[0],'i');
  
  Logger.log(regExpName);
  
  for (var i in contactsData){
    if (regExpName.test(contactsData[i][config().contactNameColumn-1].toString())) {
          indexes.push(i);
    }
  }
  
  if (indexes.length != 0) {
    for (var i in indexes){
      var dateDiff = null;
      var contactCreated = contactsData[indexes[i]][config().contactDateColumn-1];
      if (contactCreated)
         var dateDiff = dateDiffFromNow(contactsData[indexes[i]][config().contactDateColumn-1]);
      contacts.push({
           'dateDiff' : dateDiff,
           'id' : contactsData[indexes[i]][config().contactIdColumn-1],
           'name' : contactsData[indexes[i]][config().contactNameColumn-1],
           'phone' : contactsData[indexes[i]][config().contactPhoneColumn-1],
           'email' : contactsData[indexes[i]][config().contactEmailColumn-1],
           'park' : contactsData[indexes[i]][config().contactParkColumn-1],
           'source' : contactsData[indexes[i]][config().contactSourceColumn-1],
      });
    }
    
    return {"status": true,
            "message": contacts
           };
    
  };
  
  return {"status": false,
          "message": 'Контакты не найдены'
         }
}

function searchContactsByPhone(phone) {
  
  var contactSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Контакты');
  var contacts = [];
  var contactsData = contactSheet.getRange(2, 1, contactSheet.getLastRow()-1, contactSheet.getLastColumn()).getValues();
  var indexes = [];

  for (var i in contactsData){
    if (contactsData[i][config().contactPhoneColumn-1].toString().match(phone)) {
          indexes.push(i);
    }
  }
  
  if (indexes.length != 0) {
    for (var i in indexes){
      var dateDiff = null;
      var contactCreated = contactsData[indexes[i]][config().contactDateColumn-1];
      if (contactCreated)
         var dateDiff = dateDiffFromNow(contactsData[indexes[i]][config().contactDateColumn-1]);
      contacts.push({
           'dateDiff' : dateDiff,
           'id' : contactsData[indexes[i]][config().contactIdColumn-1],
           'name' : contactsData[indexes[i]][config().contactNameColumn-1],
           'phone' : contactsData[indexes[i]][config().contactPhoneColumn-1],
           'email' : contactsData[indexes[i]][config().contactEmailColumn-1],
           'park' : contactsData[indexes[i]][config().contactParkColumn-1],
           'source' : contactsData[indexes[i]][config().contactSourceColumn-1],
      });
    }
    
    return {"status": true,
            "message": contacts
           };
    
  };
  
  return {"status": false,
          "message": 'Контакты не найдены'
         }
// Поиск по телефону через bitrix api  
//  var contacts_1 = bitrixCallMakeAction('crm.contact.list', { 
//    				"filter": { "PHONE": phone},
//				   	"select": [ "DATE_CREATE", "ID", "NAME", "LAST_NAME", "PHONE", "EMAIL", "SOURCE_ID", "SOURCE_DESCRIPTION", "UF_CRM_5B6B5AF0CBDCC", "UF_CRM_1536145846"]
//                    });
//  var contacts_2 = bitrixCallMakeAction('crm.contact.list', { 
//    				"filter": { "PHONE": '+' + phone},
//				    "select": [ "DATE_CREATE", "ID", "NAME", "LAST_NAME", "PHONE", "EMAIL", "SOURCE_ID", "SOURCE_DESCRIPTION", "UF_CRM_5B6B5AF0CBDCC", "UF_CRM_1536145846"]
//                    });
//  var contacts = contacts_1.concat(contacts_2);
// 
//  
//  if (contacts){
////    contacts = formatContactBitrixToWeb(contacts);
//    Logger.log(contacts);
//    
//    return {"status": true,
//            "message": contacts
//           }
//  }
//  
//    return {"status": false,
//          "message": 'Контакты не найдены'
//         }
  
}

function newRecord(data){
  var recordsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Записи');
  var currentDate = Utilities.formatDate(new Date, Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm:ss');
  var dataArray = [];
  var productArray = {
    'ids': '',
    'names':'',
    'prices':'',
    'quantity':''
  };
  
  data[0].status_id = bitrixCallGetSourceId(data[0].source);
  
  try{
    for (var i in data[1]){
      if (data[1][i]){
         productArray.ids += data[1][i].id + ';';
         productArray.names += data[1][i].name + ';';
         productArray.prices +=data[1][i].price + ';';
         productArray.quantity +=data[1][i].quantity + ';';
      }
    }
      
    dataArray = [
        currentDate,
        data[0].id,
        data[0].name,
        data[0].phone,
        data[0].park,
        data[2],
        data[0].newSource ? data[0].newSource.name : data[0].source,
        data[0].newSource ? data[0].newSource.status_id : data[0].status_id,
        productArray.ids.replace(/;$/, ''),
        productArray.names.replace(/;$/, ''),
        productArray.prices.replace(/;$/, ''),
        productArray.quantity.replace(/;$/, ''),
      ];
         
    recordsSheet.appendRow(dataArray);
      
      
    bitrixCallAddDeal(dataArray);
    
      
    return {
             "status": true,
             "message":  'Данные добавлены успешно'
           };
  }
  catch(e){
     return {
              "status": false,
              "message":  'Ошибка сервера'
            };
  }
}



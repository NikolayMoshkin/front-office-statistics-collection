function bitrixCallGetRequest(action, data){
 
  var options = '?';
  
  for (var i in data){
    options += '&' + i + '=' + data[i]
  }
  var url = "https://vysotnygorod.bitrix24.ru/rest/" + config().bitrix_portal_id + "/" + config().bitrix_webhook_key + "/" + action + options;
  
  var response = JSON.parse(UrlFetchApp.fetch(url));

  return response;
}

function bitrixCallMakeAction(action, data){
  
  var url = "https://vysotnygorod.bitrix24.ru/rest/" + config().bitrix_portal_id + "/" + config().bitrix_webhook_key + "/" + action;
  
  var options = {
      'method' : 'post',
      'contentType': 'application/json',
      'muteHttpExceptions': false,
      'payload' : JSON.stringify(data)
     
  };
    
  var response = JSON.parse(UrlFetchApp.fetch(url, options));
  
  return response.result;
}

function bitrixContactHandler(event, id){

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Контакты");
  
  if (event.match(/delete/i))
     deleteContactFromSheet(id, sheet);
  
  else if (event.match(/add/i)){
    var contactData = bitrixCallMakeAction('crm.contact.get',{"id": id}); 
    var contact = formatContactBitrixSheet(contactData);
    sheet.appendRow(contact);
      
  }
  
  else if (event.match(/update/i)){
    var contactData = bitrixCallMakeAction('crm.contact.get',{"id": id});
    var allContactsData = sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).getValues();
    var foundContactRow = binarySearch2dArray(allContactsData, id, 0, allContactsData.length-1, config().contactIdColumn-1);
    var contact = formatContactBitrixSheet(contactData);
    Logger.log('Отформатированный контакт для вставки в таблицу: ' + contact)
    
    sheet.getRange(foundContactRow+2,1,1,sheet.getLastColumn()).setValues([contact]);
  }

}

function bitrixCallGetHumanFieldName(field_name, field_id){
    var response = bitrixCallMakeAction('crm.contact.fields', {});
    var items = response[field_name].items;
    for (var i in items){
       if (items[i].ID == field_id)
         return items[i].VALUE
    }
    return '';
}

function bitrixCallGetSourceDescription(source_id){
  var response = bitrixCallMakeAction('crm.status.list', {});
    
  for (var i in response){
    if (response[i].STATUS_ID == source_id)
      return response[i].NAME
  }
   return '';
}

function bitrixCallGetSourceId(source_description){
  var response = bitrixCallMakeAction('crm.status.list', {});
    
  for (var i in response){
    if (response[i].NAME == source_description)
      return response[i].STATUS_ID
  }
   return '';
}


function bitrixCallAddDeal(contact){
  
//  var contacts = getContactsToMakeDeals();
  
  var contacts = formatContactFromSheet(contact);
  
  for (var i in contacts){
    
//    var totalPrice = getTotalPrice(contacts[i]); 
//    var leadId = bitrixCallMakeAction('crm.lead.add', {
//      "fields":
//		{ 
//          "TITLE": "Касса. Статистика для Ройстат. Контакт: " + contacts[i].contact_id, 
//			"STATUS_ID": "CONVERTED",
//			"STATUS_SEMANTIC_ID": "S", 
//			"SOURCE_ID": contacts[i].source_status,
//            "SOURCE_DESCRIPTION" : contacts[i].source_description,
//			"OPENED": "N", 
//            "CONTACT_ID": contacts[i].contact_id,
//			"CURRENCY_ID": "RUB", 
//			"OPPORTUNITY": totalPrice
//		}
//    });
  
    var dealId = bitrixCallMakeAction('crm.deal.add', {
      "fields":
      { 
		"STAGE_ID": "C4:WON",
		"CATEGORY_ID": "4",
		"OPENED": "N",
		"CLOSED": "Y",
        "SOURCE_ID" : contacts[i].source_status,
        "SOURCE_DESCRIPTION" : contacts[i].source_description,
        "UF_CRM_1580196827" : contacts[i].deal.client_quantity
      }
    });
  
    bitrixCallMakeAction('crm.deal.contact.add', {
      "id": dealId,
      "fields":
      {
		"CONTACT_ID": contacts[i].contact_id
      }
    });
  
    bitrixCallMakeAction('crm.contact.update',{ 
      "id": contacts[i].contact_id,
      "fields":
      { 
		"SOURCE_ID": contacts[i].source_status,
      }
    });

    var productsRows = getFormatedProductsArray(contacts[i]);
  
    bitrixCallMakeAction('crm.deal.productrows.set',{ 
      "id": dealId,
      "rows": productsRows
    });  
  }
}



//Измененные стандартные источники Bitrix24:
//
//Реклама ПЛ парк и ТРК оффлайн - EMAIL
//Реклама общая оффлайн (маршрутки, лифты, всё что не интернет) - FACE_TRACKER
//Интернет реклама (Яндекс, Гугл, Контекст, SEO) - CALLBACK
//SMM (ВК, FB, Instagram) - RC_GENERATOR
//Блогеры - STORE
//Кудаго - SELF

 //  АЛГОРИТМ:
//crm.lead.add
//{
//		"fields":
//		{ 
//			"TITLE": "Тестовый лид Мошкин 6", 
//			"STATUS_ID": "CONVERTED",
//			"STATUS_SEMANTIC_ID": "S", 
//			"SOURCE_ID": "10",
//			"OPENED": "N", 
//			"ASSIGNED_BY_ID": 70881, 
//			"CURRENCY_ID": "RUB", 
//			"OPPORTUNITY": 12500
//		}
//}


//  crm.deal.add
//{
//	"fields":
//	{ 
//		"STAGE_ID": "C4:WON",
//		"CATEGORY_ID": "4",
//		"OPENED": "N",
//		"CLOSED": "Y",
//      "LEAD_ID": "120073",
//	}
//} 
//
//crm.deal.contact.add
//{
//	"id": 208835,
//	"fields":
//	{
//		"CONTACT_ID": 70881
//	}
//}
//
//crm.contact.update
//{ 
//	"id": 70881,
//	"fields":
//	{ 
//		"SOURCE_ID": 6
//	}
//}
//
//crm.deal.productrows.set
//{ 
//	"id": 208835, 
//	"rows":
//	[ 
//		{ "PRODUCT_ID": 1302, "PRICE": 1000.00, "QUANTITY": 1 }
//	] 
// }



//function getAllFolders(folders_array, folderId) { //рекурсивная функция
//  
//  var folders = getFolders(folderId);
//  
//  Logger.log('folders: ' + folders);
//  Logger.log('folders_array: ' + folders_array);
//  
//  if (folders != []){
//    folders_array.concat(folders);
//    for (var i in folders){
//      Logger.log(folders[i]);
//      getAllFolders(folders_array, folders[i])
//    }
//    return folders_array
//  }
//  
//  return []
//  
//}
//
//function getFolders(section_id){
//  
//  var folders = [];
//  var response = bitrixCallProductSection(section_id);
//  
//  if (response){
//    for(var i in response){
//      folders.push(response[i].ID);
//    }
//    return folders;
//  }
//  
//  return null;
//
//}
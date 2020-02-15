function formatContactBitrixSheet(contact, sheet){
   var result = [];
   var name = '';

   result.push(contact.DATE_CREATE);
   result.push(contact.ID);
  
   if (contact.NAME != undefined) name = contact.NAME;
   if (contact.LAST_NAME != undefined) name += ' ' + contact.LAST_NAME;
   (name!='')? result.push(name) : result.push('');
  
   if (contact.PHONE != undefined) result.push(contact.PHONE[0].VALUE);
   else result.push('');
  
   if (contact.EMAIL != undefined) result.push(contact.EMAIL[0].VALUE);
   else result.push('');
  
   if (contact.UF_CRM_5B6B5AF0F1A53 != false) {
      var kidName = contact.UF_CRM_5B6B5AF0F1A53.join();
      result.push(kidName);
    } else result.push('');
  
   if (contact.UF_CRM_5B6B5AF113262 != false) {
      var kidBD = [];
      for (var i = 0; i<contact.UF_CRM_5B6B5AF113262.length; i++){
        kidBD.push(Utilities.formatDate(new Date(contact.UF_CRM_5B6B5AF113262[i]), 'Moskow', "dd.MM.yyyy"));
      }
      kidBD = kidBD.join().toString();
      result.push(kidBD);
   } else result.push('');
  
   if (contact.UF_CRM_1536145846 == 688)
      result.push('Зебратут');
    else if (contact.UF_CRM_1536145846 == 686)
      result.push('ВГ ПЛ');
    else if (contact.UF_CRM_1536145846 == 694)
      result.push('ВГ ГК');
    else if (!contact.UF_CRM_1536145846)
      result.push('Не указан');
  
   var howKnowAboutUs = bitrixCallGetHumanFieldName('UF_CRM_5B6B5AF0CBDCC', contact.UF_CRM_5B6B5AF0CBDCC);
   result.push(howKnowAboutUs);
  
   var source = bitrixCallGetSourceDescription(contact.SOURCE_ID);
   result.push(source);

   return result;
 
}

function formatContactFromSheet(contactData){
  
  var contact = {
      "date" : contactData[0],
      "contact_id" : contactData[1],
      "source_description" : contactData[6],
      "source_status" : contactData[7],
      "products" : {
        "ids": contactData[8].toString().split(';'),
        "prices": contactData[10].toString().split(';'),
        "quantities" : contactData[11].toString().split(';'),
         },
      "deal" : {
        "client_quantity" : parseInt(contactData[5]),
      }
    };
  
  return [contact];
  
}


function getFormatedProductsArray(contact){
  
  var productsArray = [];
  
  for (var i in contact.products.ids)
  {
    productsArray.push({
      "PRODUCT_ID": contact.products.ids[i],
      "PRICE": contact.products.prices[i],
      "QUANTITY": contact.products.quantities[i]
    })
  }
  return productsArray;
}

function dateDiffFromNow(date){
  var dateDiff = Math.floor((new Date().getTime() - new Date(date).getTime())/1000/60);

  return dateDiff + ' минут назад'
  
}


function binarySearch2dArray (arr, x, start, end, column) { 
    // Base Condition 
    if (start > end) return false; 
   
    // Find the middle index 
    var mid = Math.floor((start + end)/2); 
   
    // Compare mid with given key x 
    if (arr[mid][column] == x) {
         Logger.log('Binary search. Found index: ' + mid);
         return mid;
    }
          
    // If element at mid is greater than x, 
    // search in the left half of mid 
    if(arr[mid][column] > x) {
        return binarySearch2dArray(arr, x, start, mid-1, column); 
    }
    else{
        // If element at mid is smaller than x, 
        // search in the right half of mid 
        return binarySearch2dArray(arr, x, mid+1, end, column); 
    }
}

function deleteContactFromSheet(id, sheet){
  
    var data = sheet.getDataRange().getValues();
    
    for (var i=0; i < data.length; i++){
      if (data[i][config().contactIdColumn] == id) {
        sheet.deleteRow(i+1);
        break;
      }
    }
}


function getContactsToMakeDeals(contacts){
  
  var contactsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Записи');
  
  var contactsData = contactsSheet.getRange(contactsSheet.getLastRow(), 1, 1, contactsSheet.getLastColumn()).getValues();
  var contacts = [];
  
  for (var i in contactsData){
    contacts.push({
       "date" : contactsData[i][0],
      "contact_id" : contactsData[i][1],
      "source_description" : contactsData[i][6],
      "source_status" : contactsData[i][7],
      "products" : {
        "ids": contactsData[i][8].toString().split(';'),
        "prices": contactsData[i][10].toString().split(';'),
        "quantities" : contactsData[i][11].toString().split(';'),
         },
      "deal" : {
        "client_quantity" : parseInt(contactsData[i][5]),
      }
    });
  }
  
  Logger.log(contacts);
  return contacts;
  
}

//function getTotalPrice(contact){
//  var totalPrice = 0;
//  
//  for (var i in contact.products.ids)
//  {
//    totalPrice += parseInt(contact.products.prices[i]*contact.products.quantities[i]);
//  }
//  
//  return totalPrice
//}


//
//function formatContactBitrixToWeb(inputContacts){
//   var contacts = [];
//  
//   for (var i in inputContacts){
//         var howToKnow = bitrixCallGetHumanFieldName('UF_CRM_5B6B5AF0CBDCC', inputContacts[i].UF_CRM_5B6B5AF0CBDCC);
//         var park = bitrixCallGetHumanFieldName('UF_CRM_1536145846',inputContacts[i].UF_CRM_1536145846);
//         var source = bitrixCallGetSourceDescription(inputContacts[i].SOURCE_ID);
//         var dateDiff = dateDiffFromNow(inputContacts[i].DATE_CREATE);
//         contacts.push({
//           'dateDiff' : dateDiff,
//           'id' : inputContacts[i].ID,
//           'name' : inputContacts[i].NAME + ' ' + inputContacts[i].LAST_NAME ,
//           'phone' :  inputContacts[i].PHONE ? inputContacts[i].PHONE[0].VALUE: '',
//           'email' : inputContacts[i].EMAIL ? inputContacts[i].EMAIL[0].VALUE : '',
//           'park' : park,
//           'howToKnow' : howToKnow,
//           'source' : source,
//         });
//    }
//  
//  return contacts;
//}

const Nexmo = require('nexmo')

class SmsAPI{

  /**
   *  @param {PhoneNumber} phoneNumberDestination
   *  @param {string} content
   */
  static sendSms(smsProvider, smsApikey, smsApiSecret, phoneNumberDestination, content, returnFunc){
      if(smsProvider==="nexmo") SmsAPI.nexmo(smsApikey, smsApiSecret, phoneNumberDestination, content, returnFunc)
  }

  static nexmo(smsApikey, smsApiSecret, phoneNumberDestination, content, returnFunc){
    const nexmo = new Nexmo({
        apiKey: smsApikey,
        apiSecret: smsApiSecret
      })
  
    nexmo.message.sendSms("Mono", phoneNumberDestination, content, (err, responseData) => {
        returnFunc(err, responseData)
    })
  }
}
module.exports = SmsAPI;
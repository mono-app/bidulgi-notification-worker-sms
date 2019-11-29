const Nexmo = require('nexmo')

class SmsAPI{

  /**
   *  @param {PhoneNumber} phoneNumberDestination
   *  @param {string} content
   */
  static sendSms(phoneNumberDestination, content){
    const nexmo = new Nexmo({
      apiKey: process.env.NEXMO_API_KEY,
      apiSecret: process.env.NEXMO_API_SECRET
    })

    nexmo.message.sendSms("Mono", phoneNumberDestination, content, (err, responseData) => {
        if (err) {
            console.log(err);
            throw err
        } else {
            if(responseData.messages[0]['status'] === "0") {
                console.log("Message sent successfully.");
            } else {
                console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                throw new CustomError('sms-api/error', responseData.messages[0]['error-text'])
            }
        }
    })

  }
}
module.exports = SmsAPI;
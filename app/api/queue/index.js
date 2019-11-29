class QueueAPI{

  /**
   * @param {string} recipientType 
   */
  static getQueue(recipientType){
    const queueName = (recipientType==="phoneNumber")? "sms.queue" : (recipientType==="mono")? "mono.queue" : "email.queue"
    return queueName;
  }
}
module.exports = QueueAPI;
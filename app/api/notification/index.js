const Notification = require("@app/entities/notification");
const StatusUtils = require("@app/utils/status");
const uuid = require("uuid/v4");
const moment = require("moment");
const DatabaseAPI = require("@app/api/database");
const UserAPI = require("@app/api/user")
const SmsAPI = require("@app/api/sms")

class NotificationAPI{

  static parseQueryResponse(queryResponse){
    return queryResponse.rows.map((response) => Notification.fromDatabase(response).data)
  }

  /**
   * 
   * @param {Notification} notification 
   */
  static async addSchedule(notification){
    const smsApiKey = (notification.sms)? notification.sms.apiKey : null
    const smsApiSecret = (notification.sms)? notification.sms.apiSecret : null
    const smsProvider = (notification.sms)? notification.sms.provider : null
    const smsSenderId = (notification.sms)? notification.sms.senderId : null
    const smtpHost = (notification.smtp)? notification.smtp.host : null
    const smtpPort = (notification.smtp)? notification.smtp.port : null
    const smtpUsername = (notification.smtp)? notification.smtp.username : null
    const smtpPassword = (notification.smtp)? notification.smtp.password : null
    const extraData = (notification.extraData)? notification.extraData : null
    
    const notificationId = await DatabaseAPI.query(async (client) => {
      const result = await client.query(`INSERT INTO notifications 
      ("id", "creatorProvider", "creatorId", "recipientType", "recipientId", "smsProvider", "smsApiKey", "smsSenderId", 
      "sentTime", "channel", "content", "title", "status", "createdAt", "smsApiSecret", "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", 
      "serverSentTime", "updatedAt", "deletedAt","extraData") 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NULL, NULL, NULL, $20) RETURNING id`, 
      [ uuid(), notification.creator.provider, notification.creator.id, notification.recipient.type, notification.recipient.id, 
      smsProvider, smsApiKey, smsSenderId, notification.sentTime, notification.channel, notification.content, 
      notification.title, notification.status, moment().unix(), smsApiSecret, smtpHost, smtpPort, smtpUsername, smtpPassword, extraData ]);
      return result.rows[0].id
    });
    return notificationId
  }
  
  /**
   * 
   * @param {String} notificationId 
   */
  static async getDetailById(creatorId, notificationId){
    return await DatabaseAPI.query(async (client) => {
      const queryResponse = await client.query(`SELECT * FROM notifications WHERE "id" = $1 AND "creatorId" = $2`, [ notificationId, creatorId ]);
      return Promise.resolve(NotificationAPI.parseQueryResponse(queryResponse)[0]);
    })
  }

  /**
   * 
   * @param {string} creatorId 
   * @param {string} status 
   * @param {bigint} dateStart 
   * @param {bigint} dateEnd 
   * @param {string} orderBy 
   * @param {int} limit 
   * @param {int} offset 
   */
  static async listByCreatorId(creatorId, status=null, dateStart=null, dateEnd=null, orderBy="DESC", limit=10, offset=0){
    return await DatabaseAPI.query(async (client) => {
      const statusQuery = (status)? ` AND "status" = '${status}' ` : ""
      const dateStartQuery = (dateStart)? ` AND "createdAt" >= ${dateStart} ` : ""
      const dateEndQuery = (dateEnd)? ` AND "createdAt" <= ${dateEnd} ` : ""
      const queryResponse = await client.query(`SELECT * FROM notifications 
      WHERE "creatorId" = $1 ${statusQuery} ${dateStartQuery} ${dateEndQuery} 
      ORDER BY "createdAt" ${orderBy} LIMIT ${limit} OFFSET ${offset}`, 
      [ creatorId ]);
      return Promise.resolve(NotificationAPI.parseQueryResponse(queryResponse));
    })
  }

  /**
   * 
   * @param {string} status 
   * @param {bigint} dateStart 
   * @param {bigint} dateEnd 
   * @param {string} orderBy 
   * @param {int} limit 
   * @param {int} offset 
   */
  static async list(status=null, dateStart=null, dateEnd=null, orderBy="ASC", limit=10, offset=0){
    return await DatabaseAPI.query(async (client) => {
      const statusQuery = (status)? ` "status" = '${status}' ` : " "
      const dateStartQuery = (dateStart)? ` AND "createdAt" >= ${dateStart} ` : " "
      const dateEndQuery = (dateEnd)? ` AND "createdAt" <= ${dateEnd} ` : " " 
      const queryResponse = await client.query(`SELECT * FROM notifications 
      WHERE ${statusQuery} ${dateStartQuery} ${dateEndQuery} 
      ORDER BY "createdAt" ${orderBy} LIMIT ${limit} OFFSET ${offset}`, 
      []);
      return Promise.resolve(NotificationAPI.parseQueryResponse(queryResponse));
    })
  }
  
  /**
   * 
   * @param {string} notificationId 
   */
  static async updateStatusNotificationById(notificationId, status){
    return await DatabaseAPI.query(async (client) => {
      return await client.query(`UPDATE notifications 
      SET "status" = '${status}' 
      WHERE "id" = $1`, [ notificationId ]);
    })
  }

  /**
   * 
   * @param {string} creatorId 
   * @param {string} notificationId 
   */
  static async deleteById(creatorId, notificationId){
    return await DatabaseAPI.query(async (client) => {
      return await client.query(`UPDATE notifications 
      SET "status" = '${StatusUtils.DELETED}', "deletedAt" = $1
      WHERE "status" = '${StatusUtils.QUEUEING}' AND "id" = $2 AND "creatorId" = $3`, [ moment().unix(), notificationId, creatorId ]);
    })
  }

  /**
   * 
   * @param {Notification} notification 
   */
  static async pushNotification(notification){
    const extraData = (notification.extraData)? JSON.parse(notification.extraData): null
    const channelId = (extraData.channel)? extraData.channel.id : null
    const user = UserAPI.getDetailById(notification.receiver.id)

    message = {
      token: user.tokenInformation.messagingToken,
      android: { notification: { channelId }, priority: "high" },
      data: extraData,
      notification: { title: notification.title, body: notification.content }
    }
    return admin.messaging().send(message);
  }

  /**
   * 
   * @param {Notification} notification 
   */
  static async sendSms(notification){
    SmsAPI.sendSms(notification.recipient.id, notification.content)
  }

}
module.exports = NotificationAPI;
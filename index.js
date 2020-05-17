const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));

const PAYTM_STAGING = 'https://securegw-stage.paytm.in/order/process';
const PAYTM_PROD = 'https://securegw.paytm.in/order/process';
const INDUSTRY_TYPE_ID = 'Retail';
const CHANNEL_ID = 'WEB';
const WEBSITE_STAGING = 'WEBSTAGING';
const WEBSITE_PROD = 'DEFAULT';

const PayTM = ({ merchantId, merchantKey, amount, callbackUrl, test, onSuccess, onFailure }) => {
  const endPoint = test ? PAYTM_STAGING : PAYTM_PROD;
  const params = {
    MID: merchantId,
    WEBSITE: test ? WEBSITE_STAGING : WEBSITE_PROD,
    CUST_ID: `-`,
    MOBILE_NO: '-',
    EMAIL: '-',
    INDUSTRY_TYPE_ID,
    CHANNEL_ID,
    TXN_AMOUNT: amount,
    CALLBACK_URL: callbackUrl + '/process',
  };
  return router
    .get('/', async (req, res) => {
      const p = {...params, ORDER_ID: getCurrentTimeStamp() }
      genChecksum(p, merchantKey, cs => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(template(endPoint, p, cs));
        res.end();
      });
    })
    .post('/process', (req, res) => {
      const { STATUS } = req.body;
      if (STATUS && STATUS === 'TXN_SUCCESS') onSuccess(res);
      else onFailure(res);
    });
};

const genChecksum = (params, key, cb) => {
  const data = paramsToString(params);
  // eslint-disable-next-line no-magic-numbers, handle-callback-err
  genSalt(4, (err, salt) => {
    const sha256 = crypto.createHash('sha256').update(data + salt).digest('hex');
    const checkSum = sha256 + salt;
    cb(encrypt(checkSum, key));
  });
};

const genSalt = (length, cb) => {
  // eslint-disable-next-line no-magic-numbers
  crypto.randomBytes((length * 3.0) / 4.0, (err, buf) => {
    var salt;
    if (!err) salt = buf.toString("base64");
    cb(err, salt);
  });
};

const encrypt = (data, key) => {
  var iv = '@@@@&&&&####$$$$';
  var algo = '256';
  switch (key.length) {
    // eslint-disable-next-line no-magic-numbers
    case 16:
      algo = '128';
      break;
    // eslint-disable-next-line no-magic-numbers
    case 24:
      algo = '192';
      break;
    // eslint-disable-next-line no-magic-numbers
    case 32:
      algo = '256';
      break;
  }

  const cipher = crypto.createCipheriv('AES-' + algo + '-CBC', key, iv);
  const encrypted = cipher.update(data, 'binary', 'base64') + cipher.final('base64');
  return encrypted;
};

const paramsToString = params => {
  var data = '';
  var tempKeys = Object.keys(params);
  tempKeys.sort();
  tempKeys.forEach(key => {
    data += params[key] + '|';
  });
  return data;
};

const template = (endPoint, attrs, checksumHash) => {
  let inputs = '';
  for (let attr in attrs) inputs += `<input type="hidden" name="${attr}" value="${attrs[attr]}"/>`;

  return `<html>
    <form method="post" action="${endPoint}" name="paytm_form">
    ${inputs}
    <input type="hidden" name="CHECKSUMHASH" value="${checksumHash}"/>
    </form>
    <script>document.paytm_form.submit();</script>
  </html>`;
};

const getCurrentTimeStamp = () => new Date().getTime();

export default PayTM;

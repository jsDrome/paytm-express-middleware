# Express middleware for PAYTM payment gateway

## Usage

```
import PayTM from '@jsdrome/paytm-express-middleware';

const payTM = PayTM({
  merchantId: '12345',
  merchantKey: '12345',
  amount: 100,
  callbackUrl: 'https://jsdrome.com/pay,
  onSuccess: res => res.redirect('/?payment=success'),
  onFailure: res => res.redirect('/?payment=failure'),
  test: false,
});
```

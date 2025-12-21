# Moyasar Webhook Setup

## للـ Production:

1. **في Moyasar Dashboard:**

   - اذهب إلى Settings → Webhooks
   - أضف webhook URL: `https://yourdomain.com/api/payments/webhook/moyasar`
   - اختر events: `payment.paid`

2. **للـ Local Testing (باستخدام ngrok):**

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Add to Moyasar: https://abc123.ngrok.io/api/payments/webhook/moyasar
```

## الـ Flow الجديد:

```
User → Subscribe → Moyasar Payment
    ↓
Payment Success
    ↓
Moyasar → Webhook → Backend /api/payments/webhook/moyasar
    ↓
Backend verifies & activates subscription
    ↓
User can return to dashboard manually
```

## للتجربة الآن (بدون webhook):

استخدم الـ manual activation:

1. افتح `/payment/success`
2. الصق invoice ID
3. يتفعّل الاشتراك

## ملاحظة:

- Webhooks تشتغل في production فقط (مع domain حقيقي)
- Test mode يحتاج ngrok للـ webhooks
- الـ manual activation هو الحل المؤقت للـ development

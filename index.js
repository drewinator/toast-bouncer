const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/e3458at6n66xwg9a7crgyhpr7hbpfp1a';

app.post('/toast-webhook', async (req, res) => {
    try {
        const orderData = req.body.details?.order;
        const checks = orderData?.checks || [];

        // 1. Logic Gate: Find if ANY check in the order is CLOSED and has a PROMO CODE
        const validCheck = checks.find(check => 
            check.paymentStatus === 'CLOSED' && 
            check.appliedDiscounts.some(d => d.appliedPromoCode !== null)
        );

        if (validCheck) {
            console.log(`Order ${orderData.guid} passed! Sending to Make.`);
            
            // Forward the data to Make.com
            await axios.post(MAKE_WEBHOOK_URL, req.body);
        } else {
            // This is where you save money. Nothing is sent to Make.
            console.log(`Order ${orderData?.guid || 'unknown'} ignored (Open or No Promo).`);
        }

        // Always tell Toast you received the data
        res.status(200).send('Received');

    } catch (error) {
        console.error('Error processing webhook:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bouncer active on port ${PORT}`));

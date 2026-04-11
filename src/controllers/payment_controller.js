import stripe from "../helpers/stripe.js";

export const createPaymentIntent = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ ok: false, msg: "Debes enviar el monto" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        });

        return res.status(200).json({
            ok: true,
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error("❌ Error Stripe:", error);
        return res.status(500).json({ ok: false, msg: "Error creando el pago" });
    }
};
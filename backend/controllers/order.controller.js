// import Stripe from 'stripe'; // Comment out this line

import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        const payload = list_items.map(el => {
            return({
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : el.productId._id, 
                product_details : {
                    name : el.productId.name,
                    image : el.productId.image
                } ,
                paymentId : "",
                payment_status : "CASH ON DELIVERY",
                delivery_address : addressId ,
                subTotalAmt  : subTotalAmt,
                totalAmt  : totalAmt,
            });
        });

        const generatedOrder = await OrderModel.insertMany(payload);

        ///remove from the cart
        const removeCartItems = await CartProductModel.deleteMany({ userId : userId });
        const updateInUser = await UserModel.updateOne({ _id : userId }, { shopping_cart : [] });

        return response.json({
            message : "Order successfully",
            error : false,
            success : true,
            data : generatedOrder
        });

    } catch (error) {
        return response.status(500).json({
            message : error.message || error ,
            error : true,
            success : false
        });
    }
}

export const pricewithDiscount = (price, dis = 1) => {
    const discountAmout = Math.ceil((Number(price) * Number(dis)) / 100);
    const actualPrice = Number(price) - Number(discountAmout);
    return actualPrice;
}

export async function paymentController(request, response) {
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        const user = await UserModel.findById(userId);

        const line_items = list_items.map(item => {
            return {
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.productId.name,
                        images: item.productId.image,
                        metadata: {
                            productId: item.productId._id
                        }
                    },
                    unit_amount: pricewithDiscount(item.productId.price, item.productId.discount) * 100
                },
                adjustable_quantity: {
                    enabled: true,
                    minimum: 1
                },
                quantity: item.quantity
            };
        });

        const params = {
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: {
                userId: userId,
                addressId: addressId
            },
            line_items: line_items,
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        };

        // Commented out Stripe session creation
        // const session = await Stripe.checkout.sessions.create(params);

        return response.status(200).json({ message: "Payment session would be created here" });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

const getOrderProductItems = async ({
    lineItems,
    userId,
    addressId,
    paymentId,
    payment_status,
}) => {
    const productList = [];

    if (lineItems?.data?.length) {
        for (const item of lineItems.data) {
            // Commented out Stripe product retrieval
            // const product = await Stripe.products.retrieve(item.price.product);

            const paylod = {
                userId: userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: item.price.metadata.productId,
                product_details: {
                    name: item.price.product_data.name,
                    image: item.price.product_data.images,
                },
                paymentId: paymentId,
                payment_status: payment_status,
                delivery_address: addressId,
                subTotalAmt: Number(item.amount_total / 100),
                totalAmt: Number(item.amount_total / 100),
            };

            productList.push(paylod);
        }
    }

    return productList;
};

// http://localhost:8080/api/order/webhook
export async function webhookStripe(request, response) {
    const event = request.body;
    const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY;

    console.log("event", event);

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // Commented out Stripe line items listing
            // const lineItems = await Stripe.checkout.sessions.listLineItems(session.id);
            const userId = session.metadata.userId;
            const orderProduct = await getOrderProductItems(
                {
                    lineItems: {}, // Temporarily using an empty object since we're not fetching Stripe data
                    userId: userId,
                    addressId: session.metadata.addressId,
                    paymentId: session.payment_intent,
                    payment_status: session.payment_status,
                });

            const order = await OrderModel.insertMany(orderProduct);

            console.log(order);
            if (Boolean(order[0])) {
                const removeCartItems = await UserModel.findByIdAndUpdate(userId, {
                    shopping_cart: []
                });
                const removeCartProductDB = await CartProductModel.deleteMany({ userId: userId });
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
}

export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId; // order id

        const orderlist = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address');

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function getAllOrdersController(request, response) {
    try {
        // Fetch all orders from the OrderModel
        const allOrders = await OrderModel.find().sort({ createdAt: -1 }).populate('userId delivery_address');

        return response.json({
            message: "All orders fetched successfully",
            data: allOrders,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

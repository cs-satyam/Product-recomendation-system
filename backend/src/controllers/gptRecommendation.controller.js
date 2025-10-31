const mongoose = require('mongoose');
const Product = require('../../src/models/product.model');
const Order = require('../../src/models/order.model');
const Coupon = require('../../src/models/coupon.model')
const Cart = require('../../src/models/cart.model')
const { GoogleGenAI } = require("@google/genai");

async function gptRecommendation (req, res){

    const userId = req.user.userId;
    const allProducts = await Product.find()
    const allOrders = await Order.find({ retailer: userId }).populate('retailer');
    const allCartItems = await Cart.findOne({ user: userId }).populate('items.product');
    const allCoupons = await Coupon.find()

    const prompt =`
        You are a professional e-commerce recommendation system.

        Given the following data:
        - All Products: ${JSON.stringify(allProducts)}
        - User Orders: ${JSON.stringify(allOrders)}
        - User Cart Items: ${JSON.stringify(allCartItems)}
        - Available Coupons: ${JSON.stringify(allCoupons)}

        Your task:
        - Recommend atleast 5 products the user is most likely to buy from Product table.
        - You also recommend atleast 5 products the user is most likly to buy and keep stock as 0 as it is not in my product list and image as "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg".
        - The items recommended from your side will have a random unique id, relevent name, price, 0 in stock, a distributer name, a valid and working image url and a description.
        - Apply or make recommendation as happen in Market Basket Analysis / association rules.
        - Use logical relationships between products, such as:
        - Items frequently bought together (Market Basket Analysis / association rules)
        - Product we have
        - Current order we have
        - Applicable coupons
        - Each recommendation should make sense in context (e.g., complementary items, frequent combinations).

        Recommend between 5 and 10 products the user is most likely to buy.

        **Important:** 
        - Return only valid JSON. 
        - Do NOT include any markdown, backticks, or extra text. 
        - Do NOT include explanations or notes. 
        - Use this exact JSON structure:

        [
            {
                "id": "rec1",
                "name": "Wireless Keyboard",
                "price": 3500,
                "stock": 50,
                "distributor": { "name": "Tech Solutions" },
                "image": "https://images.pexels.com/photos/177212/pexels-photo-177212.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                "description": "Ergonomic keyboard with quiet, low-profile keys."
            }
        ]
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    res.json({
        items : JSON.parse(response.text)
    })
}

module.exports = {
    gptRecommendation
}